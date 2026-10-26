export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      achievements: {
        Row: {
          achievement_level: string
          achievement_type: string
          class_id: string
          created_at: string
          created_by: string
          description: string
          event_date: string | null
          event_year: number
          id: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          achievement_level: string
          achievement_type: string
          class_id: string
          created_at?: string
          created_by: string
          description: string
          event_date?: string | null
          event_year: number
          id?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          achievement_level?: string
          achievement_type?: string
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string
          event_date?: string | null
          event_year?: number
          id?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "achievements_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_components: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          display_order: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      attendance: {
        Row: {
          absent_days: number
          class_id: string
          created_at: string
          created_by: string
          id: string
          permitted_days: number
          semester_id: string
          sick_days: number
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          absent_days?: number
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          permitted_days?: number
          semester_id: string
          sick_days?: number
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          absent_days?: number
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          permitted_days?: number
          semester_id?: string
          sick_days?: number
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "attendance_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      extracurriculars: {
        Row: {
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          name: string
          school_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          name: string
          school_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          name?: string
          school_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracurriculars_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string
          grade_level: number
          homeroom_teacher_id: string | null
          id: string
          name: string
          semester_id: string
          template_group:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by: string
          grade_level: number
          homeroom_teacher_id?: string | null
          id?: string
          name: string
          semester_id: string
          template_group?:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string
          grade_level?: number
          homeroom_teacher_id?: string | null
          id?: string
          name?: string
          semester_id?: string
          template_group?:
            Database["public"]["Enums"]["class_template_group"] | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_homeroom_teacher_id_fkey"
            columns: ["homeroom_teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_semester_academic_year_fkey"
            columns: ["semester_id", "academic_year_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id", "academic_year_id"]
          },
        ]
      }
      grade_entries: {
        Row: {
          assessment_component_id: string
          class_id: string
          created_at: string
          created_by: string
          grade_level: number
          id: string
          learning_outcome_id: string
          score: number
          semester_id: string
          student_id: string
          subject_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          assessment_component_id: string
          class_id: string
          created_at?: string
          created_by: string
          grade_level: number
          id?: string
          learning_outcome_id: string
          score: number
          semester_id: string
          student_id: string
          subject_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          assessment_component_id?: string
          class_id?: string
          created_at?: string
          created_by?: string
          grade_level?: number
          id?: string
          learning_outcome_id?: string
          score?: number
          semester_id?: string
          student_id?: string
          subject_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_entries_assessment_component_id_fkey"
            columns: ["assessment_component_id"]
            isOneToOne: false
            referencedRelation: "assessment_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grade_entries_class_scope_fkey"
            columns: ["class_id", "semester_id", "grade_level"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "semester_id", "grade_level"]
          },
          {
            foreignKeyName: "grade_entries_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "grade_entries_outcome_scope_fkey"
            columns: [
              "learning_outcome_id",
              "subject_id",
              "semester_id",
              "grade_level",
            ]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: [
              "id",
              "subject_id",
              "semester_id",
              "grade_level",
            ]
          },
        ]
      }
      grading_rules: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          id: string
          minimum_mastery_score: number
          semester_id: string
          subject_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          minimum_mastery_score: number
          semester_id: string
          subject_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          minimum_mastery_score?: number
          semester_id?: string
          subject_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_rules_class_semester_fkey"
            columns: ["class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "semester_id"]
          },
          {
            foreignKeyName: "grading_rules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_settings: {
        Row: {
          created_at: string
          created_by: string
          id: string
          kkm_mode: string
          semester_id: string
          single_kkm: number | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          kkm_mode: string
          semester_id: string
          single_kkm?: number | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          kkm_mode?: string
          semester_id?: string
          single_kkm?: number | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_settings_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: true
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      homeroom_notes: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          id: string
          note: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          note?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "homeroom_notes_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "homeroom_notes_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          description: string
          grade_level: number
          id: string
          is_active: boolean
          semester_id: string
          subject_id: string
          title: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          description: string
          grade_level: number
          id?: string
          is_active?: boolean
          semester_id: string
          subject_id: string
          title: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          description?: string
          grade_level?: number
          id?: string
          is_active?: boolean
          semester_id?: string
          subject_id?: string
          title?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_outcomes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      class_members: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          id: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_semester_fkey"
            columns: ["class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "semester_id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      report_completion_confirmations: {
        Row: {
          achievement_confirmed_empty: boolean
          class_id: string
          created_at: string
          created_by: string
          extracurricular_confirmed_empty: boolean
          id: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          achievement_confirmed_empty?: boolean
          class_id: string
          created_at?: string
          created_by: string
          extracurricular_confirmed_empty?: boolean
          id?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          achievement_confirmed_empty?: boolean
          class_id?: string
          created_at?: string
          created_by?: string
          extracurricular_confirmed_empty?: boolean
          id?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_completion_confirmations_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "report_completion_confirmations_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      report_descriptions: {
        Row: {
          assessment_component_id: string
          class_id: string
          created_at: string
          created_by: string
          final_description: string
          generated_description: string
          grade_level: number
          id: string
          semester_id: string
          strongest_outcome_id: string | null
          student_id: string
          subject_id: string
          updated_at: string
          updated_by: string
          weakest_outcome_id: string | null
        }
        Insert: {
          assessment_component_id: string
          class_id: string
          created_at?: string
          created_by: string
          final_description: string
          generated_description: string
          grade_level: number
          id?: string
          semester_id: string
          strongest_outcome_id?: string | null
          student_id: string
          subject_id: string
          updated_at?: string
          updated_by: string
          weakest_outcome_id?: string | null
        }
        Update: {
          assessment_component_id?: string
          class_id?: string
          created_at?: string
          created_by?: string
          final_description?: string
          generated_description?: string
          grade_level?: number
          id?: string
          semester_id?: string
          strongest_outcome_id?: string | null
          student_id?: string
          subject_id?: string
          updated_at?: string
          updated_by?: string
          weakest_outcome_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_descriptions_assessment_component_id_fkey"
            columns: ["assessment_component_id"]
            isOneToOne: false
            referencedRelation: "assessment_components"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_descriptions_class_scope_fkey"
            columns: ["class_id", "semester_id", "grade_level"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "semester_id", "grade_level"]
          },
          {
            foreignKeyName: "report_descriptions_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "report_descriptions_strongest_outcome_id_fkey"
            columns: ["strongest_outcome_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_descriptions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_descriptions_weakest_outcome_id_fkey"
            columns: ["weakest_outcome_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      public_school_identity: {
        Row: {
          logo_url: string | null
          school_name: string
          singleton_key: boolean
          updated_at: string
        }
        Insert: {
          logo_url?: string | null
          school_name: string
          singleton_key?: boolean
          updated_at?: string
        }
        Update: {
          logo_url?: string | null
          school_name?: string
          singleton_key?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          created_by: string
          district: string | null
          email: string | null
          id: string
          logo_url: string | null
          npsn: string | null
          postal_code: string | null
          principal_name: string | null
          principal_nip: string | null
          province: string | null
          school_name: string
          singleton_key: boolean
          updated_at: string
          updated_by: string
          village: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by: string
          district?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          npsn?: string | null
          postal_code?: string | null
          principal_name?: string | null
          principal_nip?: string | null
          province?: string | null
          school_name: string
          singleton_key?: boolean
          updated_at?: string
          updated_by: string
          village?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          created_by?: string
          district?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          npsn?: string | null
          postal_code?: string | null
          principal_name?: string | null
          principal_nip?: string | null
          province?: string | null
          school_name?: string
          singleton_key?: boolean
          updated_at?: string
          updated_by?: string
          village?: string | null
        }
        Relationships: []
      }
      semesters: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          number: number
          updated_at: string
          updated_by: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          number: number
          updated_at?: string
          updated_by: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          number?: number
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "semesters_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      student_extracurriculars: {
        Row: {
          achievement: string
          class_id: string
          created_at: string
          created_by: string
          description: string
          extracurricular_id: string
          id: string
          semester_id: string
          student_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          achievement: string
          class_id: string
          created_at?: string
          created_by: string
          description: string
          extracurricular_id: string
          id?: string
          semester_id: string
          student_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          achievement?: string
          class_id?: string
          created_at?: string
          created_by?: string
          description?: string
          extracurricular_id?: string
          id?: string
          semester_id?: string
          student_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_extracurriculars_extracurricular_id_fkey"
            columns: ["extracurricular_id"]
            isOneToOne: false
            referencedRelation: "extracurriculars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_extracurriculars_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "student_extracurriculars_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
        ]
      }
      student_biodata: {
        Row: {
          created_at: string
          created_by: string
          father_address: string | null
          father_education: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          guardian_address: string | null
          guardian_education: string | null
          guardian_name: string | null
          guardian_occupation: string | null
          guardian_phone: string | null
          mother_address: string | null
          mother_education: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          photo_path: string | null
          student_id: string
          student_phone: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          father_address?: string | null
          father_education?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          guardian_address?: string | null
          guardian_education?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          mother_address?: string | null
          mother_education?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          photo_path?: string | null
          student_id: string
          student_phone?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          father_address?: string | null
          father_education?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          guardian_address?: string | null
          guardian_education?: string | null
          guardian_name?: string | null
          guardian_occupation?: string | null
          guardian_phone?: string | null
          mother_address?: string | null
          mother_education?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          photo_path?: string | null
          student_phone?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_biodata_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          birth_date: string | null
          birth_place: string | null
          created_at: string
          created_by: string
          father_name: string | null
          full_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          guardian_name: string | null
          id: string
          is_active: boolean
          mother_name: string | null
          nis: string
          nisn: string | null
          religion: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          created_by: string
          father_name?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["student_gender"]
          guardian_name?: string | null
          id?: string
          is_active?: boolean
          mother_name?: string | null
          nis: string
          nisn?: string | null
          religion?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          birth_place?: string | null
          created_at?: string
          created_by?: string
          father_name?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["student_gender"]
          guardian_name?: string | null
          id?: string
          is_active?: boolean
          mother_name?: string | null
          nis?: string
          nisn?: string | null
          religion?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      student_religion_subject_overrides: {
        Row: {
          class_id: string
          created_at: string
          created_by: string
          id: string
          semester_id: string
          student_id: string
          subject_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          semester_id: string
          student_id: string
          subject_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          semester_id?: string
          student_id?: string
          subject_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_religion_subject_overrides_membership_fkey"
            columns: ["student_id", "class_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "class_members"
            referencedColumns: ["student_id", "class_id", "semester_id"]
          },
          {
            foreignKeyName: "student_religion_subject_overrides_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_religion_subject_overrides_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string | null
          created_at: string
          created_by: string
          display_order: number
          id: string
          is_active: boolean
          is_local_content: boolean
          name: string
          religion_scope: string | null
          updated_at: string
          updated_by: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          created_by: string
          display_order: number
          id?: string
          is_active?: boolean
          is_local_content?: boolean
          name: string
          religion_scope?: string | null
          updated_at?: string
          updated_by: string
        }
        Update: {
          code?: string | null
          created_at?: string
          created_by?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_local_content?: boolean
          name?: string
          religion_scope?: string | null
          updated_at?: string
          updated_by?: string
        }
        Relationships: []
      }
      subject_kkm_rules: {
        Row: {
          created_at: string
          created_by: string
          id: string
          minimum_mastery_score: number
          semester_id: string
          subject_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          minimum_mastery_score: number
          semester_id: string
          subject_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          minimum_mastery_score?: number
          semester_id?: string
          subject_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_kkm_rules_semester_id_fkey"
            columns: ["semester_id"]
            isOneToOne: false
            referencedRelation: "semesters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_kkm_rules_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          created_by: string
          id: string
          is_active: boolean
          semester_id: string
          subject_id: string
          teacher_id: string
          updated_at: string
          updated_by: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean
          semester_id: string
          subject_id: string
          teacher_id: string
          updated_at?: string
          updated_by: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean
          semester_id?: string
          subject_id?: string
          teacher_id?: string
          updated_at?: string
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_class_period_fkey"
            columns: ["class_id", "academic_year_id", "semester_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id", "academic_year_id", "semester_id"]
          },
          {
            foreignKeyName: "teacher_assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teacher_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_profiles: {
        Row: {
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          nip: string | null
          nuptk: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          updated_by: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          nip?: string | null
          nuptk?: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          nip?: string | null
          nuptk?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          updated_by?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      import_students_to_class: {
        Args: {
          p_class_id: string
          p_semester_id: string
          p_students: Json
        }
        Returns: number
      }
      set_active_academic_year: {
        Args: { p_academic_year_id: string }
        Returns: undefined
      }
      set_active_semester: {
        Args: { p_semester_id: string }
        Returns: undefined
      }
    }
    Enums: {
      class_template_group: "lower_primary" | "upper_primary"
      student_gender: "male" | "female"
      user_role: "admin" | "homeroom_teacher" | "subject_teacher"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer Row
    }
    ? Row
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer Row
      }
      ? Row
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      class_template_group: ["lower_primary", "upper_primary"],
      student_gender: ["male", "female"],
      user_role: ["admin", "homeroom_teacher", "subject_teacher"],
    },
  },
} as const
