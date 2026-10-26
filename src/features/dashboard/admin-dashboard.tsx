import { useEffect, useState } from "react"
import {
  AlertCircle,
  BookHeart,
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  School,
  Settings,
  Target,
  UserCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import {
  getAcademicPeriods,
  getActiveAcademicPeriod,
  type ActiveAcademicPeriod,
} from "@/features/academic-periods/academic-periods.service"
import { MotionHeroImage } from "@/components/motion-hero-image"
import { AppLogo } from "@/components/app-logo"
import {
  getAdminDashboardSummary,
  type AdminDashboardSummary,
} from "./admin-dashboard.service"

type AdminDashboardProps = Readonly<{
  userName: string
  schoolName?: string
  onLogout: () => Promise<void>
  onOpenSchoolSettings: () => void
  onOpenAcademicPeriods: () => void
  onOpenTeachers: () => void
  onOpenClasses: () => void
  onOpenStudents: () => void
  onOpenStudentYearEnd?: () => void
  onOpenSubjects: () => void
  onOpenAssignments?: () => void
  onOpenLearningOutcomes?: () => void
  onOpenGrades?: () => void
  onOpenAttendance?: () => void
  onOpenExtracurriculars?: () => void
  onOpenAchievements?: () => void
  onOpenHomeroomNotes?: () => void
  onOpenReportCompleteness?: () => void
  onOpenLeger?: () => void
  onOpenReports?: () => void
  onOpenReportSettings?: () => void
}>

type NavigationItem = Readonly<{
  label: string
  icon: LucideIcon
  isActive?: boolean
  action?:
    | "school-settings"
    | "academic-periods"
    | "teachers"
    | "classes"
    | "students"
    | "student-year-end"
    | "subjects"
    | "assignments"
    | "learning-outcomes"
    | "grades"
    | "attendance"
    | "extracurriculars"
    | "achievements"
    | "homeroom-notes"
    | "report-completeness"
    | "leger"
    | "reports"
    | "report-settings"
}>

const navigationGroups: ReadonlyArray<
  Readonly<{ label: string; items: ReadonlyArray<NavigationItem> }>
> = [
  {
    label: "Utama",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, isActive: true },
      {
        label: "Pengaturan Sekolah",
        icon: School,
        action: "school-settings",
      },
      {
        label: "Tahun & Semester",
        icon: CalendarDays,
        action: "academic-periods",
      },
    ],
  },
  {
    label: "Data Master",
    items: [
      { label: "Data Guru", icon: UserCheck, action: "teachers" },
      { label: "Data Kelas", icon: GraduationCap, action: "classes" },
      { label: "Data Siswa", icon: Users, action: "students" },
      {
        label: "Naik Kelas & Lulus",
        icon: GraduationCap,
        action: "student-year-end",
      },
      { label: "Mata Pelajaran", icon: BookOpen, action: "subjects" },
      { label: "Penugasan Guru", icon: ClipboardList, action: "assignments" },
      { label: "CP / Deskripsi", icon: Target, action: "learning-outcomes" },
    ],
  },
  {
    label: "Rapor",
    items: [
      { label: "Input Nilai", icon: ClipboardCheck, action: "grades" },
      { label: "Absensi", icon: CalendarDays, action: "attendance" },
      {
        label: "Ekstrakurikuler",
        icon: GraduationCap,
        action: "extracurriculars",
      },
      { label: "Prestasi", icon: BookOpenCheck, action: "achievements" },
      {
        label: "Catatan Wali Kelas",
        icon: BookHeart,
        action: "homeroom-notes",
      },
      {
        label: "Monitoring",
        icon: ClipboardCheck,
        action: "report-completeness",
      },
      { label: "Leger Kelas 1–6", icon: ClipboardList, action: "leger" },
      { label: "Laporan", icon: FileText, action: "reports" },
      { label: "Pengaturan Rapor", icon: Settings, action: "report-settings" },
    ],
  },
]

const summaryCards = [
  {
    key: "activeStudents",
    label: "Siswa Aktif",
    icon: Users,
    color: "bg-[#fff0f1] text-[var(--rapotku-brand)]",
  },
  {
    key: "activeClasses",
    label: "Kelas",
    icon: GraduationCap,
    color: "bg-[#fff7e8] text-[#9a5a00]",
  },
  {
    key: "activeTeachers",
    label: "Guru",
    icon: UserCheck,
    color: "bg-[#eef6ff] text-[#245da8]",
  },
  {
    key: "readyReports",
    label: "Rapor Siap Cetak",
    icon: ClipboardCheck,
    color: "bg-[#ecf8f2] text-[var(--rapotku-success)]",
  },
] as const

const setupSteps = [
  {
    title: "Lengkapi identitas sekolah",
    description: "Nama sekolah, alamat, kepala sekolah, dan logo.",
  },
  {
    title: "Atur tahun ajaran dan semester",
    description: "Pilih periode yang sedang aktif digunakan.",
  },
  {
    title: "Tambahkan guru dan kelas",
    description: "Siapkan data guru, rombel, dan wali kelas.",
  },
  {
    title: "Tambahkan siswa dan mata pelajaran",
    description: "Data ini akan menjadi dasar pengisian nilai.",
  },
] as const

function Brand({ schoolName }: Readonly<{ schoolName?: string }>) {
  return (
    <div className="flex items-center gap-3">
      <AppLogo className="size-11 shadow-[0_8px_20px_rgba(201,29,36,0.2)]" />
      <div>
        <p className="font-bold leading-tight">RaporKu</p>
        <p className="mt-0.5 max-w-44 truncate text-xs text-[var(--rapotku-muted)]">
          {schoolName ?? "Admin Sekolah"}
        </p>
      </div>
    </div>
  )
}

function DashboardNavigation({
  onOpenSchoolSettings,
  onOpenAcademicPeriods,
  onOpenTeachers,
  onOpenClasses,
  onOpenStudents,
  onOpenStudentYearEnd,
  onOpenSubjects,
  onOpenAssignments,
  onOpenLearningOutcomes,
  onOpenGrades,
  onOpenAttendance,
  onOpenExtracurriculars,
  onOpenAchievements,
  onOpenHomeroomNotes,
  onOpenReportCompleteness,
  onOpenLeger,
  onOpenReports,
  onOpenReportSettings,
}: Readonly<{
  onOpenSchoolSettings: () => void
  onOpenAcademicPeriods: () => void
  onOpenTeachers: () => void
  onOpenClasses: () => void
  onOpenStudents: () => void
  onOpenStudentYearEnd: () => void
  onOpenSubjects: () => void
  onOpenAssignments: () => void
  onOpenLearningOutcomes: () => void
  onOpenGrades: () => void
  onOpenAttendance: () => void
  onOpenExtracurriculars: () => void
  onOpenAchievements: () => void
  onOpenHomeroomNotes: () => void
  onOpenReportCompleteness: () => void
  onOpenLeger: () => void
  onOpenReports: () => void
  onOpenReportSettings: () => void
}>) {
  return (
    <nav
      aria-label="Menu utama"
      className="app-sidebar-scroll mt-6 min-h-0 flex-1 space-y-7 overflow-y-auto overscroll-contain pr-1"
    >
      {navigationGroups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#98a2b3]">
            {group.label}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.label}>
                  {item.isActive ? (
                    <div
                      aria-current="page"
                      className="app-nav-button is-active flex min-h-11 items-center gap-3 rounded-xl bg-[var(--rapotku-brand-soft)] px-3 font-semibold text-[var(--rapotku-brand)]"
                    >
                      <Icon aria-hidden="true" size={19} />
                      <span className="app-nav-label">{item.label}</span>
                    </div>
                  ) : item.action ? (
                    <button
                      className="app-nav-button flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-semibold text-[var(--rapotku-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
                      type="button"
                      onClick={() => {
                        if (item.action === "school-settings") {
                          onOpenSchoolSettings()
                        } else if (item.action === "academic-periods") {
                          onOpenAcademicPeriods()
                        } else if (item.action === "teachers") {
                          onOpenTeachers()
                        } else if (item.action === "classes") {
                          onOpenClasses()
                        } else if (item.action === "students") {
                          onOpenStudents()
                        } else if (item.action === "student-year-end") {
                          onOpenStudentYearEnd()
                        } else if (item.action === "assignments") {
                          onOpenAssignments()
                        } else if (item.action === "learning-outcomes") {
                          onOpenLearningOutcomes()
                        } else if (item.action === "grades") {
                          onOpenGrades()
                        } else if (item.action === "attendance") {
                          onOpenAttendance()
                        } else if (item.action === "extracurriculars") {
                          onOpenExtracurriculars()
                        } else if (item.action === "achievements") {
                          onOpenAchievements()
                        } else if (item.action === "homeroom-notes") {
                          onOpenHomeroomNotes()
                        } else if (item.action === "report-completeness") {
                          onOpenReportCompleteness()
                        } else if (item.action === "leger") {
                          onOpenLeger()
                        } else if (item.action === "reports") {
                          onOpenReports()
                        } else if (item.action === "report-settings") {
                          onOpenReportSettings()
                        } else {
                          onOpenSubjects()
                        }
                      }}
                    >
                      <Icon aria-hidden="true" size={19} />
                      <span className="app-nav-label">{item.label}</span>
                    </button>
                  ) : (
                    <div
                      aria-disabled="true"
                      className="app-nav-button is-disabled flex min-h-11 items-center gap-3 rounded-xl px-3 text-[var(--rapotku-muted)]"
                    >
                      <Icon aria-hidden="true" size={19} />
                      <span className="app-nav-label flex-1">{item.label}</span>
                      <span className="rounded-full bg-[#f0f1f3] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#7b8494]">
                        Segera
                      </span>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}

function AccountPanel({
  userName,
  isLoggingOut,
  onLogout,
}: Readonly<{
  userName: string
  isLoggingOut: boolean
  onLogout: () => void
}>) {
  return (
    <div className="rounded-2xl border border-[var(--rapotku-border)] bg-[#fafafa] p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] font-bold text-[var(--rapotku-brand)]">
          {userName.trim().charAt(0).toUpperCase() || "A"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">{userName}</p>
          <p className="text-xs text-[var(--rapotku-muted)]">Admin</p>
        </div>
      </div>
      <button
        className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-semibold transition hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:cursor-not-allowed disabled:opacity-60"
        type="button"
        onClick={onLogout}
        disabled={isLoggingOut}
      >
        <LogOut aria-hidden="true" size={17} />
        {isLoggingOut ? "Sedang keluar..." : "Keluar"}
      </button>
    </div>
  )
}

export function AdminDashboard({
  userName,
  schoolName,
  onLogout,
  onOpenSchoolSettings,
  onOpenAcademicPeriods,
  onOpenTeachers,
  onOpenClasses,
  onOpenStudents,
  onOpenStudentYearEnd = () => undefined,
  onOpenSubjects,
  onOpenAssignments = () => undefined,
  onOpenLearningOutcomes = () => undefined,
  onOpenGrades = () => undefined,
  onOpenAttendance = () => undefined,
  onOpenExtracurriculars = () => undefined,
  onOpenAchievements = () => undefined,
  onOpenHomeroomNotes = () => undefined,
  onOpenReportCompleteness = () => undefined,
  onOpenLeger = () => undefined,
  onOpenReports = () => undefined,
  onOpenReportSettings = () => undefined,
}: AdminDashboardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState("")
  const [activePeriod, setActivePeriod] = useState<ActiveAcademicPeriod>({
    academicYear: null,
    semester: null,
  })
  const [summary, setSummary] = useState<AdminDashboardSummary | null>(null)
  const [summaryStatus, setSummaryStatus] = useState<
    "loading" | "ready" | "error"
  >("loading")
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setSummaryStatus("loading")
      let period: ActiveAcademicPeriod = {
        academicYear: null,
        semester: null,
      }

      try {
        const periods = await getAcademicPeriods()
        period = getActiveAcademicPeriod(periods)
      } catch {
        // Master-data counts can still load when the period summary is unavailable.
      }

      if (!isMounted) return
      setActivePeriod(period)

      try {
        const dashboardSummary = await getAdminDashboardSummary(
          period.semester?.id ?? null,
        )
        if (isMounted) {
          setSummary(dashboardSummary)
          setSummaryStatus("ready")
        }
      } catch {
        if (isMounted) {
          setSummaryStatus("error")
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  async function handleLogout() {
    setLogoutError("")
    setIsLoggingOut(true)

    try {
      await onLogout()
    } catch {
      setLogoutError(
        "Belum dapat keluar. Periksa koneksi internet lalu coba lagi.",
      )
      setIsLoggingOut(false)
    }
  }

  const hasActivePeriod = Boolean(
    activePeriod.academicYear && activePeriod.semester,
  )
  const setupChecks = [
    summary?.schoolIdentityComplete ?? false,
    hasActivePeriod,
    Boolean(summary && summary.activeTeachers > 0 && summary.activeClasses > 0),
    Boolean(summary && summary.activeStudents > 0 && summary.hasSubjects),
  ]
  const completedSetupSteps = setupChecks.filter(Boolean).length
  const gradeCompletionPercent = summary?.enrolledStudents
    ? Math.round((summary.completeGrades / summary.enrolledStudents) * 100)
    : 0
  const summaryCardValues = summaryCards.map((card) => ({
    ...card,
    value: summary?.[card.key],
  }))
  const dashboardMessage = (() => {
    if (summaryStatus === "loading") {
      return {
        title: "Memeriksa kondisi data sekolah",
        description: "Ringkasan siswa, kelas, nilai, dan rapor sedang dimuat.",
      }
    }
    if (summaryStatus === "error") {
      return {
        title: "Ringkasan belum dapat dimuat",
        description:
          "Periksa koneksi internet lalu muat kembali. Menu lainnya tetap dapat digunakan.",
      }
    }
    if (completedSetupSteps < setupSteps.length) {
      return {
        title: "Pengaturan awal belum lengkap",
        description:
          "Lengkapi langkah yang belum selesai agar pengisian nilai dan rapor dapat berjalan lancar.",
      }
    }
    if (!summary?.enrolledStudents) {
      return {
        title: "Belum ada siswa pada semester aktif",
        description:
          "Tempatkan siswa ke kelas semester aktif sebelum memulai pengisian nilai.",
      }
    }
    if (summary.incompleteReports > 0) {
      return {
        title: `${summary.incompleteReports} rapor masih perlu dilengkapi`,
        description:
          "Buka Monitoring untuk melihat nilai atau bagian rapor yang belum selesai.",
      }
    }
    return {
      title: "Semua rapor sudah siap dicetak",
      description:
        "Seluruh siswa pada semester aktif telah melewati pemeriksaan kelengkapan.",
    }
  })()

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)] lg:grid lg:grid-cols-[276px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen overflow-hidden border-r border-[var(--rapotku-border)] bg-white p-5 lg:flex lg:flex-col">
        <Brand schoolName={schoolName} />
        <DashboardNavigation
          onOpenSchoolSettings={onOpenSchoolSettings}
          onOpenAcademicPeriods={onOpenAcademicPeriods}
          onOpenTeachers={onOpenTeachers}
          onOpenClasses={onOpenClasses}
          onOpenStudents={onOpenStudents}
          onOpenStudentYearEnd={onOpenStudentYearEnd}
          onOpenSubjects={onOpenSubjects}
          onOpenAssignments={onOpenAssignments}
          onOpenLearningOutcomes={onOpenLearningOutcomes}
          onOpenGrades={onOpenGrades}
          onOpenAttendance={onOpenAttendance}
          onOpenExtracurriculars={onOpenExtracurriculars}
          onOpenAchievements={onOpenAchievements}
          onOpenHomeroomNotes={onOpenHomeroomNotes}
          onOpenReportCompleteness={onOpenReportCompleteness}
          onOpenLeger={onOpenLeger}
          onOpenReports={onOpenReports}
          onOpenReportSettings={onOpenReportSettings}
        />
        <div className="mt-auto pt-6">
          <AccountPanel
            userName={userName}
            isLoggingOut={isLoggingOut}
            onLogout={() => void handleLogout()}
          />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[var(--rapotku-border)] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <Brand schoolName={schoolName} />
          </div>
          <div className="hidden lg:block">
            <p className="text-sm text-[var(--rapotku-muted)]">
              Ruang kerja Admin
            </p>
          </div>
          <button
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white lg:hidden"
            type="button"
            aria-label="Buka menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen(true)}
          >
            <Menu aria-hidden="true" size={21} />
          </button>
          <div className="hidden items-center gap-3 lg:flex">
            <span className="grid size-9 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-sm font-bold text-[var(--rapotku-brand)]">
              {userName.trim().charAt(0).toUpperCase() || "A"}
            </span>
            <div>
              <p className="text-sm font-bold leading-tight">{userName}</p>
              <p className="text-xs text-[var(--rapotku-muted)]">Admin</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
                Dashboard Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Selamat datang, {userName}
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
                Lihat kondisi data sekolah dan lanjutkan pengaturan dari satu
                tempat.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#b9e3ce] bg-[#ecf8f2] px-3 py-2 text-xs font-bold text-[var(--rapotku-success)]">
                <span className="size-2 rounded-full bg-[var(--rapotku-success)]" />
                Akun Admin aktif
              </span>
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--rapotku-border)] bg-white px-3 text-xs font-bold text-[var(--rapotku-muted)]"
                type="button"
                onClick={onOpenAcademicPeriods}
              >
                <CalendarDays aria-hidden="true" size={15} />
                {activePeriod.academicYear
                  ? `${activePeriod.academicYear.name}${
                      activePeriod.semester
                        ? ` · Semester ${activePeriod.semester.number}`
                        : " · Semester belum aktif"
                    }`
                  : "Periode belum aktif"}
              </button>
            </div>
          </section>

          {logoutError ? (
            <div
              className="mt-5 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
              role="alert"
            >
              {logoutError}
            </div>
          ) : null}

          <section
            aria-labelledby="setup-warning-title"
            className="dashboard-motion-hero relative mt-6 overflow-hidden rounded-3xl bg-[var(--rapotku-brand-strong)] text-white shadow-[0_16px_40px_rgba(130,18,23,0.16)]"
          >
            <MotionHeroImage
              className="w-full sm:absolute sm:inset-0 sm:size-full"
              imageClassName="h-auto w-full sm:size-full sm:object-cover sm:object-center"
              alt="Ilustrasi siswa sekolah dasar di halaman sekolah"
            />
            <div className="absolute inset-0 hidden bg-[linear-gradient(90deg,rgba(72,7,11,0.92)_0%,rgba(101,10,15,0.72)_45%,rgba(94,8,13,0.08)_100%)] sm:block" />
            <div className="relative flex flex-col gap-4 bg-[linear-gradient(135deg,#9f151b_0%,#c91d24_100%)] p-5 sm:min-h-64 sm:max-w-[62%] sm:justify-center sm:bg-none sm:p-8">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/15">
                <AlertCircle aria-hidden="true" size={25} />
              </span>
              <div>
                {schoolName ? (
                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-white/75">
                    RaporKu - {schoolName}
                  </p>
                ) : null}
                <h2 id="setup-warning-title" className="text-xl font-bold">
                  {dashboardMessage.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                  {dashboardMessage.description}
                </p>
                {summaryStatus === "error" ? (
                  <button
                    className="mt-4 min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-[var(--rapotku-brand-strong)]"
                    type="button"
                    onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                  >
                    Coba lagi
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <section
            aria-labelledby="summary-title"
            className="relative z-10 mx-2 -mt-5 rounded-2xl border border-white/70 bg-white/72 p-3 shadow-[0_18px_45px_rgba(112,43,48,0.12)] backdrop-blur-md sm:mx-5 sm:-mt-8 sm:p-4"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <h2 id="summary-title" className="text-lg font-bold">
                Ringkasan hari ini
              </h2>
              <span className="text-xs font-medium text-[var(--rapotku-muted)]">
                {schoolName ?? "Identitas sekolah belum tersedia"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {summaryCardValues.map((card) => {
                const Icon = card.icon

                return (
                  <article
                    aria-label={card.label}
                    className="app-interactive-card rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_24px_rgba(24,31,45,0.04)] sm:p-5"
                    key={card.label}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold leading-5 text-[var(--rapotku-muted)] sm:text-sm">
                          {card.label}
                        </p>
                        <p
                          className="mt-2 text-3xl font-bold"
                          aria-label={
                            summaryStatus === "loading"
                              ? "Sedang memuat"
                              : undefined
                          }
                        >
                          {summaryStatus === "loading" ? (
                            <LoaderCircle
                              aria-hidden="true"
                              className="animate-spin"
                              size={27}
                            />
                          ) : summaryStatus === "error" ? (
                            "—"
                          ) : (
                            (card.value ?? 0)
                          )}
                        </p>
                      </div>
                      <span
                        className={`grid size-10 shrink-0 place-items-center rounded-xl ${card.color}`}
                      >
                        <Icon aria-hidden="true" size={20} />
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-[#8a93a2]">
                      {summaryStatus === "loading"
                        ? "Memuat data..."
                        : summaryStatus === "error"
                          ? "Belum tersedia"
                          : card.key === "readyReports"
                            ? `dari ${summary?.enrolledStudents ?? 0} siswa di kelas`
                            : "Data aktif"}
                    </p>
                  </article>
                )
              })}
            </div>
          </section>

          <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
            <section
              aria-labelledby="setup-title"
              className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
                    Langkah berikutnya
                  </p>
                  <h2 id="setup-title" className="mt-1 text-xl font-bold">
                    Siapkan data dasar sekolah
                  </h2>
                </div>
                <span className="rounded-full bg-[#f0f1f3] px-3 py-1 text-xs font-semibold text-[var(--rapotku-muted)]">
                  {completedSetupSteps} dari 4
                </span>
              </div>

              <ol className="mt-5 divide-y divide-[var(--rapotku-border)]">
                {setupSteps.map((step, index) => (
                  <li
                    className="flex items-start gap-3 py-4 first:pt-0 last:pb-0"
                    key={step.title}
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-sm font-bold text-[var(--rapotku-brand)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm leading-5 text-[var(--rapotku-muted)]">
                        {step.description}
                      </p>
                    </div>
                    {setupChecks[index] ? (
                      <span className="mt-1 shrink-0 rounded-full bg-[#ecf8f2] px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--rapotku-success)]">
                        Selesai
                      </span>
                    ) : (
                      <button
                        className="min-h-11 shrink-0 rounded-xl bg-[var(--rapotku-brand)] px-4 text-sm font-bold text-white transition hover:bg-[var(--rapotku-brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)]"
                        type="button"
                        onClick={
                          index === 0
                            ? onOpenSchoolSettings
                            : index === 1
                              ? onOpenAcademicPeriods
                              : index === 2
                                ? onOpenTeachers
                                : onOpenStudents
                        }
                      >
                        {index === 0 && schoolName ? "Atur" : "Buka"}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl bg-[#f7f8fa] px-4 py-3 text-sm leading-6 text-[var(--rapotku-muted)]">
                Selesaikan langkah dari atas ke bawah. Data yang sudah lengkap
                ditandai otomatis oleh sistem.
              </p>
            </section>

            <section
              aria-labelledby="grade-completeness-title"
              className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-6"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-[#ecf8f2] text-[var(--rapotku-success)]">
                <ClipboardCheck aria-hidden="true" size={24} />
              </span>
              <h2
                id="grade-completeness-title"
                className="mt-4 text-xl font-bold"
              >
                Kelengkapan nilai
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
                {summaryStatus === "ready" && summary?.enrolledStudents
                  ? `${summary.completeGrades} dari ${summary.enrolledStudents} siswa sudah memiliki nilai lengkap.`
                  : summaryStatus === "ready"
                    ? "Belum ada siswa pada kelas semester aktif."
                    : summaryStatus === "error"
                      ? "Kelengkapan nilai belum dapat diperiksa."
                      : "Sedang memeriksa kelengkapan nilai."}
              </p>
              <div
                className="mt-5 h-3 overflow-hidden rounded-full bg-[#eef0f3]"
                role="progressbar"
                aria-label="Persentase kelengkapan nilai"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={gradeCompletionPercent}
              >
                <div
                  className="h-full rounded-full bg-[var(--rapotku-success)] transition-[width]"
                  style={{ width: `${gradeCompletionPercent}%` }}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                <span className="font-bold">
                  {gradeCompletionPercent}% lengkap
                </span>
                <span className="text-[var(--rapotku-muted)]">
                  {summary?.incompleteReports ?? 0} rapor belum siap
                </span>
              </div>
              <button
                className="mt-6 min-h-11 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-bold text-[var(--rapotku-brand)] transition hover:bg-[var(--rapotku-brand-soft)]"
                type="button"
                onClick={onOpenReportCompleteness}
              >
                Buka Monitoring
              </button>
            </section>
          </div>
        </main>
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#1d222b]/45"
            type="button"
            aria-label="Tutup menu"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside
            aria-label="Menu Admin"
            aria-modal="true"
            role="dialog"
            className="app-mobile-menu relative flex h-full w-[min(88vw,320px)] flex-col overflow-hidden bg-white p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3">
              <Brand schoolName={schoolName} />
              <button
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup menu"
                onClick={() => setIsMenuOpen(false)}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <DashboardNavigation
              onOpenSchoolSettings={() => {
                setIsMenuOpen(false)
                onOpenSchoolSettings()
              }}
              onOpenAcademicPeriods={() => {
                setIsMenuOpen(false)
                onOpenAcademicPeriods()
              }}
              onOpenTeachers={() => {
                setIsMenuOpen(false)
                onOpenTeachers()
              }}
              onOpenClasses={() => {
                setIsMenuOpen(false)
                onOpenClasses()
              }}
              onOpenStudents={() => {
                setIsMenuOpen(false)
                onOpenStudents()
              }}
              onOpenStudentYearEnd={() => {
                setIsMenuOpen(false)
                onOpenStudentYearEnd()
              }}
              onOpenSubjects={() => {
                setIsMenuOpen(false)
                onOpenSubjects()
              }}
              onOpenAssignments={() => {
                setIsMenuOpen(false)
                onOpenAssignments()
              }}
              onOpenLearningOutcomes={() => {
                setIsMenuOpen(false)
                onOpenLearningOutcomes()
              }}
              onOpenGrades={() => {
                setIsMenuOpen(false)
                onOpenGrades()
              }}
              onOpenAttendance={() => {
                setIsMenuOpen(false)
                onOpenAttendance()
              }}
              onOpenExtracurriculars={() => {
                setIsMenuOpen(false)
                onOpenExtracurriculars()
              }}
              onOpenAchievements={() => {
                setIsMenuOpen(false)
                onOpenAchievements()
              }}
              onOpenHomeroomNotes={() => {
                setIsMenuOpen(false)
                onOpenHomeroomNotes()
              }}
              onOpenReportCompleteness={() => {
                setIsMenuOpen(false)
                onOpenReportCompleteness()
              }}
              onOpenLeger={() => {
                setIsMenuOpen(false)
                onOpenLeger()
              }}
              onOpenReports={() => {
                setIsMenuOpen(false)
                onOpenReports()
              }}
              onOpenReportSettings={() => {
                setIsMenuOpen(false)
                onOpenReportSettings()
              }}
            />
            <div className="mt-auto pt-6">
              <AccountPanel
                userName={userName}
                isLoggingOut={isLoggingOut}
                onLogout={() => void handleLogout()}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  )
}
