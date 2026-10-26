import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { ReportViewModel } from "./report-view-model"
import { ReportPreviewTemplate } from "./report-preview-template"

const report: ReportViewModel = {
  templateGroup: "lower_primary",
  templateLabel: "Rapor Kelas Rendah",
  school: {
    name: "SD Uji",
    npsn: "12345678",
    address: "Alamat Sekolah Uji",
    principalName: "Kepala Sekolah Uji",
    principalNip: "19800101",
    logoUrl: null,
  },
  student: {
    id: "student-1",
    name: "Siswa Uji",
    nis: "001",
    nisn: "0012345678",
    gender: "Perempuan",
    birth: "Kota Uji, 1 Januari 2018",
    religion: "Kristen",
    address: "Alamat Siswa Uji",
    fatherName: "Ayah Uji",
    motherName: "Ibu Uji",
    guardianName: null,
    phone: null,
    photoUrl: null,
    father: {
      name: "Ayah Uji",
      education: null,
      occupation: "Petani",
      address: null,
      phone: null,
    },
    mother: {
      name: "Ibu Uji",
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
    className: "2A",
    gradeLevel: 2,
    academicYear: "2026/2027",
    semester: "Semester 1",
  },
  subjects: [
    {
      subjectId: "subject-1",
      subjectName: "Matematika",
      kkm: 70,
      components: [
        {
          componentId: "knowledge",
          componentName: "Pengetahuan",
          average: 84,
          predicate: "B",
          description: "Memahami bilangan dengan baik.",
        },
        {
          componentId: "skills",
          componentName: "Keterampilan",
          average: 86,
          predicate: "B",
          description: "Terampil menyelesaikan latihan.",
        },
      ],
    },
  ],
  attendance: { sickDays: 0, permittedDays: 0, absentDays: 0 },
  extracurriculars: [],
  achievements: [],
  homeroomNote: null,
  homeroomTeacher: { name: "Wali Kelas Uji", nip: "19810101" },
}

describe("ReportPreviewTemplate", () => {
  it("menampilkan struktur resmi A4 tanpa bagian kesehatan", () => {
    const { container } = render(<ReportPreviewTemplate report={report} />)

    const headline = screen.getByRole("heading", {
      name: "Laporan Hasil Capaian Kompetensi Peserta Didik Sekolah Dasar",
    })
    const coverLogo = screen.getAllByAltText("Logo Tut Wuri Handayani")[0]
    expect(coverLogo).toHaveAttribute(
      "src",
      "/images/tut-wuri-handayani-official.png",
    )
    expect(headline.compareDocumentPosition(coverLogo!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    const coverStudent = container.querySelector(".report-cover-student")
    const coverSchool = container.querySelector(".report-cover-school")
    expect(coverStudent?.compareDocumentPosition(coverSchool!)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
    expect(screen.getByText("IDENTITAS PESERTA DIDIK")).toBeInTheDocument()
    expect(screen.getAllByText("Pengetahuan").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Keterampilan").length).toBeGreaterThan(0)
    const photoFrame = screen.getByLabelText("Foto siswa ukuran 3 kali 4")
    expect(photoFrame.parentElement).toHaveClass("report-identity-approval")
    expect(screen.queryByText("Tinggi Badan")).not.toBeInTheDocument()
    expect(screen.queryByText("Kondisi Kesehatan")).not.toBeInTheDocument()
    const sheets = container.querySelectorAll(".report-sheet")
    expect(sheets[sheets.length - 1]).toHaveClass("report-chart-sheet")
    expect(
      screen.getByRole("heading", { name: "Grafik Ringkasan Hasil Belajar" }),
    ).toBeInTheDocument()
    expect(container.querySelector(".report-chart-bar--knowledge")).toHaveStyle(
      { width: "84%" },
    )
    expect(container.querySelector(".report-chart-bar--skills")).toHaveStyle({
      width: "86%",
    })
  })

  it("menampilkan empty state grafik ketika nilai mapel belum tersedia", () => {
    render(<ReportPreviewTemplate report={{ ...report, subjects: [] }} />)

    expect(
      screen.getByText("Nilai mata pelajaran belum tersedia."),
    ).toBeVisible()
  })
})
