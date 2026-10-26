import { describe, expect, it } from "vitest"

import type {
  AcademicYear,
  Semester,
} from "@/features/academic-periods/academic-periods.service"
import type { SchoolClass } from "@/features/classes/class.service"
import type { Student } from "@/features/students/student.service"

import {
  buildReportViewModel,
  type ReportSourceData,
} from "./report-view-model"

const schoolClass: SchoolClass = {
  id: "class-1",
  academic_year_id: "year-1",
  semester_id: "semester-1",
  grade_level: 2,
  name: "2A",
  homeroom_teacher_id: null,
  template_group: "lower_primary",
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const student: Student = {
  id: "student-1",
  full_name:
    "Nama Peserta Didik Sangat Panjang yang Tetap Harus Terlihat Lengkap",
  nis: "001",
  nisn: null,
  gender: "female",
  birth_place: "Tumbang Kawei",
  birth_date: "2018-01-02",
  religion: null,
  address: null,
  father_name: null,
  mother_name: null,
  guardian_name: null,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const academicYear: AcademicYear = {
  id: "year-1",
  school_id: "school-1",
  name: "2026/2027",
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

const semester: Semester = {
  id: "semester-1",
  academic_year_id: "year-1",
  number: 1,
  is_active: true,
  created_at: "2026-01-01",
  updated_at: "2026-01-01",
}

function createSource(): ReportSourceData {
  return {
    school: null,
    assignedSubjectIds: ["subject-1"],
    subjects: [
      {
        id: "subject-1",
        name: "Matematika",
        code: null,
        religion_scope: null,
        is_local_content: false,
        display_order: 1,
        is_active: true,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    assessmentComponents: [
      {
        id: "knowledge",
        code: "knowledge",
        name: "Pengetahuan",
        display_order: 1,
        is_active: true,
      },
      {
        id: "skills",
        code: "skills",
        name: "Keterampilan",
        display_order: 2,
        is_active: true,
      },
    ],
    assessmentItems: [],
    gradeEntries: [
      {
        id: "grade-1",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        learning_outcome_id: "cp-1",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        score: 80,
        calculation_source: "legacy",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
      {
        id: "grade-2",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        learning_outcome_id: "cp-2",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        score: 90,
        calculation_source: "legacy",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    descriptions: [
      {
        id: "description-1",
        student_id: "student-1",
        class_id: "class-1",
        subject_id: "subject-1",
        assessment_component_id: "knowledge",
        semester_id: "semester-1",
        grade_level: 2,
        strongest_outcome_id: "cp-2",
        weakest_outcome_id: "cp-1",
        generated_description: "Draft",
        final_description:
          "Deskripsi hasil belajar yang panjang tetap dipertahankan seluruhnya agar dapat diperiksa guru sebelum rapor dicetak.",
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
      },
    ],
    gradingSetting: {
      semester_id: "semester-1",
      kkm_mode: "single",
      single_kkm: 70,
    },
    subjectKkmRules: [],
    attendance: null,
    extracurricularCatalog: [],
    extracurricularEntries: [],
    achievements: [],
    homeroomNote: null,
    studentBiodata: null,
    studentPhotoUrl: null,
    homeroomTeacher: null,
    religionSubjectOverrideId: null,
  }
}

describe("buildReportViewModel", () => {
  it("menyusun rapor kelas rendah, rata-rata, predikat, dan deskripsi final", () => {
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: createSource(),
    })

    expect(report.templateGroup).toBe("lower_primary")
    expect(report.student.name).toBe(student.full_name)
    expect(report.subjects[0]?.components[0]).toMatchObject({
      componentName: "Pengetahuan",
      average: 85,
      predicate: "B",
      description: expect.stringContaining("dipertahankan seluruhnya"),
    })
    expect(report.subjects[0]?.components[1]).toMatchObject({
      componentName: "Keterampilan",
      average: null,
      predicate: null,
      description: null,
    })
  })

  it("mengabaikan nilai manual lama saat CP sudah memakai Formatif dan Sumatif", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: {
        ...source,
        assessmentItems: [
          {
            subject_id: "subject-1",
            learning_outcome_id: "cp-1",
            assessment_component_id: "knowledge",
          },
        ],
        gradeEntries: [
          ...source.gradeEntries,
          {
            ...source.gradeEntries[0]!,
            id: "grade-derived",
            score: 70,
            calculation_source: "formative_summative",
          },
        ],
      },
    })

    expect(report.subjects[0]?.components[0]?.average).toBe(80)
  })

  it("memakai template kelas tinggi dan KKM per mata pelajaran", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass: {
        ...schoolClass,
        grade_level: 5,
        template_group: "upper_primary",
      },
      student,
      academicYear,
      semester,
      source: {
        ...source,
        gradingSetting: {
          semester_id: "semester-1",
          kkm_mode: "multi",
          single_kkm: null,
        },
        subjectKkmRules: [
          {
            semester_id: "semester-1",
            subject_id: "subject-1",
            minimum_mastery_score: 75,
          },
        ],
      },
    })

    expect(report.templateGroup).toBe("upper_primary")
    expect(report.subjects[0]?.kkm).toBe(75)
    expect(report.subjects[0]?.components[0]?.predicate).toBe("B")
  })

  it("hanya memasukkan mapel agama yang sesuai dengan agama siswa", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass,
      student: { ...student, religion: "Kristen Protestan" },
      academicYear,
      semester,
      source: {
        ...source,
        assignedSubjectIds: ["subject-1", "subject-2"],
        subjects: [
          {
            ...source.subjects[0]!,
            name: "Agama Islam",
            religion_scope: "islam",
          },
          {
            ...source.subjects[0]!,
            id: "subject-2",
            name: "Agama Kristen",
            religion_scope: "christian",
          },
        ],
      },
    })

    expect(report.subjects.map((item) => item.subjectName)).toEqual([
      "Agama Kristen",
    ])
  })

  it("memakai mapel agama pengganti manual beserta CP dan deskripsinya", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass,
      student: { ...student, religion: "Katolik" },
      academicYear,
      semester,
      source: {
        ...source,
        religionSubjectOverrideId: "subject-2",
        assignedSubjectIds: ["subject-1", "subject-2"],
        gradeEntries: source.gradeEntries.map((entry) => ({
          ...entry,
          subject_id: "subject-2",
        })),
        descriptions: source.descriptions.map((description) => ({
          ...description,
          subject_id: "subject-2",
          final_description: "Deskripsi CP Kristen Protestan",
        })),
        subjects: [
          {
            ...source.subjects[0]!,
            name: "Agama Katolik",
            religion_scope: "catholic",
          },
          {
            ...source.subjects[0]!,
            id: "subject-2",
            name: "Agama Kristen Protestan",
            religion_scope: "christian",
          },
        ],
      },
    })

    expect(report.subjects.map((item) => item.subjectName)).toEqual([
      "Agama Kristen Protestan",
    ])
    expect(report.subjects[0]?.components[0]).toMatchObject({
      average: 85,
      description: "Deskripsi CP Kristen Protestan",
    })
  })

  it("menandai field opsional kosong tanpa mengarang isinya", () => {
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: createSource(),
    })

    expect(report.school.name).toBe("Identitas sekolah belum diisi")
    expect(report.student.nisn).toBeNull()
    expect(report.student.address).toBeNull()
    expect(report.attendance.sickDays).toBeNull()
    expect(report.homeroomNote).toBeNull()
    expect(report.extracurriculars).toEqual([])
    expect(report.achievements).toEqual([])
  })

  it("memakai biodata keluarga, foto, dan wali kelas pada dokumen resmi", () => {
    const source = createSource()
    const report = buildReportViewModel({
      schoolClass,
      student,
      academicYear,
      semester,
      source: {
        ...source,
        studentPhotoUrl: "https://example.test/photo.jpg",
        homeroomTeacher: { full_name: "Ibu Wali Kelas", nip: "19800101" },
        studentBiodata: {
          student_id: student.id,
          photo_path: "student-1/photo",
          student_phone: "08123456789",
          father_name: "Bapak Siswa",
          father_education: "SMA",
          father_occupation: "Petani",
          father_address: "Tumbang Kawei",
          father_phone: "081200000001",
          mother_name: "Ibu Siswa",
          mother_education: "SMP",
          mother_occupation: "Wiraswasta",
          mother_address: "Tumbang Kawei",
          mother_phone: "081200000002",
          guardian_name: null,
          guardian_education: null,
          guardian_occupation: null,
          guardian_address: null,
          guardian_phone: null,
          created_by: "user-1",
          updated_by: "user-1",
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
        },
      },
    })

    expect(report.student.father).toMatchObject({
      name: "Bapak Siswa",
      education: "SMA",
      occupation: "Petani",
    })
    expect(report.student.photoUrl).toBe("https://example.test/photo.jpg")
    expect(report.homeroomTeacher).toEqual({
      name: "Ibu Wali Kelas",
      nip: "19800101",
    })
  })
})
