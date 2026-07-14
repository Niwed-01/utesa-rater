export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          is_banned: boolean
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          email: string
          is_banned?: boolean
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          is_banned?: boolean
          is_admin?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      careers: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      professor_careers: {
        Row: {
          id: string
          professor_id: string
          career_id: string
        }
        Insert: {
          id?: string
          professor_id: string
          career_id: string
        }
        Update: {
          id?: string
          professor_id?: string
          career_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_careers_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_careers_career_id_fkey"
            columns: ["career_id"]
            referencedRelation: "careers"
            referencedColumns: ["id"]
          },
        ]
      }
      professors: {
        Row: {
          id: string
          full_name: string
          photo_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          photo_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          photo_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          id: string
          name: string
          code: string | null
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
        }
        Relationships: []
      }
      professor_classes: {
        Row: {
          id: string
          professor_id: string
          class_id: string
        }
        Insert: {
          id?: string
          professor_id: string
          class_id: string
        }
        Update: {
          id?: string
          professor_id?: string
          class_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_classes_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professor_classes_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          id: string
          author_id: string
          professor_id: string
          class_id: string
          alias: string
          title: string | null
          body: string
          tags: string[]
          volveria_a_tomar: boolean
          rating_claridad: number
          rating_puntualidad: number
          rating_exigencia: number
          rating_disponibilidad: number
          rating_justicia: number
          rating_general: number
          semester: string | null
          vote_score: number
          is_hidden: boolean
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          professor_id: string
          class_id: string
          alias: string
          title?: string | null
          body: string
          tags?: string[]
          volveria_a_tomar: boolean
          rating_claridad: number
          rating_puntualidad: number
          rating_exigencia: number
          rating_disponibilidad: number
          rating_justicia: number
          semester?: string | null
          vote_score?: number
          is_hidden?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          professor_id?: string
          class_id?: string
          alias?: string
          title?: string | null
          body?: string
          tags?: string[]
          volveria_a_tomar?: boolean
          rating_claridad?: number
          rating_puntualidad?: number
          rating_exigencia?: number
          rating_disponibilidad?: number
          rating_justicia?: number
          semester?: string | null
          vote_score?: number
          is_hidden?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_author_id_fkey"
            columns: ["author_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
          Row: {
            id: string
            post_id: string
            parent_id: string | null
            author_id: string
            alias: string
            body: string
            vote_score: number
            is_hidden: boolean
            created_at: string
          }
          Insert: {
            id?: string
            post_id: string
            parent_id?: string | null
            author_id: string
            alias: string
            body: string
            vote_score?: number
            is_hidden?: boolean
            created_at?: string
          }
          Update: {
            id?: string
            post_id?: string
            parent_id?: string | null
            author_id?: string
            alias?: string
            body?: string
            vote_score?: number
            is_hidden?: boolean
            created_at?: string
          }
          Relationships: [
            {
              foreignKeyName: "comments_post_id_fkey"
              columns: ["post_id"]
              referencedRelation: "posts"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "comments_parent_id_fkey"
              columns: ["parent_id"]
              referencedRelation: "comments"
              referencedColumns: ["id"]
            },
            {
              foreignKeyName: "comments_author_id_fkey"
              columns: ["author_id"]
              referencedRelation: "profiles"
              referencedColumns: ["id"]
            },
          ]
      }
      votes: {
        Row: {
          id: string
          user_id: string
          post_id: string | null
          comment_id: string | null
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          post_id?: string | null
          comment_id?: string | null
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string | null
          comment_id?: string | null
          value?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          id: string
          reporter_id: string
          post_id: string | null
          comment_id: string | null
          reason: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id: string
          post_id?: string | null
          comment_id?: string | null
          reason: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          post_id?: string | null
          comment_id?: string | null
          reason?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          admin_id: string
          action: string
          target_id: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          action: string
          target_id: string
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          action?: string
          target_id?: string
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_admin_id_fkey"
            columns: ["admin_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      posts_public: {
        Row: {
          id: string
          professor_id: string
          class_id: string
          alias: string
          title: string
          body: string
          tags: string[]
          volveria_a_tomar: boolean
          rating_claridad: number
          rating_puntualidad: number
          rating_exigencia: number
          rating_disponibilidad: number
          rating_justicia: number
          rating_general: number
          semester: string | null
          vote_score: number
          created_at: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_professor_id_fkey"
            columns: ["professor_id"]
            referencedRelation: "professors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      comments_public: {
        Row: {
          id: string
          post_id: string
          parent_id: string | null
          alias: string
          body: string
          vote_score: number
          created_at: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            referencedRelation: "comments_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
