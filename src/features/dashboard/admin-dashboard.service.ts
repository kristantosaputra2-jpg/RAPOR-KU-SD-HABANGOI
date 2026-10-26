import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import {
  calculateReportCompleteness,
  hasCompleteDescriptions,
  hasCompleteGrades,
  isSchoolIdentityComplete,
  isStudentIdentityComplete,
} from "@/features/report-status/report-completeness"

export type AdminDashboardSummary = Readonly<{
  activeStudents: number
  activeClasses: number
  activeTeachers: number
  enrolledStudents: number
  completeGrades: number
  readyReports: number
  incompleteReports: number
  schoolIdentityComplete: boolean
  hasSubjects: boolean
}>

type DashboardData = Readonly<{
  school: Readonly<{
    school_name: string
    npsn: string | null
    address: string | null
    district: string | null
    city: string | null
    province: string | null
    principal_name: string | null
  }> | null
  students: ReadonlyArray<{
    id: string
    full_name: string
    nis: string
    gender: string
    birth_place: string | null
    birth_date: string | null
    is_active: boolean
  }>
  activeTeacherIds: ReadonlyArray<string>
  activeSubjectIds: ReadonlyArray<string>
  classes: ReadonlyArray<{ id: string; grade_level: number }>
  memberships: ReadonlyArray<{ student_id: string; class_id: string }>
  assignments: ReadonlyArray<{ class_id: string; subject_id: string }>
  outcomes: ReadonlyArray<{
    id: string
    subject_id: string
    grade_level: number
  }>
  componentIds: ReadonlyArray<string>
  assessmentItems: ReadonlyArray<{
    subject_id: string
    learning_outcome_id: string
    assessment_component_id: string
  }>
  grades: ReadonlyArray<{
    student_id: string
    subject_id: string
    learning_outcome_id: string
    assessment_component_id: string
    calculation_source: string
  }>
  descriptions: ReadonlyArray<{
    student_id: string
    subject_id: string
    assessment_component_id: string
    final_description: string
  }>
  attendanceStudentIds: ReadonlyArray<string>
  extracurricularStudentIds: ReadonlyArray<string>
  achievementStudentIds: ReadonlyArray<string>
  notes: ReadonlyArray<{ student_id: string; note: string }>
  confirmations: ReadonlyArray<{
    student_id: string
    extracurricular_confirmed_empty: boolean
    achievement_confirmed_empty: boolean
  }>
}>

export class AdminDashboardError extends Error {
  constructor() {
    super(
      "Ringkasan dashboard belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
    this.name = "AdminDashboardError"
  }
}

function key(...parts: ReadonlyArray<string>) {
  return parts.join(":")
}

export function buildAdminDashboardSummary(
  data: DashboardData,
): AdminDashboardSummary {
  const activeStudents = data.students.filter((student) => student.is_active)
  const activeStudentById = new Map(
    activeStudents.map((student) => [student.id, student]),
  )
  const classById = new Map(data.classes.map((item) => [item.id, item]))
  const memberships = data.memberships.filter(
    (item) =>
      activeStudentById.has(item.student_id) && classById.has(item.class_id),
  )
  const subjectsByClass = new Map<string, Set<string>>()

  data.assignments.forEach((assignment) => {
    if (!classById.has(assignment.class_id)) return
    const subjectIds = subjectsByClass.get(assignment.class_id) ?? new Set()
    subjectIds.add(assignment.subject_id)
    subjectsByClass.set(assignment.class_id, subjectIds)
  })

  const detailedKeys = new Set(
    data.assessmentItems.map((item) =>
      key(
        item.subject_id,
        item.learning_outcome_id,
        item.assessment_component_id,
      ),
    ),
  )
  const gradeKeys = new Set(
    data.grades
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
    data.descriptions
      .filter((item) => item.final_description.trim())
      .map((item) =>
        key(item.student_id, item.subject_id, item.assessment_component_id),
      ),
  )
  const attendanceIds = new Set(data.attendanceStudentIds)
  const extracurricularIds = new Set(data.extracurricularStudentIds)
  const achievementIds = new Set(data.achievementStudentIds)
  const noteIds = new Set(
    data.notes
      .filter((item) => item.note.trim())
      .map((item) => item.student_id),
  )
  const confirmationByStudent = new Map(
    data.confirmations.map((item) => [item.student_id, item]),
  )
  const schoolIdentityComplete = isSchoolIdentityComplete(data.school)
  let completeGrades = 0
  let readyReports = 0

  memberships.forEach((membership) => {
    const student = activeStudentById.get(membership.student_id)
    const schoolClass = classById.get(membership.class_id)
    if (!student || !schoolClass) return

    const subjectIds = [...(subjectsByClass.get(membership.class_id) ?? [])]
    const outcomes = data.outcomes
      .filter((outcome) => outcome.grade_level === schoolClass.grade_level)
      .map((outcome) => ({ id: outcome.id, subjectId: outcome.subject_id }))
    const gradesComplete = hasCompleteGrades(
      student.id,
      subjectIds,
      outcomes,
      data.componentIds,
      gradeKeys,
    )
    if (gradesComplete) completeGrades += 1

    const confirmation = confirmationByStudent.get(student.id)
    const status = calculateReportCompleteness({
      identity: schoolIdentityComplete && isStudentIdentityComplete(student),
      grades: gradesComplete,
      descriptions: hasCompleteDescriptions(
        student.id,
        subjectIds,
        data.componentIds,
        descriptionKeys,
      ),
      attendance: attendanceIds.has(student.id),
      extracurricular:
        extracurricularIds.has(student.id) ||
        Boolean(confirmation?.extracurricular_confirmed_empty),
      achievement:
        achievementIds.has(student.id) ||
        Boolean(confirmation?.achievement_confirmed_empty),
      homeroomNote: noteIds.has(student.id),
    })
    if (status === "ready_to_print") readyReports += 1
  })

  return {
    activeStudents: activeStudents.length,
    activeClasses: data.classes.length,
    activeTeachers: data.activeTeacherIds.length,
    enrolledStudents: memberships.length,
    completeGrades,
    readyReports,
    incompleteReports: memberships.length - readyReports,
    schoolIdentityComplete,
    hasSubjects: data.activeSubjectIds.length > 0,
  }
}

export async function getAdminDashboardSummary(
  semesterId: string | null,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AdminDashboardSummary> {
  const [schoolResult, studentResult, teacherResult, subjectResult] =
    await Promise.all([
      client
        .from("schools")
        .select(
          "school_name,npsn,address,district,city,province,principal_name",
        )
        .eq("singleton_key", true)
        .maybeSingle(),
      client
        .from("students")
        .select("id,full_name,nis,gender,birth_place,birth_date,is_active")
        .eq("is_active", true),
      client.from("teacher_profiles").select("id").eq("is_active", true),
      client.from("subjects").select("id").eq("is_active", true),
    ])

  if (
    schoolResult.error ||
    studentResult.error ||
    teacherResult.error ||
    subjectResult.error
  ) {
    throw new AdminDashboardError()
  }

  const baseData = {
    school: schoolResult.data,
    students: studentResult.data ?? [],
    activeTeacherIds: (teacherResult.data ?? []).map((item) => item.id),
    activeSubjectIds: (subjectResult.data ?? []).map((item) => item.id),
  }

  if (!semesterId) {
    return buildAdminDashboardSummary({
      ...baseData,
      classes: [],
      memberships: [],
      assignments: [],
      outcomes: [],
      componentIds: [],
      assessmentItems: [],
      grades: [],
      descriptions: [],
      attendanceStudentIds: [],
      extracurricularStudentIds: [],
      achievementStudentIds: [],
      notes: [],
      confirmations: [],
    })
  }

  const results = await Promise.all([
    client
      .from("classes")
      .select("id,grade_level")
      .eq("semester_id", semesterId),
    client
      .from("class_members")
      .select("student_id,class_id")
      .eq("semester_id", semesterId),
    client
      .from("teacher_assignments")
      .select("class_id,subject_id")
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client
      .from("learning_outcomes")
      .select("id,subject_id,grade_level")
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client.from("assessment_components").select("id").eq("is_active", true),
    client
      .from("assessment_items")
      .select("subject_id,learning_outcome_id,assessment_component_id")
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client
      .from("grade_entries")
      .select(
        "student_id,subject_id,learning_outcome_id,assessment_component_id,calculation_source",
      )
      .eq("semester_id", semesterId),
    client
      .from("report_descriptions")
      .select("student_id,subject_id,assessment_component_id,final_description")
      .eq("semester_id", semesterId),
    client
      .from("attendance")
      .select("student_id")
      .eq("semester_id", semesterId),
    client
      .from("student_extracurriculars")
      .select("student_id")
      .eq("semester_id", semesterId),
    client
      .from("achievements")
      .select("student_id")
      .eq("semester_id", semesterId),
    client
      .from("homeroom_notes")
      .select("student_id,note")
      .eq("semester_id", semesterId),
    client
      .from("report_completion_confirmations")
      .select(
        "student_id,extracurricular_confirmed_empty,achievement_confirmed_empty",
      )
      .eq("semester_id", semesterId),
  ])

  if (results.some((result) => result.error)) {
    throw new AdminDashboardError()
  }

  const [
    classResult,
    membershipResult,
    assignmentResult,
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
  ] = results

  return buildAdminDashboardSummary({
    ...baseData,
    classes: classResult.data ?? [],
    memberships: membershipResult.data ?? [],
    assignments: assignmentResult.data ?? [],
    outcomes: outcomeResult.data ?? [],
    componentIds: (componentResult.data ?? []).map((item) => item.id),
    assessmentItems: assessmentItemResult.data ?? [],
    grades: gradeResult.data ?? [],
    descriptions: descriptionResult.data ?? [],
    attendanceStudentIds: (attendanceResult.data ?? []).map(
      (item) => item.student_id,
    ),
    extracurricularStudentIds: (extracurricularResult.data ?? []).map(
      (item) => item.student_id,
    ),
    achievementStudentIds: (achievementResult.data ?? []).map(
      (item) => item.student_id,
    ),
    notes: noteResult.data ?? [],
    confirmations: confirmationResult.data ?? [],
  })
}
