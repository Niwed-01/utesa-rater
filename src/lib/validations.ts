import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
})

export const registroSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
})

export const TAGS = [
  "Explica bien",
  "Difícil",
  "Accesible",
  "Deja muchos trabajos",
  "Exámenes justos",
  "Recomendado",
  "Volvería a tomar",
] as const

export const postSchema = z.object({
  professor_id: z.string().uuid(),
  class_id: z.string().uuid(),
  title: z.string().max(200).optional(),
  body: z.string().min(10, "Mínimo 10 caracteres").max(3000, "Máximo 3000 caracteres"),
  tags: z.array(z.enum(TAGS)).max(6).default([]),
  volveria_a_tomar: z.boolean().default(true),
  rating_claridad: z.number().int().min(1).max(5),
  rating_justicia: z.number().int().min(1).max(5),
  rating_puntualidad: z.number().int().min(1).max(5),
  rating_exigencia: z.number().int().min(1).max(5),
  rating_disponibilidad: z.number().int().min(1).max(5),
  semester: z.string().regex(/^\d{4}-[123]0$/, "Selecciona un trimestre válido"),
})

export const commentSchema = z.object({
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional().nullable(),
  body: z.string().min(1, "No puede estar vacío").max(1000, "Máximo 1000 caracteres"),
})

export const voteSchema = z.object({
  post_id: z.string().uuid().optional(),
  comment_id: z.string().uuid().optional(),
  value: z.number().int().refine((v) => v === 1 || v === -1 || v === 0, {
    message: "Valor debe ser 1, -1 o 0",
  }),
}).refine(
  (data) => (data.post_id !== undefined) !== (data.comment_id !== undefined),
  { message: "Debe especificar post_id o comment_id (no ambos)" },
)

export const reportSchema = z.object({
  post_id: z.string().uuid().optional().nullable(),
  comment_id: z.string().uuid().optional().nullable(),
  reason: z.string().min(3, "Mínimo 3 caracteres").max(500, "Máximo 500 caracteres"),
}).refine(
  (data) => (data.post_id != null) !== (data.comment_id != null),
  { message: "Debe especificar post_id o comment_id (no ambos)" },
)
