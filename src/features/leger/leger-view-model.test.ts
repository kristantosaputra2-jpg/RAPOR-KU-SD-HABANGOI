import { describe, expect, it } from "vitest"

import type { StudentReportCompleteness } from "@/features/report-status/report-completeness.service"
import type { ReportViewModel } from "@/features/reports/report-view-model"

import {
  buildLowerPrimaryLegerViewModel,
  buildUpperPrimaryLegerViewModel,
  LowerPrimaryLegerError,
} from "./leger-view-model"

function report(
  studentId: string,
  studentName: string,
  templateGroup: "lower_primary" | "upper_primary" = "lower_primary",
): ReportViewModel {
  return {
    templateGroup,
    templateLabel: "Rapor Kelas Rendah",
    school: {
      name: "SD Uji",
      npsn: null,
      address: null,
      principalName: null,
      principalNip: null,
      logoUrl: null,
    },
    student: {
      id: studentId,
      name: studentName,
      nis: `NIS-${studentId}`,
      nisn: null,
      gender: "Laki-laki",
      birth: null,
      religion: null,
      address: null,
      fatherName: null,
      motherName: null,
      guardianName: null,
      phone: null,
      photoUrl: null,
      father: {
        name: null,
        education: null,
        occupation: null,
        address: null,
        phone: null,
      },
      mother: {
        name: null,
        education: null,
        occupation: null,
        address: null,
        phone: null,
      },
      guardian: {
        name: null,
        education: null,
        occupation: null,
        address: null,
        phone: null,
      },
    },
    academicPeriod: {
      className: "Kelas 2A",
      gradeLevel: 2,
      academicYear: "2026/2027",
      semester: "Semester 1",
    },
    subjects: [
      {
        subjectId: "math",
        subjectName: "Matematika",
        kkm: 70,
        components: [
          {
            componentId: "knowledge",
            componentName: "Pengetahuan",
            average: 86,
            predicate: "B",
            description: "Memahami bilangan dengan baik.",
          },
          {
            componentId: "skill",
            componentName: "Keterampilan",
            average: 92,
            predicate: "A",
            description: "Terampil menyelesaikan latihan.",
          },
        ],
      },
      {
        subjectId: "indo",
        subjectName: "Bahasa Indonesia",
        kkm: 70,
        components: [
          {
            componentId: "knowledge",
            componentName: "Pengetahuan",
            average: 80,
            predicate: "B",
            description: null,
          },
          {
            componentId: "skill",
            componentName: "Keterampilan",
            average: null,
            predicate: null,
            description: null,
          },
        ],
      },
    ],
    attendance: { sickDays: null, permittedDays: null, absentDays: null },
    extracurriculars: [],
    achievements: [],
    homeroomNote: null,
    homeroomTeacher: { name: null, nip: null },
  }
}

function completeness(studentId: string): StudentReportCompleteness {
  return {
    studentId,
    studentName: "Ayu",
    checks: {
      identity: true,
      grades: false,
      descriptions: false,
      attendance: false,
      extracurricular: false,
      achievement: false,
      homeroomNote: false,
    },
    status: "partial",
    hasExtracurricular: false,
    hasAchievement: false,
    confirmation: {
      studentId,
      extracurricularConfirmedEmpty: false,
      achievementConfirmedEmpty: false,
    },
  }
}

describe("buildLowerPrimaryLegerViewModel", () => {
  it("menampilkan semua mapel dan memisahkan Pengetahuan dari Keterampilan", () => {
    const leger = buildLowerPrimaryLegerViewModel(
      [report("student-1", "Ayu")],
      [completeness("student-1")],
    )

    expect(leger.subjectColumns.map((item) => item.subjectName)).toEqual([
      "Matematika",
      "Bahasa Indonesia",
    ])
    expect(leger.rows[0]?.subjects[0]?.components).toMatchObject([
      { componentName: "Pengetahuan", average: 86, predicate: "B" },
      { componentName: "Keterampilan", average: 92, predicate: "A" },
    ])
    expect(leger.rows[0]?.statusLabel).toBe("Sebagian")
    expect(leger.rows[0]?.achievementSummary).toHaveLength(2)
  })

  it("menolak data kelas 4–6", () => {
    expect(() =>
      buildLowerPrimaryLegerViewModel(
        [report("student-1", "Ayu", "upper_primary")],
        [],
      ),
    ).toThrow(LowerPrimaryLegerError)
  })

  it("menggabungkan kolom mapel agama dari seluruh siswa", () => {
    const islamReport = report("student-1", "Ayu")
    const christianReport = report("student-2", "Beni")
    const replaceReligionSubject = (
      source: ReportViewModel,
      subjectId: string,
      subjectName: string,
    ): ReportViewModel => ({
      ...source,
      subjects: [
        source.subjects[0]!,
        { ...source.subjects[1]!, subjectId, subjectName },
      ],
    })

    const leger = buildLowerPrimaryLegerViewModel(
      [
        replaceReligionSubject(islamReport, "religion-islam", "Agama Islam"),
        replaceReligionSubject(
          christianReport,
          "religion-christian",
          "Agama Kristen",
        ),
      ],
      [],
    )

    expect(leger.subjectColumns.map((item) => item.subjectName)).toEqual([
      "Matematika",
      "Agama Islam",
      "Agama Kristen",
    ])
  })

  it("menyusun nilai akhir, predikat, dan deskripsi kelas 4–6 per komponen", () => {
    const leger = buildUpperPrimaryLegerViewModel(
      [report("student-1", "Ayu", "upper_primary")],
      [completeness("student-1")],
    )

    expect(leger.templateGroup).toBe("upper_primary")
    expect(leger.rows[0]?.subjects[0]?.components).toMatchObject([
      {
        componentName: "Pengetahuan",
        average: 86,
        predicate: "B",
        description: "Memahami bilangan dengan baik.",
      },
      {
        componentName: "Keterampilan",
        average: 92,
        predicate: "A",
        description: "Terampil menyelesaikan latihan.",
      },
    ])
  })
})
