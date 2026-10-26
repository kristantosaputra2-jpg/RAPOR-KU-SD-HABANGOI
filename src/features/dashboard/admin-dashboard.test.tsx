import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AdminDashboard } from "@/features/dashboard/admin-dashboard"

const academicPeriodMocks = vi.hoisted(() => ({
  getAcademicPeriods: vi.fn().mockResolvedValue({
    schoolId: "school-1",
    academicYears: [],
    semesters: [],
  }),
}))

const dashboardMocks = vi.hoisted(() => ({
  getAdminDashboardSummary: vi.fn().mockResolvedValue({
    activeStudents: 12,
    activeClasses: 2,
    activeTeachers: 4,
    enrolledStudents: 10,
    completeGrades: 6,
    readyReports: 3,
    incompleteReports: 7,
    schoolIdentityComplete: false,
    hasSubjects: true,
  }),
}))

vi.mock(
  "@/features/academic-periods/academic-periods.service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/features/academic-periods/academic-periods.service")
      >()

    return { ...original, ...academicPeriodMocks }
  },
)

vi.mock("@/features/dashboard/admin-dashboard.service", () => dashboardMocks)

describe("AdminDashboard", () => {
  it("menampilkan ringkasan dari data sekolah", async () => {
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    expect(
      screen.getByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText("SD Negeri Tumbang Kawei").length,
    ).toBeGreaterThan(0)
    expect(await screen.findByText("12")).toBeInTheDocument()
    expect(
      within(screen.getByRole("article", { name: "Kelas" })).getByText("2"),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole("article", { name: "Guru" })).getByText("4"),
    ).toBeInTheDocument()
    expect(
      within(
        screen.getByRole("article", { name: "Rapor Siap Cetak" }),
      ).getByText("3"),
    ).toBeInTheDocument()
    expect(
      screen.getByText("6 dari 10 siswa sudah memiliki nilai lengkap."),
    ).toBeInTheDocument()
    expect(
      screen.getByText("Pengaturan awal belum lengkap"),
    ).toBeInTheDocument()
  })

  it("membuka dan menutup menu pada tampilan mobile", async () => {
    const user = userEvent.setup()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Buka menu" }))
    expect(screen.getByLabelText("Menu Admin")).toBeInTheDocument()

    const closeButtons = screen.getAllByRole("button", { name: "Tutup menu" })
    await user.click(closeButtons.at(-1)!)
    expect(screen.queryByLabelText("Menu Admin")).not.toBeInTheDocument()
  })

  it("membuka menu Naik Kelas dan Lulus", async () => {
    const user = userEvent.setup()
    const onOpenStudentYearEnd = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenStudentYearEnd={onOpenStudentYearEnd}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Naik Kelas & Lulus" })[0],
    )
    expect(onOpenStudentYearEnd).toHaveBeenCalledOnce()
  })

  it("menampilkan pesan aman ketika logout gagal", async () => {
    const user = userEvent.setup()
    const onLogout = vi.fn().mockRejectedValue(new Error("network error"))
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={onLogout}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Keluar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
    )
  })

  it("membuka pengaturan sekolah dari langkah pertama", async () => {
    const user = userEvent.setup()
    const onOpenSchoolSettings = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={onOpenSchoolSettings}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getByRole("button", { name: "Atur" }))

    expect(onOpenSchoolSettings).toHaveBeenCalledOnce()
  })

  it("membuka Data Guru dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenTeachers = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={onOpenTeachers}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Guru" })[0])

    expect(onOpenTeachers).toHaveBeenCalledOnce()
  })

  it("membuka Data Kelas dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenClasses = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={onOpenClasses}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Kelas" })[0])

    expect(onOpenClasses).toHaveBeenCalledOnce()
  })

  it("membuka Data Siswa dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenStudents = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={onOpenStudents}
        onOpenSubjects={vi.fn()}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Data Siswa" })[0])

    expect(onOpenStudents).toHaveBeenCalledOnce()
  })

  it("membuka Mata Pelajaran dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenSubjects = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={onOpenSubjects}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Mata Pelajaran" })[0],
    )

    expect(onOpenSubjects).toHaveBeenCalledOnce()
  })

  it("membuka Preview Rapor dari menu Laporan", async () => {
    const user = userEvent.setup()
    const onOpenReports = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
        onOpenReports={onOpenReports}
      />,
    )

    await user.click(screen.getAllByRole("button", { name: "Laporan" })[0])

    expect(onOpenReports).toHaveBeenCalledOnce()
  })

  it("membuka Leger Kelas 1–6 dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenLeger = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
        onOpenLeger={onOpenLeger}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Leger Kelas 1–6" })[0],
    )

    expect(onOpenLeger).toHaveBeenCalledOnce()
  })

  it("membuka Pengaturan Rapor dari navigasi", async () => {
    const user = userEvent.setup()
    const onOpenReportSettings = vi.fn()
    render(
      <AdminDashboard
        userName="Admin Sekolah"
        schoolName="SD Negeri Tumbang Kawei"
        onLogout={vi.fn()}
        onOpenSchoolSettings={vi.fn()}
        onOpenAcademicPeriods={vi.fn()}
        onOpenTeachers={vi.fn()}
        onOpenClasses={vi.fn()}
        onOpenStudents={vi.fn()}
        onOpenSubjects={vi.fn()}
        onOpenReportSettings={onOpenReportSettings}
      />,
    )

    await user.click(
      screen.getAllByRole("button", { name: "Pengaturan Rapor" })[0],
    )

    expect(onOpenReportSettings).toHaveBeenCalledOnce()
    expect(screen.queryByText("Segera")).not.toBeInTheDocument()
  })
})
