import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const overrideColumns =
  "id,student_id,class_id,semester_id,subject_id,created_at,updated_at"

export type StudentReligionSubjectOverride = Pick<
  Tables<"student_religion_subject_overrides">,
  | "id"
  | "student_id"
  | "class_id"
  | "semester_id"
  | "subject_id"
  | "created_at"
  | "updated_at"
>

export class StudentReligionSubjectOverrideError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentReligionSubjectOverrideError"
  }
}

function errorCode(error: unknown) {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : ""
}

function saveErrorMessage(error: unknown) {
  if (errorCode(error) === "23514") {
    return "Mapel agama hanya dapat diganti sebelum nilai atau deskripsi agama siswa diisi."
  }

  return "Pengaturan mapel agama belum dapat disimpan. Periksa koneksi lalu coba lagi."
}

export async function getStudentReligionSubjectOverrides(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<StudentReligionSubjectOverride>> {
  const { data, error } = await client
    .from("student_religion_subject_overrides")
    .select(overrideColumns)
    .order("created_at", { ascending: true })

  if (error) {
    throw new StudentReligionSubjectOverrideError(
      "Pengaturan mapel agama belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }

  return data
}

export async function setStudentReligionSubjectOverride(
  userId: string,
  scope: Readonly<{
    studentId: string
    classId: string
    semesterId: string
    subjectId: string | null
    existing: StudentReligionSubjectOverride | null
  }>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<StudentReligionSubjectOverride | null> {
  if (scope.subjectId === null) {
    if (!scope.existing) return null

    const { error } = await client
      .from("student_religion_subject_overrides")
      .delete()
      .eq("id", scope.existing.id)

    if (error) {
      throw new StudentReligionSubjectOverrideError(saveErrorMessage(error))
    }

    return null
  }

  if (scope.existing) {
    const update: Database["public"]["Tables"]["student_religion_subject_overrides"]["Update"] =
      { subject_id: scope.subjectId, updated_by: userId }
    const { data, error } = await client
      .from("student_religion_subject_overrides")
      .update(update)
      .eq("id", scope.existing.id)
      .select(overrideColumns)
      .single()

    if (error || !data) {
      throw new StudentReligionSubjectOverrideError(saveErrorMessage(error))
    }

    return data
  }

  const insert: Database["public"]["Tables"]["student_religion_subject_overrides"]["Insert"] =
    {
      student_id: scope.studentId,
      class_id: scope.classId,
      semester_id: scope.semesterId,
      subject_id: scope.subjectId,
      created_by: userId,
      updated_by: userId,
    }
  const { data, error } = await client
    .from("student_religion_subject_overrides")
    .insert(insert)
    .select(overrideColumns)
    .single()

  if (error || !data) {
    throw new StudentReligionSubjectOverrideError(saveErrorMessage(error))
  }

  return data
}
