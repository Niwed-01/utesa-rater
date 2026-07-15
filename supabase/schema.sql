-- ============================================================
-- UTESA RATER - Schema de base de datos (Supabase / PostgreSQL)
-- App de reseñas anónimas de profesores con alias aleatorio
-- por publicación y comentario.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PERFILES (extiende auth.users de Supabase)
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_banned boolean not null default false,
  is_admin boolean not null default false,   -- puede revisar reportes y ocultar contenido
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
exception
  when unique_violation then
    return new;
  when others then
    raise warning 'handle_new_user: % %', sqlstate, sqlerrm;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Función auxiliar security definer para evitar recursión infinita en RLS
-- cuando policies sobre profiles necesitan consultar profiles.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- ------------------------------------------------------------
-- 2. CARRERAS (antes "departments")
-- ------------------------------------------------------------
create table if not exists careers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

-- ------------------------------------------------------------
-- 3. PROFESORES
-- ------------------------------------------------------------
create table if not exists professors (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  photo_url text,
  created_at timestamptz not null default now()
);
create index if not exists idx_professors_name
  on professors using gin (to_tsvector('spanish', full_name));

-- ------------------------------------------------------------
-- 3b. RELACIÓN PROFESOR <-> CARRERA (muchos a muchos)
-- ------------------------------------------------------------
create table if not exists professor_careers (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references professors(id) on delete cascade,
  career_id uuid not null references careers(id) on delete cascade,
  unique (professor_id, career_id)
);

-- ------------------------------------------------------------
-- 4. CLASES / MATERIAS
-- ------------------------------------------------------------
create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text
);

-- ------------------------------------------------------------
-- 5. RELACIÓN PROFESOR <-> CLASE
-- ------------------------------------------------------------
create table if not exists professor_classes (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references professors(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  unique (professor_id, class_id)
);

-- ------------------------------------------------------------
-- 6. PUBLICACIONES (reseñas)
-- ------------------------------------------------------------
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  professor_id uuid not null references professors(id) on delete cascade,
  class_id uuid not null references classes(id),
  alias text not null,                       -- generado al momento de publicar
  title text,
  body text not null check (char_length(body) between 10 and 3000),
  tags text[] not null default '{}',
  volveria_a_tomar boolean not null default true,
  rating_claridad smallint not null check (rating_claridad between 1 and 5),
  rating_justicia smallint not null check (rating_justicia between 1 and 5),
  rating_puntualidad smallint default 3 check (rating_puntualidad between 1 and 5),
  rating_exigencia smallint default 3 check (rating_exigencia between 1 and 5),
  rating_disponibilidad smallint default 3 check (rating_disponibilidad between 1 and 5),
  rating_general numeric(3,2) generated always as (
    (rating_claridad + rating_justicia
     + coalesce(rating_puntualidad, 3) + coalesce(rating_exigencia, 3)
     + coalesce(rating_disponibilidad, 3)) / 5.0
  ) stored,
  semester text check (semester ~ '^\d{4}-[123]0$'),
  vote_score integer not null default 0,
  is_hidden boolean not null default false,  -- oculto por moderación tras un reporte
  created_at timestamptz not null default now()
);
create index if not exists idx_posts_professor on posts(professor_id);
create index if not exists idx_posts_created on posts(created_at desc);

-- Vista pública SIN author_id: nadie puede enlazar una reseña a una cuenta.
-- Solo muestra publicaciones que no han sido ocultadas por moderación.
drop view if exists posts_public;
create view posts_public as
  select id, professor_id, class_id, alias, title, body, tags,
         volveria_a_tomar,
         rating_claridad, rating_puntualidad, rating_exigencia,
         rating_disponibilidad, rating_justicia, rating_general,
         semester, vote_score, created_at
  from posts
  where is_hidden = false;

-- ------------------------------------------------------------
-- 7. COMENTARIOS (también con alias aleatorio propio)
-- ------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,  -- auto-referencia para respuestas anidadas
  author_id uuid not null references profiles(id) on delete cascade,
  alias text not null,
  body text not null check (char_length(body) between 1 and 1000),
  vote_score integer not null default 0,
  is_hidden boolean not null default false,  -- oculto por moderación tras un reporte
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_post on comments(post_id);
create index if not exists idx_comments_parent on comments(parent_id);

drop view if exists comments_public;
create view comments_public as
  select id, post_id, parent_id, alias, body, vote_score, created_at
  from comments
  where is_hidden = false;

-- ------------------------------------------------------------
-- 8. VOTOS (1 por usuario por publicación/comentario)
-- ------------------------------------------------------------
create table if not exists votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  value smallint not null check (value in (1, -1)),
  created_at timestamptz not null default now(),
  constraint one_target check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);
create unique index if not exists uq_vote_user_post on votes(user_id, post_id) where post_id is not null;
create unique index if not exists uq_vote_user_comment on votes(user_id, comment_id) where comment_id is not null;

-- Trigger: recalcula vote_score cada vez que cambia un voto
create or replace function recalc_vote_score() returns trigger as $$
declare
  target_post uuid;
  target_comment uuid;
begin
  target_post := coalesce(new.post_id, old.post_id);
  target_comment := coalesce(new.comment_id, old.comment_id);

  if target_post is not null then
    update posts set vote_score = (
      select coalesce(sum(value), 0) from votes where post_id = target_post
    ) where id = target_post;
  end if;

  if target_comment is not null then
    update comments set vote_score = (
      select coalesce(sum(value), 0) from votes where comment_id = target_comment
    ) where id = target_comment;
  end if;

  return null;
end;
$$ language plpgsql security definer set search_path = '';

drop trigger if exists trg_vote_change on votes;
create trigger trg_vote_change
  after insert or update or delete on votes
  for each row execute procedure recalc_vote_score();

-- ------------------------------------------------------------
-- 9. REPORTES (botón "reportar" en posts y comentarios)
-- ------------------------------------------------------------
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  comment_id uuid references comments(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 500),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'revisado', 'descartado')),
  created_at timestamptz not null default now(),
  constraint one_target_report check (
    (post_id is not null and comment_id is null) or
    (post_id is null and comment_id is not null)
  )
);
create index if not exists idx_reports_status on reports(status);
create unique index if not exists uq_report_user_post on reports(reporter_id, post_id) where post_id is not null;
create unique index if not exists uq_report_user_comment on reports(reporter_id, comment_id) where comment_id is not null;

-- ------------------------------------------------------------
-- 10. AUDITORÍA DE ACCIONES ADMIN
-- ------------------------------------------------------------
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  target_id text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_audit_admin on audit_log(admin_id);
create index if not exists idx_audit_action on audit_log(action);
create index if not exists idx_audit_created on audit_log(created_at desc);

-- Solamente admins pueden leer audit_log
alter table audit_log enable row level security;
drop policy if exists "admin_select_audit" on audit_log;
create policy "admin_select_audit" on audit_log for select
  using (public.is_admin());
-- Solo el sistema inserta (security definer en el route handler)
drop policy if exists "service_insert_audit" on audit_log;
create policy "service_insert_audit" on audit_log for insert
  with check (public.is_admin());

-- ------------------------------------------------------------
-- 11b. FUNCIÓN SEGURA PARA MERGE DE PROFESORES (transaccional)
-- ------------------------------------------------------------
create or replace function merge_professors(source_id uuid, target_id uuid) returns void as $$
begin
  update posts set professor_id = target_id where professor_id = source_id;
  delete from professor_classes pc1
    using professor_classes pc2
    where pc2.professor_id = source_id
      and pc1.professor_id = target_id
      and pc1.class_id = pc2.class_id;
  delete from professor_careers pc1
    using professor_careers pc2
    where pc2.professor_id = source_id
      and pc1.professor_id = target_id
      and pc1.career_id = pc2.career_id;
  update professor_classes set professor_id = target_id where professor_id = source_id;
  update professor_careers set professor_id = target_id where professor_id = source_id;
  delete from professors where id = source_id;
end;
$$ language plpgsql security definer set search_path = '';

-- ------------------------------------------------------------
-- 12. CONSTRAINT: photo_url no puede ser javascript: ni data:
-- ------------------------------------------------------------
alter table professors drop constraint if exists safe_photo_url;
alter table professors add constraint safe_photo_url
  check (photo_url is null or photo_url !~ '^\s*(javascript|data):');

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table professors enable row level security;
alter table professor_careers enable row level security;
alter table classes enable row level security;
alter table professor_classes enable row level security;
alter table careers enable row level security;
alter table reports enable row level security;

-- Perfiles: solo el dueño ve/edita/inserta el suyo
drop policy if exists "select_own_profile" on profiles;
create policy "select_own_profile" on profiles for select using (auth.uid() = id);
drop policy if exists "insert_own_profile" on profiles;
create policy "insert_own_profile" on profiles for insert with check (auth.uid() = id);
drop policy if exists "update_own_profile" on profiles;
create policy "update_own_profile" on profiles for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
    and is_banned = (select is_banned from public.profiles where id = auth.uid())
  );

-- Catálogo de profesores/clases/carreras: lectura pública
drop policy if exists "public_read_professors" on professors;
create policy "public_read_professors" on professors for select using (true);
drop policy if exists "public_read_classes" on classes;
create policy "public_read_classes" on classes for select using (true);
drop policy if exists "public_read_careers" on careers;
create policy "public_read_careers" on careers for select using (true);
drop policy if exists "public_read_profcareers" on professor_careers;
create policy "public_read_profcareers" on professor_careers for select using (true);
drop policy if exists "public_read_profclasses" on professor_classes;
create policy "public_read_profclasses" on professor_classes for select using (true);

-- Posts: insertar/editar/borrar solo el dueño. La tabla NO es legible
-- públicamente (tiene author_id); todo el mundo lee desde posts_public.
drop policy if exists "insert_own_post" on posts;
create policy "insert_own_post" on posts for insert with check (auth.uid() = author_id);
drop policy if exists "select_own_post" on posts;
create policy "select_own_post" on posts for select using (auth.uid() = author_id);
drop policy if exists "update_own_post" on posts;
create policy "update_own_post" on posts for update using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and is_hidden = (select p.is_hidden from posts p where p.id = id)
    and vote_score = (select p.vote_score from posts p where p.id = id)
  );
drop policy if exists "delete_own_post" on posts;
create policy "delete_own_post" on posts for delete using (auth.uid() = author_id);

-- Un admin puede ocultar (is_hidden) cualquier post/comentario tras revisar un reporte
drop policy if exists "admin_moderate_post" on posts;
create policy "admin_moderate_post" on posts for update
  using (public.is_admin());
drop policy if exists "admin_moderate_comment" on comments;
create policy "admin_moderate_comment" on comments for update
  using (public.is_admin());

drop policy if exists "admin_delete_professors" on professors;
create policy "admin_delete_professors" on professors for delete
  using (public.is_admin());
drop policy if exists "admin_update_professors" on professors;
create policy "admin_update_professors" on professors for update
  using (public.is_admin());
drop policy if exists "admin_insert_professors" on professors;
create policy "admin_insert_professors" on professors for insert
  with check (public.is_admin());
drop policy if exists "admin_delete_classes" on classes;
create policy "admin_delete_classes" on classes for delete
  using (public.is_admin());
drop policy if exists "admin_update_classes" on classes;
create policy "admin_update_classes" on classes for update
  using (public.is_admin());
drop policy if exists "admin_insert_classes" on classes;
create policy "admin_insert_classes" on classes for insert
  with check (public.is_admin());
drop policy if exists "admin_delete_reports" on reports;
create policy "admin_delete_reports" on reports for delete
  using (public.is_admin());
drop policy if exists "admin_delete_posts" on posts;
create policy "admin_delete_posts" on posts for delete
  using (public.is_admin());
drop policy if exists "admin_delete_comments" on comments;
create policy "admin_delete_comments" on comments for delete
  using (public.is_admin());

-- Admin puede ver todos los perfiles y editar ban/rol
drop policy if exists "admin_select_profiles" on profiles;
create policy "admin_select_profiles" on profiles for select
  using (public.is_admin());
drop policy if exists "admin_update_profile" on profiles;
create policy "admin_update_profile" on profiles for update
  using (public.is_admin());

-- Admin puede ver todos los posts (incluyendo ocultos y author_id)
drop policy if exists "admin_select_all_posts" on posts;
create policy "admin_select_all_posts" on posts for select
  using (public.is_admin());

-- Admin puede ver todos los comments (incluyendo ocultos y author_id)
drop policy if exists "admin_select_all_comments" on comments;
create policy "admin_select_all_comments" on comments for select
  using (public.is_admin());

grant select on posts_public to anon, authenticated;
grant select on comments_public to anon, authenticated;

-- Audit log: solo admins pueden leer/insertar
drop policy if exists "admin_select_audit" on audit_log;
create policy "admin_select_audit" on audit_log for select
  using (public.is_admin());
drop policy if exists "service_insert_audit" on audit_log;
create policy "service_insert_audit" on audit_log for insert
  with check (public.is_admin());

-- Comments: mismo patrón que posts
drop policy if exists "insert_own_comment" on comments;
create policy "insert_own_comment" on comments for insert with check (auth.uid() = author_id);
drop policy if exists "select_own_comment" on comments;
create policy "select_own_comment" on comments for select using (auth.uid() = author_id);
drop policy if exists "update_own_comment" on comments;
create policy "update_own_comment" on comments for update using (auth.uid() = author_id)
  with check (
    auth.uid() = author_id
    and is_hidden = (select c.is_hidden from comments c where c.id = id)
    and vote_score = (select c.vote_score from comments c where c.id = id)
  );
drop policy if exists "delete_own_comment" on comments;
create policy "delete_own_comment" on comments for delete using (auth.uid() = author_id);

-- Votos: cada quien gestiona solo los suyos
drop policy if exists "manage_own_votes" on votes;
create policy "manage_own_votes" on votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reportes: cualquier usuario autenticado puede crear los suyos y verlos;
-- solo un admin puede ver/actualizar todos (para cambiar status y moderar)
drop policy if exists "insert_own_report" on reports;
create policy "insert_own_report" on reports for insert with check (auth.uid() = reporter_id);
drop policy if exists "select_own_or_admin_report" on reports;
create policy "select_own_or_admin_report" on reports for select
  using (
    auth.uid() = reporter_id
    or public.is_admin()
  );
drop policy if exists "admin_update_report" on reports;
create policy "admin_update_report" on reports for update
  using (public.is_admin());
