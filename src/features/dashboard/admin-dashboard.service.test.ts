import { describe, expect, it } from "vitest"

import { buildAdminDashboardSummary } from "./admin-dashboard.service"

const school = {
  school_name: "Sekolah Uji",
  npsn: "12345678",
  address: "Jalan Uji",
  district: "Kecamatan Uji",
  city: "Kabupaten Uji",
  province: "Provinsi Uji",
  principal_name: "Kepala Sekolah",
}

const completeData = {
  school,
  students: [
    {
      id: "student-1",
      full_name: "Siswa Satu",
      nis: "001",
      gender: "male",
      birth_place: "Tumbang Kawei",
      birth_date: "2018-01-01",
      is_active: true,
    },
  ],
  activeTeacherIds: ["teacher-1"],
  activeSubjectIds: ["subject-1"],
  classes: [{ id: "class-1", grade_level: 1 }],
  memberships: [{ student_id: "student-1", class_id: "class-1" }],
  assignments: [{ class_id: "class-1", subject_id: "subject-1" }],
  outcomes: [{ id: "outcome-1", subject_id: "subject-1", grade_level: 1 }],
  componentIds: ["knowledge", "skills"],
  assessmentItems: [],
  grades: [
    {
      student_id: "student-1",
      subject_id: "subject-1",
      learning_outcome_id: "outcome-1",
      assessment_component_id: "knowledge",
      calculation_source: "legacy",
    },
    {
      student_id: "student-1",
      subject_id: "subject-1",
      learning_outcome_id: "outcome-1",
      assessment_component_id: "skills",
      calculation_source: "legacy",
    },
  ],
  descriptions: [
    {
      student_id: "student-1",
      subject_id: "subject-1",
      assessment_component_id: "knowledge",
      final_description: "Baik",
    },
    {
      student_id: "student-1",
      subject_id: "subject-1",
      assessment_component_id: "skills",
      final_description: "Terampil",
    },
  ],
  attendanceStudentIds: ["student-1"],
  extracurricularStudentIds: [],
  achievementStudentIds: [],
  notes: [{ student_id: "student-1", note: "Terus belajar." }],
  confirmations: [
    {
      student_id: "student-1",
      extracurricular_confirmed_empty: true,
      achievement_confirmed_empty: true,
    },
  ],
} as const

describe("buildAdminDashboardSummary", () => {
  it("menghitung nilai lengkap dan rapor siap cetak dengan aturan monitoring", () => {
    expect(buildAdminDashboardSummary(completeData)).toEqual({
      activeStudents: 1,
      activeClasses: 1,
      activeTeachers: 1,
      enrolledStudents: 1,
      completeGrades: 1,
      readyReports: 1,
      incompleteReports: 0,
      schoolIdentityComplete: true,
      hasSubjects: true,
    })
  })

  it("tidak menghitung siswa nonaktif dan menandai rapor yang belum lengkap", () => {
    const summary = buildAdminDashboardSummary({
      ...completeData,
      students: [
        completeData.students[0],
        {
          ...completeData.students[0],
          id: "student-inactive",
          is_active: false,
        },
      ],
      grades: [],
    })

    expect(summary.activeStudents).toBe(1)
    expect(summary.completeGrades).toBe(0)
    expect(summary.readyReports).toBe(0)
    expect(summary.incompleteReports).toBe(1)
  })

  it("menunggu nilai turunan ketika CP memakai Formatif dan Sumatif", () => {
    const detailed = {
      subject_id: "subject-1",
      learning_outcome_id: "outcome-1",
      assessment_component_id: "knowledge",
    }
    const incomplete = buildAdminDashboardSummary({
      ...completeData,
      assessmentItems: [detailed],
    })
    expect(incomplete.completeGrades).toBe(0)

    const complete = buildAdminDashboardSummary({
      ...completeData,
      assessmentItems: [detailed],
      grades: completeData.grades.map((grade) =>
        grade.assessment_component_id === "knowledge"
          ? { ...grade, calculation_source: "formative_summative" }
          : grade,
      ),
    })
    expect(complete.completeGrades).toBe(1)
  })
})
