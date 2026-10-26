import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database } from "@/types/database.types"
import type { Student } from "@/features/students/student.service"
import { subjectMatchesStudentReligion } from "@/features/subjects/subject.service"
import {
  calculateReportCompleteness,
  hasCompleteDescriptions,
  hasCompleteGrades,
  isSchoolIdentityComplete,
  isStudentIdentityComplete,
  type ReportChecklist,
  type ReportStatus,
} from "./report-completeness"

export type CompletionConfirmation = Readonly<{
  studentId: string
  extracurricularConfirmedEmpty: boolean
  achievementConfirmedEmpty: boolean
}>

export type StudentReportCompleteness = Readonly<{
  studentId: string
  studentName: string
  checks: ReportChecklist
  status: ReportStatus
  hasExtracurricular: boolean
  hasAchievement: boolean
  confirmation: CompletionConfirmation
}>

export class ReportCompletenessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportCompletenessError"
  }
}

function key(...parts: ReadonlyArray<string>) {
  return parts.join(":")
}

export async function getReportCompleteness(
  classId: string,
  semesterId: string,
  gradeLevel: number,
  students: ReadonlyArray<Student>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<StudentReportCompleteness>> {
  const [
    schoolResult,
    assignmentResult,
    subjectResult,
    outcomeResult,
    componentResult,
    assessmentItemResult,
    gradeResult,
    descriptionResult,
    attendanceResult,
    extracurricularResult,
    achievementResult,
    noteResult,
    confirmationResult,
    religionOverrideResult,
  ] = await Promise.all([
    client
      .from("schools")
      .select("school_name,npsn,address,district,city,province,principal_name")
      .eq("singleton_key", true)
      .maybeSingle(),
    client
      .from("teacher_assignments")
      .select("subject_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client.from("subjects").select("id,religion_scope").eq("is_active", true),
    client
      .from("learning_outcomes")
      .select("id,subject_id")
      .eq("semester_id", semesterId)
      .eq("grade_level", gradeLevel)
      .eq("is_active", true),
    client.from("assessment_components").select("id").eq("is_active", true),
    client
      .from("assessment_items")
      .select("subject_id,learning_outcome_id,assessment_component_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client
      .from("grade_entries")
      .select(
        "student_id,subject_id,learning_outcome_id,assessment_component_id,calculation_source",
      )
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("report_descriptions")
      .select("student_id,subject_id,assessment_component_id,final_description")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("attendance")
      .select("student_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("student_extracurriculars")
      .select("student_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("achievements")
      .select("student_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("homeroom_notes")
      .select("student_id,note")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("report_completion_confirmations")
      .select(
        "student_id,extracurricular_confirmed_empty,achievement_confirmed_empty",
      )
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("student_religion_subject_overrides")
      .select("student_id,subject_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
  ])

  const results = [
    schoolResult,
    assignmentResult,
    subjectResult,
    outcomeResult,
    componentResult,
    assessmentItemResult,
    gradeResult,
    descriptionResult,
    attendanceResult,
    extracurricularResult,
    achievementResult,
    noteResult,
    confirmationResult,
    religionOverrideResult,
  ]
  if (results.some((result) => result.error)) {
    throw new ReportCompletenessError(
      "Kelengkapan rapor belum dapat diperiksa. Periksa koneksi lalu coba lagi.",
    )
  }

  const subjectIds = [
    ...new Set((assignmentResult.data ?? []).map((item) => item.subject_id)),
  ]
  const componentIds = (componentResult.data ?? []).map((item) => item.id)
  const outcomes = outcomeResult.data ?? []
  const detailedKeys = new Set(
    (assessmentItemResult.data ?? []).map((item) =>
      key(
        item.subject_id,
        item.learning_outcome_id,
        item.assessment_component_id,
      ),
    ),
  )
  const gradeKeys = new Set(
    (gradeResult.data ?? [])
      .filter(
        (item) =>
          !detailedKeys.has(
            key(
              item.subject_id,
              item.learning_outcome_id,
              item.assessment_component_id,
            ),
          ) || item.calculation_source === "formative_summative",
      )
      .map((item) =>
        key(
          item.student_id,
          item.subject_id,
          item.learning_outcome_id,
          item.assessment_component_id,
        ),
      ),
  )
  const descriptionKeys = new Set(
    (descriptionResult.data ?? [])
      .filter((item) => item.final_description.trim())
      .map((item) =>
        key(item.student_id, item.subject_id, item.assessment_component_id),
      ),
  )
  const attendanceIds = new Set(
    (attendanceResult.data ?? []).map((item) => item.student_id),
  )
  const extracurricularIds = new Set(
    (extracurricularResult.data ?? []).map((item) => item.student_id),
  )
  const achievementIds = new Set(
    (achievementResult.data ?? []).map((item) => item.student_id),
  )
  const noteIds = new Set(
    (noteResult.data ?? [])
      .filter((item) => item.note.trim())
      .map((item) => item.student_id),
  )
  const confirmationByStudent = new Map(
    (confirmationResult.data ?? []).map((item) => [item.student_id, item]),
  )
  const schoolIdentityComplete = isSchoolIdentityComplete(
    schoolResult.data ?? null,
  )
  const religionOverrideByStudent = new Map(
    (religionOverrideResult.data ?? []).map((item) => [
      item.student_id,
      item.subject_id,
    ]),
  )

  return students.map((student) => {
    const applicableSubjectIds = subjectIds.filter((subjectId) => {
      const subject = (subjectResult.data ?? []).find(
        (item) => item.id === subjectId,
      )
      return (
        !subject ||
        subjectMatchesStudentReligion(
          subject,
          student.religion,
          religionOverrideByStudent.get(student.id) ?? null,
        )
      )
    })
    const confirmation = confirmationByStudent.get(student.id)
    const hasExtracurricular = extracurricularIds.has(student.id)
    const hasAchievement = achievementIds.has(student.id)
    const normalizedConfirmation: CompletionConfirmation = {
      studentId: student.id,
      extracurricularConfirmedEmpty:
        confirmation?.extracurricular_confirmed_empty ?? false,
      achievementConfirmedEmpty:
        confirmation?.achievement_confirmed_empty ?? false,
    }
    const grades = hasCompleteGrades(
      student.id,
      applicableSubjectIds,
      outcomes.map((outcome) => ({
        id: outcome.id,
        subjectId: outcome.subject_id,
      })),
      componentIds,
      gradeKeys,
    )
    const descriptions = hasCompleteDescriptions(
      student.id,
      applicableSubjectIds,
      componentIds,
      descriptionKeys,
    )
    const checks: ReportChecklist = {
      identity: schoolIdentityComplete && isStudentIdentityComplete(student),
      grades,
      descriptions,
      attendance: attendanceIds.has(student.id),
      extracurricular:
        hasExtracurricular ||
        normalizedConfirmation.extracurricularConfirmedEmpty,
      achievement:
        hasAchievement || normalizedConfirmation.achievementConfirmedEmpty,
      homeroomNote: noteIds.has(student.id),
    }
    return {
      studentId: student.id,
      studentName: student.full_name,
      checks,
      status: calculateReportCompleteness(checks),
      hasExtracurricular,
      hasAchievement,
      confirmation: normalizedConfirmation,
    }
  })
}

export async function saveCompletionConfirmations(
  userId: string,
  classId: string,
  semesterId: string,
  confirmations: ReadonlyArray<CompletionConfirmation>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const rows: Database["public"]["Tables"]["report_completion_confirmations"]["Insert"][] =
    confirmations.map((item) => ({
      student_id: item.studentId,
      class_id: classId,
      semester_id: semesterId,
      extracurricular_confirmed_empty: item.extracurricularConfirmedEmpty,
      achievement_confirmed_empty: item.achievementConfirmedEmpty,
      created_by: userId,
      updated_by: userId,
    }))
  if (rows.length === 0) return
  const { error } = await client
    .from("report_completion_confirmations")
    .upsert(rows, { onConflict: "student_id,class_id,semester_id" })
  if (error) {
    throw new ReportCompletenessError(
      "Konfirmasi kelengkapan belum tersimpan. Periksa koneksi lalu coba lagi.",
    )
  }
}
