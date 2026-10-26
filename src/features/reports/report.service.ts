import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

import type { ReportSourceData } from "./report-view-model"

const STUDENT_PHOTO_BUCKET = "student-photos"

export class ReportPreviewError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ReportPreviewError"
  }
}

async function getReportSources(
  classId: string,
  semesterId: string,
  studentIds: ReadonlyArray<string>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyMap<string, ReportSourceData>> {
  if (studentIds.length === 0) return new Map()

  const [
    schoolResult,
    assignmentResult,
    subjectResult,
    componentResult,
    gradeResult,
    descriptionResult,
    gradingSettingResult,
    subjectKkmResult,
    attendanceResult,
    extracurricularCatalogResult,
    extracurricularResult,
    achievementResult,
    noteResult,
    biodataResult,
    religionOverrideResult,
    classResult,
  ] = await Promise.all([
    client
      .from("schools")
      .select(
        "id,school_name,npsn,address,village,district,city,province,postal_code,email,principal_name,principal_nip,logo_url,updated_at",
      )
      .eq("singleton_key", true)
      .maybeSingle(),
    client
      .from("teacher_assignments")
      .select("subject_id")
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .eq("is_active", true),
    client
      .from("subjects")
      .select(
        "id,name,code,religion_scope,is_local_content,display_order,is_active,created_at,updated_at",
      )
      .eq("is_active", true)
      .order("display_order")
      .order("name"),
    client
      .from("assessment_components")
      .select("id,code,name,display_order,is_active")
      .eq("is_active", true)
      .order("display_order"),
    client
      .from("grade_entries")
      .select(
        "id,student_id,class_id,subject_id,learning_outcome_id,assessment_component_id,semester_id,grade_level,score,created_at,updated_at",
      )
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("report_descriptions")
      .select(
        "id,student_id,class_id,subject_id,assessment_component_id,semester_id,grade_level,strongest_outcome_id,weakest_outcome_id,generated_description,final_description,created_at,updated_at",
      )
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("grading_settings")
      .select("semester_id,kkm_mode,single_kkm")
      .eq("semester_id", semesterId)
      .maybeSingle(),
    client
      .from("subject_kkm_rules")
      .select("semester_id,subject_id,minimum_mastery_score")
      .eq("semester_id", semesterId),
    client
      .from("attendance")
      .select(
        "id,student_id,class_id,semester_id,sick_days,permitted_days,absent_days,created_at,updated_at",
      )
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("extracurriculars")
      .select("id,name")
      .eq("is_active", true)
      .order("name"),
    client
      .from("student_extracurriculars")
      .select("student_id,extracurricular_id,achievement,description")
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("achievements")
      .select(
        "id,student_id,class_id,semester_id,achievement_type,achievement_level,description,event_year,event_date,created_at,updated_at",
      )
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId)
      .order("event_year", { ascending: false }),
    client
      .from("homeroom_notes")
      .select("id,student_id,class_id,semester_id,note,created_at,updated_at")
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("student_biodata")
      .select(
        "student_id,photo_path,student_phone,father_name,father_education,father_occupation,father_address,father_phone,mother_name,mother_education,mother_occupation,mother_address,mother_phone,guardian_name,guardian_education,guardian_occupation,guardian_address,guardian_phone,created_by,updated_by,created_at,updated_at",
      )
      .in("student_id", studentIds),
    client
      .from("student_religion_subject_overrides")
      .select("student_id,subject_id")
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("semester_id", semesterId),
    client
      .from("classes")
      .select("homeroom_teacher_id")
      .eq("id", classId)
      .maybeSingle(),
  ])

  const results = [
    schoolResult,
    assignmentResult,
    subjectResult,
    componentResult,
    gradeResult,
    descriptionResult,
    gradingSettingResult,
    subjectKkmResult,
    attendanceResult,
    extracurricularCatalogResult,
    extracurricularResult,
    achievementResult,
    noteResult,
    biodataResult,
    religionOverrideResult,
    classResult,
  ]
  if (results.some((result) => result.error)) {
    throw new ReportPreviewError(
      "Preview rapor belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }

  const assignedSubjectIds = [
    ...new Set((assignmentResult.data ?? []).map((item) => item.subject_id)),
  ]
  const homeroomTeacherId = classResult.data?.homeroom_teacher_id
  const homeroomTeacherResult = homeroomTeacherId
    ? await client
        .from("teacher_profiles")
        .select("full_name,nip")
        .eq("id", homeroomTeacherId)
        .maybeSingle()
    : { data: null, error: null }
  if (homeroomTeacherResult.error) {
    throw new ReportPreviewError(
      "Data wali kelas belum dapat dimuat. Periksa koneksi lalu coba lagi.",
    )
  }

  const photoUrls = new Map<string, string | null>()
  await Promise.all(
    (biodataResult.data ?? []).map(async (biodata) => {
      if (!biodata.photo_path) return
      const { data, error } = await client.storage
        .from(STUDENT_PHOTO_BUCKET)
        .createSignedUrl(biodata.photo_path, 3600)
      photoUrls.set(biodata.student_id, error ? null : data.signedUrl)
    }),
  )
  return new Map(
    studentIds.map((studentId) => {
      const studentBiodata =
        (biodataResult.data ?? []).find(
          (item) => item.student_id === studentId,
        ) ?? null
      return [
        studentId,
        {
          school: schoolResult.data,
          assignedSubjectIds,
          subjects: subjectResult.data ?? [],
          assessmentComponents: componentResult.data ?? [],
          gradeEntries: (gradeResult.data ?? []).filter(
            (item) => item.student_id === studentId,
          ),
          descriptions: (descriptionResult.data ?? []).filter(
            (item) => item.student_id === studentId,
          ),
          gradingSetting: gradingSettingResult.data,
          subjectKkmRules: subjectKkmResult.data ?? [],
          attendance:
            (attendanceResult.data ?? []).find(
              (item) => item.student_id === studentId,
            ) ?? null,
          extracurricularCatalog: extracurricularCatalogResult.data ?? [],
          extracurricularEntries: (extracurricularResult.data ?? []).filter(
            (item) => item.student_id === studentId,
          ),
          achievements: (achievementResult.data ?? []).filter(
            (item) => item.student_id === studentId,
          ),
          homeroomNote:
            (noteResult.data ?? []).find(
              (item) => item.student_id === studentId,
            ) ?? null,
          studentBiodata,
          studentPhotoUrl: photoUrls.get(studentId) ?? null,
          homeroomTeacher: homeroomTeacherResult.data,
          religionSubjectOverrideId:
            (religionOverrideResult.data ?? []).find(
              (item) => item.student_id === studentId,
            )?.subject_id ?? null,
        },
      ]
    }),
  )
}

export async function getReportSourceData(
  classId: string,
  semesterId: string,
  studentId: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReportSourceData> {
  const sources = await getReportSources(
    classId,
    semesterId,
    [studentId],
    client,
  )
  const source = sources.get(studentId)
  if (!source) {
    throw new ReportPreviewError("Data siswa untuk preview belum tersedia.")
  }
  return source
}

export function getClassReportSourceData(
  classId: string,
  semesterId: string,
  studentIds: ReadonlyArray<string>,
  client: RapotKuSupabaseClient = getSupabaseClient(),
) {
  return getReportSources(classId, semesterId, studentIds, client)
}
