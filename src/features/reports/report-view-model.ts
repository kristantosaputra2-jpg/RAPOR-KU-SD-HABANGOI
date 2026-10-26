import type {
  AcademicYear,
  Semester,
} from "@/features/academic-periods/academic-periods.service"
import type { Achievement } from "@/features/achievements/achievement.service"
import type { Attendance } from "@/features/attendance/attendance.service"
import type { SchoolClass } from "@/features/classes/class.service"
import type { ReportDescription } from "@/features/grades/description.service"
import {
  calculateFinalGrade,
  calculatePredicate,
  type GradePredicate,
} from "@/features/grades/grade-calculation"
import type { GradeEntry } from "@/features/grades/grade.service"
import type { AssessmentComponent } from "@/features/grades/grading-settings.service"
import type { HomeroomNote } from "@/features/homeroom-notes/homeroom-note.service"
import type { SchoolSettings } from "@/features/schools/school-settings.service"
import type { Student } from "@/features/students/student.service"
import {
  subjectMatchesStudentReligion,
  type Subject,
} from "@/features/subjects/subject.service"
import type { Tables } from "@/types/database.types"

type GradingSetting = Pick<
  Tables<"grading_settings">,
  "semester_id" | "kkm_mode" | "single_kkm"
>
type SubjectKkm = Pick<
  Tables<"subject_kkm_rules">,
  "semester_id" | "subject_id" | "minimum_mastery_score"
>
type StudentExtracurricular = Pick<
  Tables<"student_extracurriculars">,
  "student_id" | "extracurricular_id" | "achievement" | "description"
>
type Extracurricular = Pick<Tables<"extracurriculars">, "id" | "name">
type StudentBiodata = Tables<"student_biodata">
type HomeroomTeacher = Pick<Tables<"teacher_profiles">, "full_name" | "nip">
type AssessmentItemScope = Pick<
  Tables<"assessment_items">,
  "subject_id" | "learning_outcome_id" | "assessment_component_id"
>

export type ReportSourceData = Readonly<{
  school: SchoolSettings | null
  assignedSubjectIds: ReadonlyArray<string>
  subjects: ReadonlyArray<Subject>
  assessmentComponents: ReadonlyArray<AssessmentComponent>
  assessmentItems: ReadonlyArray<AssessmentItemScope>
  gradeEntries: ReadonlyArray<GradeEntry>
  descriptions: ReadonlyArray<ReportDescription>
  gradingSetting: GradingSetting | null
  subjectKkmRules: ReadonlyArray<SubjectKkm>
  attendance: Attendance | null
  extracurricularCatalog: ReadonlyArray<Extracurricular>
  extracurricularEntries: ReadonlyArray<StudentExtracurricular>
  achievements: ReadonlyArray<Achievement>
  homeroomNote: HomeroomNote | null
  studentBiodata: StudentBiodata | null
  studentPhotoUrl: string | null
  homeroomTeacher: HomeroomTeacher | null
  religionSubjectOverrideId: string | null
}>

export type ReportComponentResult = Readonly<{
  componentId: string
  componentName: string
  average: number | null
  predicate: GradePredicate | null
  description: string | null
}>

export type ReportSubjectResult = Readonly<{
  subjectId: string
  subjectName: string
  kkm: number | null
  components: ReadonlyArray<ReportComponentResult>
}>

export type ReportViewModel = Readonly<{
  templateGroup: "lower_primary" | "upper_primary"
  templateLabel: string
  school: Readonly<{
    name: string
    npsn: string | null
    address: string | null
    principalName: string | null
    principalNip: string | null
    logoUrl: string | null
  }>
  student: Readonly<{
    id: string
    name: string
    nis: string
    nisn: string | null
    gender: string
    birth: string | null
    religion: string | null
    address: string | null
    fatherName: string | null
    motherName: string | null
    guardianName: string | null
    phone: string | null
    photoUrl: string | null
    father: FamilyMember
    mother: FamilyMember
    guardian: FamilyMember
  }>
  academicPeriod: Readonly<{
    className: string
    gradeLevel: number
    academicYear: string
    semester: string
  }>
  subjects: ReadonlyArray<ReportSubjectResult>
  attendance: Readonly<{
    sickDays: number | null
    permittedDays: number | null
    absentDays: number | null
  }>
  extracurriculars: ReadonlyArray<{
    name: string
    achievement: string
    description: string
  }>
  achievements: ReadonlyArray<{
    type: string
    level: string
    description: string
    year: number
  }>
  homeroomNote: string | null
  homeroomTeacher: Readonly<{
    name: string | null
    nip: string | null
  }>
}>

type FamilyMember = Readonly<{
  name: string | null
  education: string | null
  occupation: string | null
  address: string | null
  phone: string | null
}>

function optionalText(value: string | null | undefined) {
  const normalized = value?.trim() ?? ""
  return normalized || null
}

function formatSchoolAddress(school: SchoolSettings | null) {
  if (!school) return null
  return (
    [
      school.address,
      school.village,
      school.district,
      school.city,
      school.province,
      school.postal_code,
    ]
      .map(optionalText)
      .filter((value): value is string => Boolean(value))
      .join(", ") || null
  )
}

function formatBirth(student: Student) {
  const parts = [optionalText(student.birth_place)]
  if (student.birth_date) {
    parts.push(
      new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
        new Date(`${student.birth_date}T00:00:00`),
      ),
    )
  }
  return (
    parts.filter((value): value is string => Boolean(value)).join(", ") || null
  )
}

function resolveSubjectKkm(subjectId: string, source: ReportSourceData) {
  const setting = source.gradingSetting
  if (!setting) return null
  const value =
    setting.kkm_mode === "single"
      ? setting.single_kkm
      : source.subjectKkmRules.find((rule) => rule.subject_id === subjectId)
          ?.minimum_mastery_score
  return typeof value === "number" && value >= 1 && value <= 100 ? value : null
}

function buildSubjectResults(source: ReportSourceData, student: Student) {
  const assignedIds = new Set(source.assignedSubjectIds)
  return source.subjects
    .filter(
      (subject) =>
        subject.is_active &&
        assignedIds.has(subject.id) &&
        subjectMatchesStudentReligion(
          subject,
          student.religion,
          source.religionSubjectOverrideId,
        ),
    )
    .map<ReportSubjectResult>((subject) => {
      const kkm = resolveSubjectKkm(subject.id, source)
      const components = source.assessmentComponents
        .filter((component) => component.is_active)
        .map<ReportComponentResult>((component) => {
          const detailedOutcomeIds = new Set(
            source.assessmentItems
              .filter(
                (item) =>
                  item.subject_id === subject.id &&
                  item.assessment_component_id === component.id,
              )
              .map((item) => item.learning_outcome_id),
          )
          const scores = source.gradeEntries
            .filter(
              (entry) =>
                entry.subject_id === subject.id &&
                entry.assessment_component_id === component.id &&
                (!detailedOutcomeIds.has(entry.learning_outcome_id) ||
                  entry.calculation_source === "formative_summative"),
            )
            .map((entry) => entry.score)
          const average = calculateFinalGrade(scores)
          const description = source.descriptions.find(
            (item) =>
              item.subject_id === subject.id &&
              item.assessment_component_id === component.id,
          )?.final_description
          return {
            componentId: component.id,
            componentName: component.name,
            average,
            predicate:
              average === null || kkm === null
                ? null
                : calculatePredicate(average, kkm),
            description: optionalText(description),
          }
        })
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        kkm,
        components,
      }
    })
}

export function buildReportViewModel(
  input: Readonly<{
    schoolClass: SchoolClass
    student: Student
    academicYear: AcademicYear
    semester: Semester
    source: ReportSourceData
  }>,
): ReportViewModel {
  const { schoolClass, student, academicYear, semester, source } = input
  const extracurricularName = new Map(
    source.extracurricularCatalog.map((item) => [item.id, item.name]),
  )
  const biodata = source.studentBiodata
  const familyMember = (
    prefix: "father" | "mother" | "guardian",
    legacyName: string | null,
  ): FamilyMember => ({
    name: optionalText(biodata?.[`${prefix}_name`] ?? legacyName),
    education: optionalText(biodata?.[`${prefix}_education`]),
    occupation: optionalText(biodata?.[`${prefix}_occupation`]),
    address: optionalText(biodata?.[`${prefix}_address`]),
    phone: optionalText(biodata?.[`${prefix}_phone`]),
  })
  const father = familyMember("father", student.father_name)
  const mother = familyMember("mother", student.mother_name)
  const guardian = familyMember("guardian", student.guardian_name)
  return {
    templateGroup: schoolClass.template_group as
      "lower_primary" | "upper_primary",
    templateLabel:
      schoolClass.template_group === "lower_primary"
        ? "Rapor Kelas Rendah"
        : "Rapor Kelas Tinggi",
    school: {
      name: source.school?.school_name ?? "Identitas sekolah belum diisi",
      npsn: optionalText(source.school?.npsn),
      address: formatSchoolAddress(source.school),
      principalName: optionalText(source.school?.principal_name),
      principalNip: optionalText(source.school?.principal_nip),
      logoUrl: optionalText(source.school?.logo_url),
    },
    student: {
      id: student.id,
      name: student.full_name,
      nis: student.nis,
      nisn: optionalText(student.nisn),
      gender: student.gender === "male" ? "Laki-laki" : "Perempuan",
      birth: formatBirth(student),
      religion: optionalText(student.religion),
      address: optionalText(student.address),
      fatherName: father.name,
      motherName: mother.name,
      guardianName: guardian.name,
      phone: optionalText(biodata?.student_phone),
      photoUrl: optionalText(source.studentPhotoUrl),
      father,
      mother,
      guardian,
    },
    academicPeriod: {
      className: schoolClass.name,
      gradeLevel: schoolClass.grade_level,
      academicYear: academicYear.name,
      semester: `Semester ${semester.number}`,
    },
    subjects: buildSubjectResults(source, student),
    attendance: {
      sickDays: source.attendance?.sick_days ?? null,
      permittedDays: source.attendance?.permitted_days ?? null,
      absentDays: source.attendance?.absent_days ?? null,
    },
    extracurriculars: source.extracurricularEntries.map((entry) => ({
      name:
        extracurricularName.get(entry.extracurricular_id) ?? "Ekstrakurikuler",
      achievement: entry.achievement,
      description: entry.description,
    })),
    achievements: source.achievements.map((achievement) => ({
      type: achievement.achievement_type,
      level: achievement.achievement_level,
      description: achievement.description,
      year: achievement.event_year,
    })),
    homeroomNote: optionalText(source.homeroomNote?.note),
    homeroomTeacher: {
      name: optionalText(source.homeroomTeacher?.full_name),
      nip: optionalText(source.homeroomTeacher?.nip),
    },
  }
}
