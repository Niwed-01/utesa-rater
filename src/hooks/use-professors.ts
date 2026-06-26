"use client"

import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useProfessors(search?: string, careerId?: string) {
  return useQuery({
    queryKey: ["professors", search, careerId],
    queryFn: async () => {
      const supabase = createClient()
      let query = supabase
        .from("professors")
        .select("id, full_name, photo_url")

      if (search) {
        query = query.ilike("full_name", `%${search}%`)
      }

      if (careerId) {
        const { data: profIds } = await supabase
          .from("professor_careers")
          .select("professor_id")
          .eq("career_id", careerId)

        const ids = profIds?.map((p) => p.professor_id) ?? []
        query = query.in("id", ids.length > 0 ? ids : [""])
      }

      const { data: professors, error } = await query.order("full_name").limit(50)
      if (error) throw error

      // Attach careers
      return Promise.all(
        (professors ?? []).map(async (prof) => {
          const { data: careers } = await supabase
            .from("professor_careers")
            .select("careers(name)")
            .eq("professor_id", prof.id)
          return {
            ...prof,
            careerNames: careers?.map((c) => c.careers?.name).filter((n): n is string => n != null) ?? [],
          }
        })
      )
    },
    enabled: true,
  })
}

export function useProfessor(id: string) {
  return useQuery({
    queryKey: ["professor", id],
    queryFn: async () => {
      const supabase = createClient()
      const { data: professor, error } = await supabase
        .from("professors")
        .select("id, full_name, photo_url")
        .eq("id", id)
        .single()

      if (error) throw error

      const { data: careers } = await supabase
        .from("professor_careers")
        .select("careers(name)")
        .eq("professor_id", id)

      return {
        ...professor,
        careerNames: careers?.map((c) => c.careers?.name).filter((n): n is string => n != null) ?? [],
      }
    },
    enabled: !!id,
  })
}
