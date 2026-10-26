import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Json, Tables } from "@/types/database.types"

export type AssessmentCategory = "formative" | "summative"
export type FormativeKind = "daily" | "exercise" | "assignment" | "other"
export type SummativeKind = "midterm" | "final"
export type AssessmentKind = FormativeKind | SummativeKind

export type AssessmentItem = Pick<
  Tables<"assessment_items">,
  | "id"
  | "class_id"
  | "subject_id"
  | "learning_outcome_id"
  | "assessment_component_id"
  | "semester_id"
  | "grade_level"
  | "category"
  | "kind"
  | "title"
  | "display_order"
  | "is_active"
>

export type AssessmentScore = Pick<
  Tables<"assessment_scores">,
  "id" | "assessment_item_id" | "student_id" | "score"
>

export type AssessmentScope = Readonly<{
  classId: string
  subjectId: string
  semesterId: string
  gradeLevel: number
  assessmentComponentId: string
}>

export type AssessmentScoreInput = Readonly<{
  studentId: string
  score: number | null
}>

const itemColumns =
  "id,class_id,subject_id,learning_outcome_id,assessment_component_id,semester_id,grade_level,category,kind,title,display_order,is_active"
const scoreColumns = "id,assessment_item_id,student_id,score"

export class AssessmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AssessmentError"
  }
}

function validateItem(
  category: AssessmentCategory,
  kind: AssessmentKind,
  title: string,
) {
  const normalizedTitle = title.trim()
  const validKind =
    category === "formative"
      ? ["daily", "exercise", "assignment", "other"].includes(kind)
      : ["midterm", "final"].includes(kind)
  if (!validKind) throw new AssessmentError("Jenis penilaian tidak valid.")
  if (!normalizedTitle || normalizedTitle.length > 100) {
    throw new AssessmentError(
      "Nama penilaian wajib diisi, maksimal 100 karakter.",
    )
  }
  return normalizedTitle
}

export async function getAssessmentData(
  scope: AssessmentScope,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<{
  items: ReadonlyArray<AssessmentItem>
  scores: ReadonlyArray<AssessmentScore>
}> {
  const { data: items, error: itemError } = await client
    .from("assessment_items")
    .select(itemColumns)
    .eq("class_id", scope.classId)
    .eq("subject_id", scope.subjectId)
    .eq("semester_id", scope.semesterId)
    .eq("assessment_component_id", scope.assessmentComponentId)
    .eq("is_active", true)
    .order("display_order")
    .order("created_at")

  if (itemError) {
    throw new AssessmentError(
      "Daftar penilaian belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }
  if (!items?.length) return { items: [], scores: [] }

  const { data: scores, error: scoreError } = await client
    .from("assessment_scores")
    .select(scoreColumns)
    .in(
      "assessment_item_id",
      items.map((item) => item.id),
    )

  if (scoreError) {
    throw new AssessmentError(
      "Nilai penilaian belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }
  return { items, scores: scores ?? [] }
}

export async function createAssessmentItem(
  userId: string,
  scope: AssessmentScope,
  input: Readonly<{
    learningOutcomeId: string
    category: AssessmentCategory
    kind: AssessmentKind
    title: string
  }>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AssessmentItem> {
  const title = validateItem(input.category, input.kind, input.title)
  const { count } = await client
    .from("assessment_items")
    .select("id", { count: "exact", head: true })
    .eq("class_id", scope.classId)
    .eq("subject_id", scope.subjectId)
    .eq("semester_id", scope.semesterId)
    .eq("assessment_component_id", scope.assessmentComponentId)

  const row: Database["public"]["Tables"]["assessment_items"]["Insert"] = {
    class_id: scope.classId,
    subject_id: scope.subjectId,
    learning_outcome_id: input.learningOutcomeId,
    assessment_component_id: scope.assessmentComponentId,
    semester_id: scope.semesterId,
    grade_level: scope.gradeLevel,
    category: input.category,
    kind: input.kind,
    title,
    display_order: (count ?? 0) + 1,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("assessment_items")
    .insert(row)
    .select(itemColumns)
    .single()

  if (error || !data) {
    throw new AssessmentError(
      input.category === "summative"
        ? "PTS atau PAS untuk CP ini sudah ada atau belum dapat dibuat."
        : "Penilaian formatif belum dapat dibuat. Coba lagi.",
    )
  }
  return data
}

export async function saveAssessmentScores(
  assessmentItemId: string,
  scores: ReadonlyArray<AssessmentScoreInput>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<number> {
  scores.forEach(({ score }) => {
    if (
      score !== null &&
      (!Number.isFinite(score) || score < 0 || score > 100)
    ) {
      throw new AssessmentError("Nilai harus berupa angka 0 sampai 100.")
    }
  })
  const payload: Json = scores.map(({ studentId, score }) => ({
    student_id: studentId,
    score,
  }))
  const { data, error } = await client.rpc("save_assessment_scores", {
    p_assessment_item_id: assessmentItemId,
    p_scores: payload,
  })
  if (error) {
    throw new AssessmentError(
      "Nilai belum dapat disimpan. Periksa koneksi dan hak akses lalu coba lagi.",
    )
  }
  return data
}
