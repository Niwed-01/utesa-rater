import { createClient } from "@/lib/supabase/server"
import type { Json } from "@/types/database.types"

export type AuditAction =
  | "admin:hide_post"
  | "admin:show_post"
  | "admin:delete_post"
  | "admin:hide_comment"
  | "admin:show_comment"
  | "admin:delete_comment"
  | "admin:ban_user"
  | "admin:unban_user"
  | "admin:set_admin"
  | "admin:remove_admin"
  | "admin:delete_user"
  | "admin:update_report"
  | "admin:delete_report"
  | "admin:merge_professors"

export async function logAudit(
  adminId: string,
  action: AuditAction,
  targetId: string,
  metadata?: Json,
) {
  const supabase = await createClient()

  const { error } = await supabase.from("audit_log").insert({
    admin_id: adminId,
    action,
    target_id: targetId,
    metadata: metadata ?? null,
  })

  if (error) {
    console.error(`[AUDIT FAIL] ${action} on ${targetId}:`, error.message)
  }
}
