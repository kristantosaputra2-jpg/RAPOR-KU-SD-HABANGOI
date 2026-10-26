import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const ruleColumns =
  "id,class_id,subject_id,semester_id,minimum_mastery_score,created_at,updated_at"
const gradeColumns =
  "id,student_id,class_id,subject_id,learning_outcome_id,assessment_component_id,semester_id,grade_level,score,calculation_source,created_at,updated_at"

export type GradingRule = Pick<
  Tables<"grading_rules">,
  | "id"
  | "class_id"
  | "subject_id"
  | "semester_id"
  | "minimum_mastery_score"
  | "created_at"
  | "updated_at"
>

export type GradeEntry = Pick<
  Tables<"grade_entries">,
  | "id"
  | "student_id"
  | "class_id"
  | "subject_id"
  | "learning_outcome_id"
  | "assessment_component_id"
  | "semester_id"
  | "grade_level"
  | "score"
  | "calculation_source"
  | "created_at"
  | "updated_at"
>

export type GradeScope = Readonly<{
  classId: string
  subjectId: string
  semesterId: string
  gradeLevel: number
}>

export type StudentScoreInput = Readonly<{
  studentId: string
  score: number | null
  existingEntryId?: string
}>

export class GradeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GradeError"
  }
}

export function parseScoreInput(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const score = Number(trimmed)
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new GradeError("Nilai harus berupa angka 0 sampai 100.")
  }
  return score
}

export function validateMinimumMasteryScore(value: number) {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new GradeError("KKM harus berupa bilangan bulat 1 sampai 100.")
  }
  return value
}

export async function getGradingRule(
  scope: Omit<GradeScope, "gradeLevel">,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<GradingRule | null> {
  const { data, error } = await client
    .from("grading_rules")
    .select(ruleColumns)
    .eq("class_id", scope.classId)
    .eq("subject_id", scope.subjectId)
    .eq("semester_id", scope.semesterId)
    .maybeSingle()
  if (error)
    throw new GradeError(
      "KKM belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  return data
}

export async function saveGradingRule(
  userId: string,
  scope: Omit<GradeScope, "gradeLevel">,
  minimumMasteryScore: number,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<GradingRule> {
  const kkm = validateMinimumMasteryScore(minimumMasteryScore)
  const input: Database["public"]["Tables"]["grading_rules"]["Insert"] = {
    class_id: scope.classId,
    subject_id: scope.subjectId,
    semester_id: scope.semesterId,
    minimum_mastery_score: kkm,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("grading_rules")
    .upsert(input, { onConflict: "class_id,subject_id,semester_id" })
    .select(ruleColumns)
    .single()
  if (error || !data)
    throw new GradeError(
      "KKM belum dapat disimpan. Pastikan Anda memiliki izin Admin dan coba lagi.",
    )
  return data
}

export async function getGradeEntries(
  scope: Omit<GradeScope, "gradeLevel">,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<GradeEntry>> {
  const { data, error } = await client
    .from("grade_entries")
    .select(gradeColumns)
    .eq("class_id", scope.classId)
    .eq("subject_id", scope.subjectId)
    .eq("semester_id", scope.semesterId)
  if (error)
    throw new GradeError(
      "Nilai belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  return data
}

export async function saveLearningOutcomeScores(
  userId: string,
  scope: GradeScope,
  learningOutcomeId: string,
  assessmentComponentId: string,
  scores: ReadonlyArray<StudentScoreInput>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const populated = scores.filter(
    (score): score is StudentScoreInput & { score: number } =>
      score.score !== null,
  )
  populated.forEach(({ score }) => {
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      throw new GradeError("Nilai harus berupa angka 0 sampai 100.")
    }
  })

  if (populated.length > 0) {
    const rows: Database["public"]["Tables"]["grade_entries"]["Insert"][] =
      populated.map(({ studentId, score }) => ({
        student_id: studentId,
        class_id: scope.classId,
        subject_id: scope.subjectId,
        learning_outcome_id: learningOutcomeId,
        assessment_component_id: assessmentComponentId,
        semester_id: scope.semesterId,
        grade_level: scope.gradeLevel,
        score,
        calculation_source: "legacy",
        created_by: userId,
        updated_by: userId,
      }))
    const { error } = await client.from("grade_entries").upsert(rows, {
      onConflict:
        "student_id,class_id,subject_id,learning_outcome_id,assessment_component_id,semester_id",
    })
    if (error)
      throw new GradeError(
        "Nilai belum dapat disimpan. Periksa koneksi internet lalu coba lagi.",
      )
  }

  const removedIds = scores
    .filter(({ score, existingEntryId }) => score === null && existingEntryId)
    .map(({ existingEntryId }) => existingEntryId as string)
  if (removedIds.length > 0) {
    const { error } = await client
      .from("grade_entries")
      .delete()
      .in("id", removedIds)
    if (error)
      throw new GradeError(
        "Sebagian nilai kosong belum dapat dihapus. Muat ulang lalu coba lagi.",
      )
  }
}
