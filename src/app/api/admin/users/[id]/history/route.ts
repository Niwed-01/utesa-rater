import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin()
  if (auth.response) return auth.response

  const { id } = await params

  const supabase = await createClient()

  const [postsRes, commentsRes, votesRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, alias, title, body, is_hidden, vote_score, created_at")
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("comments")
      .select("id, alias, body, is_hidden, vote_score, created_at, post_id")
      .eq("author_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("votes")
      .select("id, post_id, comment_id, value, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  return NextResponse.json({
    posts: postsRes.data ?? [],
    comments: commentsRes.data ?? [],
    votes: votesRes.data ?? [],
  })
}
