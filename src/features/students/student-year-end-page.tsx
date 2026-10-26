import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  LoaderCircle,
  LogOut,
  Users,
} from "lucide-react"

import {
  getAcademicPeriods,
  type AcademicPeriods,
} from "@/features/academic-periods/academic-periods.service"
import { getClasses, type SchoolClass } from "@/features/classes/class.service"
import {
  getClassMemberships,
  getStudents,
  type ClassMembership,
  type Student,
} from "@/features/students/student.service"
import {
  getNextAcademicYearName,
  processStudentYearEnd,
} from "@/features/students/student-year-end.service"

type StudentYearEndPageProps = Readonly<{
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const emptyPeriods: AcademicPeriods = {
  schoolId: null,
  academicYears: [],
  semesters: [],
}

const selectClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)] disabled:bg-[#f3f4f6]"

export function StudentYearEndPage({
  userName,
  schoolName,
  onBack,
  onLogout,
}: StudentYearEndPageProps) {
  const [periods, setPeriods] = useState<AcademicPeriods>(emptyPeriods)
  const [classes, setClasses] = useState<ReadonlyArray<SchoolClass>>([])
  const [students, setStudents] = useState<ReadonlyArray<Student>>([])
  const [memberships, setMemberships] = useState<
    ReadonlyArray<ClassMembership>
  >([])
  const [sourceClassId, setSourceClassId] = useState("")
  const [targetClassId, setTargetClassId] = useState("")
  const [selectedStudentIds, setSelectedStudentIds] = useState<
    ReadonlySet<string>
  >(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [message, setMessage] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    void Promise.all([
      getAcademicPeriods(),
      getClasses(),
      getStudents(),
      getClassMemberships(),
    ])
      .then(
        ([loadedPeriods, loadedClasses, loadedStudents, loadedMemberships]) => {
          if (!isMounted) return
          setPeriods(loadedPeriods)
          setClasses(loadedClasses)
          setStudents(loadedStudents)
          setMemberships(loadedMemberships)
          setIsLoading(false)
        },
      )
      .catch(() => {
        if (!isMounted) return
        setLoadError(
          "Data kenaikan kelas belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
        )
        setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const semestersById = useMemo(
    () => new Map(periods.semesters.map((semester) => [semester.id, semester])),
    [periods.semesters],
  )
  const academicYearsById = useMemo(
    () =>
      new Map(
        periods.academicYears.map((academicYear) => [
          academicYear.id,
          academicYear,
        ]),
      ),
    [periods.academicYears],
  )
  const sourceClasses = useMemo(
    () =>
      classes
        .filter(
          (schoolClass) =>
            semestersById.get(schoolClass.semester_id)?.number === 2,
        )
        .sort((first, second) => {
          const firstYear =
            academicYearsById.get(first.academic_year_id)?.name ?? ""
          const secondYear =
            academicYearsById.get(second.academic_year_id)?.name ?? ""
          return (
            secondYear.localeCompare(firstYear) ||
            first.grade_level - second.grade_level ||
            first.name.localeCompare(second.name)
          )
        }),
    [academicYearsById, classes, semestersById],
  )
  const sourceClass =
    sourceClasses.find((schoolClass) => schoolClass.id === sourceClassId) ??
    null
  const sourceAcademicYear = sourceClass
    ? (academicYearsById.get(sourceClass.academic_year_id) ?? null)
    : null
  const nextAcademicYear = useMemo(() => {
    if (!sourceAcademicYear) return null

    const nextName = getNextAcademicYearName(sourceAcademicYear.name)
    return (
      periods.academicYears.find(
        (academicYear) => academicYear.name === nextName,
      ) ?? null
    )
  }, [periods.academicYears, sourceAcademicYear])
  const targetSemester = useMemo(
    () =>
      nextAcademicYear
        ? (periods.semesters.find(
            (semester) =>
              semester.academic_year_id === nextAcademicYear.id &&
              semester.number === 1,
          ) ?? null)
        : null,
    [nextAcademicYear, periods.semesters],
  )
  const targetClasses = useMemo(
    () =>
      sourceClass && sourceClass.grade_level < 6 && targetSemester
        ? classes.filter(
            (schoolClass) =>
              schoolClass.semester_id === targetSemester.id &&
              schoolClass.grade_level === sourceClass.grade_level + 1,
          )
        : [],
    [classes, sourceClass, targetSemester],
  )
  const studentsById = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students],
  )
  const eligibleStudents = useMemo(() => {
    if (!sourceClass) return []

    const alreadyPlaced = new Set(
      targetSemester
        ? memberships
            .filter(
              (membership) => membership.semester_id === targetSemester.id,
            )
            .map((membership) => membership.student_id)
        : [],
    )

    return memberships
      .filter(
        (membership) =>
          membership.class_id === sourceClass.id &&
          membership.semester_id === sourceClass.semester_id,
      )
      .map((membership) => studentsById.get(membership.student_id))
      .filter((student): student is Student =>
        Boolean(
          student?.is_active &&
          (sourceClass.grade_level === 6 || !alreadyPlaced.has(student.id)),
        ),
      )
      .sort((first, second) => first.full_name.localeCompare(second.full_name))
  }, [memberships, sourceClass, studentsById, targetSemester])
  const isGraduation = sourceClass?.grade_level === 6
  const canProcess =
    selectedStudentIds.size > 0 &&
    Boolean(sourceClass) &&
    (isGraduation || Boolean(targetClassId))

  function selectSourceClass(classId: string) {
    setSourceClassId(classId)
    setTargetClassId("")
    setSelectedStudentIds(new Set())
    setMessage("")
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) => {
      const next = new Set(current)
      if (next.has(studentId)) next.delete(studentId)
      else next.add(studentId)
      return next
    })
  }

  function toggleAllStudents() {
    setSelectedStudentIds((current) =>
      current.size === eligibleStudents.length
        ? new Set()
        : new Set(eligibleStudents.map((student) => student.id)),
    )
  }

  async function handleProcess() {
    if (!sourceClass || !canProcess) return

    const actionLabel = isGraduation ? "meluluskan" : "menaikkan"
    if (
      !window.confirm(
        `Yakin ingin ${actionLabel} ${selectedStudentIds.size} siswa? Riwayat semester lama tetap disimpan.`,
      )
    ) {
      return
    }

    setIsSaving(true)
    setMessage("")

    try {
      const count = await processStudentYearEnd(
        sourceClass.id,
        [...selectedStudentIds],
        isGraduation ? null : targetClassId,
      )
      setMessage(
        isGraduation
          ? `${count} siswa berhasil diluluskan dan dikeluarkan dari daftar aktif.`
          : `${count} siswa berhasil dinaikkan ke kelas tujuan.`,
      )
      setSelectedStudentIds(new Set())
      setLoadAttempt((attempt) => attempt + 1)
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Proses belum dapat disimpan. Coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--rapotku-canvas)] px-4 py-5 text-[var(--rapotku-text)] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-bold"
            type="button"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={18} />
            Dashboard
          </button>
          <div className="text-right">
            <p className="font-bold">{userName}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Admin Sekolah"}
            </p>
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-sm font-bold text-[var(--rapotku-brand)]"
            type="button"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
          >
            <LogOut aria-hidden="true" size={17} />
            {isLoggingOut ? "Keluar..." : "Keluar"}
          </button>
        </header>

        <section className="mt-6 rounded-3xl bg-[linear-gradient(135deg,#8f1016_0%,#cf242b_100%)] p-6 text-white shadow-[0_18px_45px_rgba(130,18,23,0.18)] sm:p-8">
          <span className="grid size-12 place-items-center rounded-2xl bg-white/15">
            <GraduationCap aria-hidden="true" size={25} />
          </span>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
            Naik Kelas & Lulus
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">
            Proses siswa setelah semester genap. Data lama tidak dihapus
            sehingga rapor dan riwayat kelas tetap dapat dibuka.
          </p>
        </section>

        {message ? (
          <div
            className="mt-5 rounded-2xl border border-[var(--rapotku-border)] bg-white p-4 text-sm"
            role="status"
          >
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="mt-6 flex min-h-64 items-center justify-center rounded-3xl border border-[var(--rapotku-border)] bg-white">
            <p className="inline-flex items-center gap-2" role="status">
              <LoaderCircle className="animate-spin" size={20} />
              Memuat data siswa...
            </p>
          </div>
        ) : loadError ? (
          <div className="mt-6 rounded-3xl border border-[#f5b7ba] bg-white p-6">
            <p className="flex items-center gap-2 font-bold text-[var(--rapotku-brand)]">
              <AlertCircle aria-hidden="true" size={20} />
              {loadError}
            </p>
            <button
              className="mt-4 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-4 text-sm font-bold text-white"
              type="button"
              onClick={() => {
                setIsLoading(true)
                setLoadError("")
                setLoadAttempt((attempt) => attempt + 1)
              }}
            >
              Coba lagi
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold">1. Pilih kelas asal</h2>
              <label
                className="mt-4 block text-sm font-bold"
                htmlFor="source-class"
              >
                Kelas semester genap
              </label>
              <select
                className={selectClassName}
                id="source-class"
                value={sourceClassId}
                onChange={(event) => selectSourceClass(event.target.value)}
              >
                <option value="">Pilih kelas</option>
                {sourceClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {academicYearsById.get(schoolClass.academic_year_id)?.name}{" "}
                    · Kelas {schoolClass.name}
                  </option>
                ))}
              </select>

              {sourceClass && !isGraduation ? (
                <>
                  <h2 className="mt-6 text-lg font-bold">
                    2. Pilih kelas tujuan
                  </h2>
                  <label
                    className="mt-4 block text-sm font-bold"
                    htmlFor="target-class"
                  >
                    Kelas {sourceClass.grade_level + 1}, semester 1
                  </label>
                  <select
                    className={selectClassName}
                    id="target-class"
                    value={targetClassId}
                    onChange={(event) => setTargetClassId(event.target.value)}
                    disabled={!targetClasses.length}
                  >
                    <option value="">Pilih kelas tujuan</option>
                    {targetClasses.map((schoolClass) => (
                      <option key={schoolClass.id} value={schoolClass.id}>
                        {nextAcademicYear?.name} · Kelas {schoolClass.name}
                      </option>
                    ))}
                  </select>
                  {!targetClasses.length ? (
                    <p className="mt-3 rounded-xl bg-[#fff7e8] p-3 text-xs leading-5 text-[#7a4a00]">
                      Buat dahulu tahun ajaran berikutnya, Semester 1, dan kelas
                      tingkat {sourceClass.grade_level + 1}.
                    </p>
                  ) : null}
                </>
              ) : null}

              {isGraduation ? (
                <p className="mt-5 rounded-xl bg-[#ecf8f2] p-4 text-sm leading-6 text-[var(--rapotku-success)]">
                  Siswa kelas 6 akan ditandai Lulus dan tidak lagi muncul pada
                  daftar siswa aktif.
                </p>
              ) : null}
            </section>

            <section className="rounded-3xl border border-[var(--rapotku-border)] bg-white p-5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">
                    {sourceClass
                      ? "3. Pilih siswa"
                      : "Pilih kelas terlebih dahulu"}
                  </h2>
                  <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                    {eligibleStudents.length} siswa siap diproses
                  </p>
                </div>
                {eligibleStudents.length ? (
                  <button
                    className="min-h-11 rounded-xl border border-[var(--rapotku-border)] px-4 text-sm font-bold text-[var(--rapotku-brand)]"
                    type="button"
                    onClick={toggleAllStudents}
                  >
                    {selectedStudentIds.size === eligibleStudents.length
                      ? "Batalkan semua"
                      : "Pilih semua"}
                  </button>
                ) : null}
              </div>

              {sourceClass && !eligibleStudents.length ? (
                <div className="mt-5 rounded-2xl border border-dashed border-[var(--rapotku-border)] p-8 text-center">
                  <Users
                    aria-hidden="true"
                    className="mx-auto text-[var(--rapotku-muted)]"
                    size={32}
                  />
                  <p className="mt-3 font-bold">
                    Tidak ada siswa yang perlu diproses
                  </p>
                  <p className="mt-1 text-sm text-[var(--rapotku-muted)]">
                    Semua siswa sudah diproses atau kelas belum memiliki siswa
                    aktif.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {eligibleStudents.map((student) => (
                    <label
                      className="flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--rapotku-border)] p-4 transition has-[:checked]:border-[var(--rapotku-brand)] has-[:checked]:bg-[var(--rapotku-brand-soft)]"
                      key={student.id}
                    >
                      <input
                        className="size-5 accent-[var(--rapotku-brand)]"
                        type="checkbox"
                        checked={selectedStudentIds.has(student.id)}
                        onChange={() => toggleStudent(student.id)}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-bold">
                          {student.full_name}
                        </span>
                        <span className="text-xs text-[var(--rapotku-muted)]">
                          NIS {student.nis}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {sourceClass ? (
                <div className="mt-6 border-t border-[var(--rapotku-border)] pt-5">
                  <button
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
                    type="button"
                    disabled={!canProcess || isSaving}
                    onClick={() => void handleProcess()}
                  >
                    {isSaving ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        size={19}
                      />
                    ) : (
                      <CheckCircle2 aria-hidden="true" size={19} />
                    )}
                    {isSaving
                      ? "Memproses..."
                      : isGraduation
                        ? `Luluskan ${selectedStudentIds.size} siswa`
                        : `Naikkan ${selectedStudentIds.size} siswa`}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-[var(--rapotku-muted)]">
                    Proses ini tidak menghapus nilai, rapor, atau riwayat kelas
                    lama.
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
