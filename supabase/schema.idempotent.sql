-- ============================================================
-- UTESA RATER - Schema idempotente (se puede re-ejecutar)
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. PERFILES
-- ------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  is_banned boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- ------------------------------------------------------------
-- 2. CARRERAS
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
-- 3b. PROFESOR <-> CARRERA
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
-- 5. PROFESOR <-> CLASE
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
  alias text not null,
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
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Ensure semester column exists (in case table was created from old schema)
alter table posts add column if not exists semester text check (semester ~ '^\d{4}-[123]0$');

create index if not exists idx_posts_professor on posts(professor_id);
create index if not exists idx_posts_created on posts(created_at desc);

drop view if exists posts_public;
create view posts_public with (security_invoker) as
  select id, professor_id, class_id, alias, title, body, tags,
         volveria_a_tomar,
         rating_claridad, rating_puntualidad, rating_exigencia,
         rating_disponibilidad, rating_justicia, rating_general,
         semester, vote_score, created_at
  from posts
  where is_hidden = false;

-- ------------------------------------------------------------
-- 7. COMENTARIOS
-- ------------------------------------------------------------
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  alias text not null,
  body text not null check (char_length(body) between 1 and 1000),
  vote_score integer not null default 0,
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_comments_post on comments(post_id);

drop view if exists comments_public;
create view comments_public with (security_invoker) as
  select id, post_id, alias, body, vote_score, created_at
  from comments
  where is_hidden = false;

-- ------------------------------------------------------------
-- 8. VOTOS
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
$$ language plpgsql;

drop trigger if exists trg_vote_change on votes;
create trigger trg_vote_change
  after insert or update or delete on votes
  for each row execute procedure recalc_vote_score();

-- ------------------------------------------------------------
-- 9. REPORTES
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table if exists profiles enable row level security;
alter table if exists posts enable row level security;
alter table if exists comments enable row level security;
alter table if exists votes enable row level security;
alter table if exists professors enable row level security;
alter table if exists professor_careers enable row level security;
alter table if exists classes enable row level security;
alter table if exists professor_classes enable row level security;
alter table if exists careers enable row level security;
alter table if exists reports enable row level security;

-- Drop existing policies before recreating (to avoid duplicates)
do $$ begin
  -- Profiles
  drop policy if exists "select_own_profile" on profiles;
  drop policy if exists "insert_own_profile" on profiles;
  drop policy if exists "update_own_profile" on profiles;
  -- Professors
  drop policy if exists "public_read_professors" on professors;
  drop policy if exists "authenticated_insert_professors" on professors;
  drop policy if exists "authenticated_update_professors" on professors;
  -- Classes
  drop policy if exists "public_read_classes" on classes;
  drop policy if exists "authenticated_insert_classes" on classes;
  drop policy if exists "authenticated_update_classes" on classes;
  -- Careers
  drop policy if exists "public_read_careers" on careers;
  -- Professor_Careers
  drop policy if exists "public_read_profcareers" on professor_careers;
  drop policy if exists "authenticated_insert_profcareers" on professor_careers;
  -- Professor_Classes
  drop policy if exists "public_read_profclasses" on professor_classes;
  drop policy if exists "authenticated_insert_profclasses" on professor_classes;
  -- Posts
  drop policy if exists "insert_own_post" on posts;
  drop policy if exists "select_own_post" on posts;
  drop policy if exists "update_own_post" on posts;
  drop policy if exists "delete_own_post" on posts;
  drop policy if exists "admin_moderate_post" on posts;
  -- Comments
  drop policy if exists "insert_own_comment" on comments;
  drop policy if exists "select_own_comment" on comments;
  drop policy if exists "update_own_comment" on comments;
  drop policy if exists "delete_own_comment" on comments;
  drop policy if exists "admin_moderate_comment" on comments;
  drop policy if exists "admin_delete_professors" on professors;
  drop policy if exists "admin_update_professors" on professors;
  drop policy if exists "admin_insert_professors" on professors;
  drop policy if exists "admin_delete_classes" on classes;
  drop policy if exists "admin_update_classes" on classes;
  drop policy if exists "admin_insert_classes" on classes;
  drop policy if exists "admin_delete_reports" on reports;
  drop policy if exists "admin_delete_posts" on posts;
  drop policy if exists "admin_delete_comments" on comments;
  -- Votes
  drop policy if exists "manage_own_votes" on votes;
  -- Profiles (admin)
  drop policy if exists "admin_select_profiles" on profiles;
  drop policy if exists "admin_update_profile" on profiles;
  drop function if exists public.is_admin();
  -- Posts (admin)
  drop policy if exists "admin_select_all_posts" on posts;
  -- Comments (admin)
  drop policy if exists "admin_select_all_comments" on comments;
  -- Reports
  drop policy if exists "insert_own_report" on reports;
  drop policy if exists "select_own_or_admin_report" on reports;
  drop policy if exists "admin_update_report" on reports;
end $$;

create policy "select_own_profile" on profiles for select using (auth.uid() = id);
create policy "insert_own_profile" on profiles for insert with check (auth.uid() = id);
create policy "update_own_profile" on profiles for update using (auth.uid() = id);

create policy "public_read_professors" on professors for select using (true);
create policy "public_read_classes" on classes for select using (true);
create policy "public_read_careers" on careers for select using (true);
create policy "public_read_profcareers" on professor_careers for select using (true);
create policy "public_read_profclasses" on professor_classes for select using (true);

create policy "authenticated_insert_professors" on professors
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_insert_classes" on classes
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_insert_profclasses" on professor_classes
  for insert with check (auth.role() = 'authenticated');
create policy "authenticated_insert_profcareers" on professor_careers
  for insert with check (auth.role() = 'authenticated');

create policy "authenticated_update_professors" on professors
  for update using (auth.role() = 'authenticated');
create policy "authenticated_update_classes" on classes
  for update using (auth.role() = 'authenticated');

create policy "insert_own_post" on posts for insert with check (auth.uid() = author_id);
create policy "select_own_post" on posts for select using (auth.uid() = author_id);
create policy "update_own_post" on posts for update using (auth.uid() = author_id);
create policy "delete_own_post" on posts for delete using (auth.uid() = author_id);

create policy "admin_moderate_post" on posts for update
  using (public.is_admin());
create policy "admin_moderate_comment" on comments for update
  using (public.is_admin());

create policy "admin_delete_professors" on professors for delete
  using (public.is_admin());
create policy "admin_update_professors" on professors for update
  using (public.is_admin());
create policy "admin_insert_professors" on professors for insert
  with check (public.is_admin());
create policy "admin_delete_classes" on classes for delete
  using (public.is_admin());
create policy "admin_update_classes" on classes for update
  using (public.is_admin());
create policy "admin_insert_classes" on classes for insert
  with check (public.is_admin());
create policy "admin_delete_reports" on reports for delete
  using (public.is_admin());
create policy "admin_delete_posts" on posts for delete
  using (public.is_admin());
create policy "admin_delete_comments" on comments for delete
  using (public.is_admin());

create policy "admin_select_profiles" on profiles for select
  using (public.is_admin());
create policy "admin_update_profile" on profiles for update
  using (public.is_admin());

create policy "admin_select_all_posts" on posts for select
  using (public.is_admin());

create policy "admin_select_all_comments" on comments for select
  using (public.is_admin());

grant select on posts_public to anon, authenticated;
grant select on comments_public to anon, authenticated;

create policy "insert_own_comment" on comments for insert with check (auth.uid() = author_id);
create policy "select_own_comment" on comments for select using (auth.uid() = author_id);
create policy "update_own_comment" on comments for update using (auth.uid() = author_id);
create policy "delete_own_comment" on comments for delete using (auth.uid() = author_id);

create policy "manage_own_votes" on votes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "insert_own_report" on reports for insert with check (auth.uid() = reporter_id);
create policy "select_own_or_admin_report" on reports for select
  using (
    auth.uid() = reporter_id
    or public.is_admin()
  );
create policy "admin_update_report" on reports for update
  using (public.is_admin());
