"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function usePosts(professorId?: string) {
  return useQuery({
    queryKey: ["posts", professorId],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("posts_public")
        .select("*")

      if (professorId) {
        query = query.eq("professor_id", professorId)
      }

      const { data, error } = await query.order("created_at", { ascending: false }).limit(50)
      if (error) throw error
      return data
    },
    enabled: true,
  })
}

export function useProfessorRating(id: string) {
  return useQuery({
    queryKey: ["professor-rating", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("posts_public")
        .select("rating_claridad, rating_puntualidad, rating_exigencia, rating_disponibilidad, rating_justicia, rating_general")
        .eq("professor_id", id)

      if (error) throw error

      if (!data || data.length === 0) {
        return {
          count: 0,
          avg_claridad: 0,
          avg_puntualidad: 0,
          avg_exigencia: 0,
          avg_disponibilidad: 0,
          avg_justicia: 0,
          avg_general: 0,
        }
      }

      const sum = (key: keyof typeof data[0]) =>
        data.reduce((acc, row) => acc + Number(row[key]), 0)

      return {
        count: data.length,
        avg_claridad: sum("rating_claridad") / data.length,
        avg_puntualidad: sum("rating_puntualidad") / data.length,
        avg_exigencia: sum("rating_exigencia") / data.length,
        avg_disponibilidad: sum("rating_disponibilidad") / data.length,
        avg_justicia: sum("rating_justicia") / data.length,
        avg_general: sum("rating_general") / data.length,
      }
    },
    enabled: !!id,
  })
}


