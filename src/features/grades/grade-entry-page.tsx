import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpenCheck,
  LoaderCircle,
  LogOut,
  Save,
  Sparkles,
  X,
} from "lucide-react"

import { getTeacherAssignments } from "@/features/assignments/assignment.service"
import type { UserRole } from "@/features/auth/auth.types"
import { getClasses } from "@/features/classes/class.service"
import {
  generateDescriptionDraft,
  type OutcomeScore,
} from "./description-generation"
import {
  getReportDescriptions,
  saveReportDescription,
  type ReportDescription,
} from "./description.service"
import { calculatePredicateRanges } from "./grade-calculation"
import {
  getGradeEntries,
  parseScoreInput,
  saveLearningOutcomeScores,
  type GradeEntry,
} from "./grade.service"
import {
  calculateAssessmentResult,
  type KkmMode,
} from "./grading-configuration"
import {
  getAssessmentComponents,
  getGradingConfiguration,
  saveGradingConfiguration,
  toDomainConfiguration,
  type LoadedGradingConfiguration,
} from "./grading-settings.service"
import { getLearningOutcomes } from "@/features/learning-outcomes/learning-outcome.service"
import {
  getClassMemberships,
  getStudents,
} from "@/features/students/student.service"
import {
  getReligionScopeLabel,
  getSubjects,
  normalizeReligion,
  subjectMatchesStudentReligion,
} from "@/features/subjects/subject.service"
import {
  getStudentReligionSubjectOverrides,
  setStudentReligionSubjectOverride,
} from "@/features/subjects/student-religion-subject.service"
import { getTeacherByUserId } from "@/features/teachers/teacher.service"
import { getGradeClassOptions, getGradeSubjectOptions } from "./grade-access"

type Props = Readonly<{
  userId: string
  userName: string
  userRole: UserRole
  schoolName?: string
  onBack?: () => void
  onLogout: () => Promise<void>
}>

async function loadReferences(userId: string) {
  const [
    assignments,
    classes,
    subjects,
    outcomes,
    students,
    memberships,
    religionSubjectOverrides,
    components,
    currentTeacher,
  ] = await Promise.all([
    getTeacherAssignments(),
    getClasses(),
    getSubjects(),
    getLearningOutcomes(),
    getStudents(),
    getClassMemberships(),
    getStudentReligionSubjectOverrides(),
    getAssessmentComponents(),
    getTeacherByUserId(userId),
  ])
  return {
    assignments,
    classes,
    subjects,
    outcomes,
    students,
    memberships,
    religionSubjectOverrides,
    components,
    currentTeacher,
  }
}
type References = Awaited<ReturnType<typeof loadReferences>>

const selectClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"
const scoreClass =
  "min-h-12 w-24 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-center text-base font-bold focus:border-[var(--rapotku-brand)] focus:outline-none"
const keyFor = (componentId: string, studentId: string, outcomeId: string) =>
  `${componentId}:${studentId}:${outcomeId}`

export function GradeEntryPage({
  userId,
  userName,
  userRole,
  schoolName,
  onBack,
  onLogout,
}: Props) {
  const [references, setReferences] = useState<References | null>(null)
  const [classId, setClassId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [componentId, setComponentId] = useState("")
  const [entries, setEntries] = useState<ReadonlyArray<GradeEntry>>([])
  const [descriptions, setDescriptions] = useState<
    ReadonlyArray<ReportDescription>
  >([])
  const [configuration, setConfiguration] =
    useState<LoadedGradingConfiguration | null>(null)
  const [kkmMode, setKkmMode] = useState<KkmMode>("single")
  const [kkmDraft, setKkmDraft] = useState("")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingGrades, setIsLoadingGrades] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null)
  const [generatedDraft, setGeneratedDraft] = useState("")
  const [finalDraft, setFinalDraft] = useState("")
  const [strongestOutcomeId, setStrongestOutcomeId] = useState("")
  const [weakestOutcomeId, setWeakestOutcomeId] = useState<string | null>(null)
  const [savingReligionStudentId, setSavingReligionStudentId] = useState<
    string | null
  >(null)

  useEffect(() => {
    let mounted = true
    void loadReferences(userId)
      .then((data) => {
        if (!mounted) return
        setReferences(data)
        setComponentId(data.components[0]?.id ?? "")
        const firstClass = getGradeClassOptions(
          userRole,
          data.classes,
          data.assignments,
        )[0]
        if (firstClass) {
          setClassId(firstClass.id)
          setSubjectId(
            getGradeSubjectOptions(
              userRole,
              firstClass.id,
              firstClass.homeroom_teacher_id,
              data.currentTeacher?.id ?? null,
              data.subjects,
              data.assignments,
            )[0]?.id ?? "",
          )
        }
      })
      .catch(() => setError("Data input nilai belum dapat dimuat. Coba lagi."))
      .finally(() => setIsLoading(false))
    return () => {
      mounted = false
    }
  }, [userId, userRole])

  const selectedClass = references?.classes.find((item) => item.id === classId)
  const selectedSubject = references?.subjects.find(
    (item) => item.id === subjectId,
  )
  const components = references?.components ?? []
  const activeComponent = components.find((item) => item.id === componentId)
  const classOptions = useMemo(() => {
    if (!references) return []
    return getGradeClassOptions(
      userRole,
      references.classes,
      references.assignments,
    )
  }, [references, userRole])
  const subjectOptions = useMemo(() => {
    if (!references || !classId) return []
    return getGradeSubjectOptions(
      userRole,
      classId,
      selectedClass?.homeroom_teacher_id ?? null,
      references.currentTeacher?.id ?? null,
      references.subjects,
      references.assignments,
    )
  }, [classId, references, selectedClass?.homeroom_teacher_id, userRole])
  const outcomes = useMemo(() => {
    if (!references || !selectedClass || !subjectId) return []
    return references.outcomes.filter(
      (item) =>
        item.is_active &&
        item.subject_id === subjectId &&
        item.semester_id === selectedClass.semester_id &&
        item.grade_level === selectedClass.grade_level,
    )
  }, [references, selectedClass, subjectId])
  const classStudents = useMemo(() => {
    if (!references || !selectedClass) return []
    const ids = new Set(
      references.memberships
        .filter(
          (item) =>
            item.class_id === selectedClass.id &&
            item.semester_id === selectedClass.semester_id,
        )
        .map((item) => item.student_id),
    )
    return references.students.filter(
      (item) => item.is_active && ids.has(item.id),
    )
  }, [references, selectedClass])
  const students = useMemo(() => {
    if (!references || !selectedSubject || !selectedClass) return classStudents
    const overrideByStudent = new Map(
      references.religionSubjectOverrides
        .filter((item) => item.semester_id === selectedClass.semester_id)
        .map((item) => [item.student_id, item.subject_id]),
    )
    return classStudents.filter((student) =>
      subjectMatchesStudentReligion(
        selectedSubject,
        student.religion,
        overrideByStudent.get(student.id) ?? null,
      ),
    )
  }, [classStudents, references, selectedClass, selectedSubject])
  const religionSubjects = subjectOptions.filter(
    (subject) => subject.religion_scope !== null,
  )

  useEffect(() => {
    if (!selectedClass || !subjectId) return
    let mounted = true
    const scope = {
      classId: selectedClass.id,
      subjectId,
      semesterId: selectedClass.semester_id,
    }
    void Promise.all([
      getGradeEntries(scope),
      getReportDescriptions(scope),
      getGradingConfiguration(scope.semesterId, subjectId),
    ])
      .then(([gradeEntries, reportDescriptions, config]) => {
        if (!mounted) return
        setEntries(gradeEntries)
        setDescriptions(reportDescriptions)
        setConfiguration(config)
        setKkmMode((config.setting?.kkm_mode as KkmMode) ?? "single")
        setKkmDraft(config.effectiveKkm?.toString() ?? "")
        const next: Record<string, string> = {}
        gradeEntries.forEach((entry) => {
          next[
            keyFor(
              entry.assessment_component_id,
              entry.student_id,
              entry.learning_outcome_id,
            )
          ] = entry.score.toString()
        })
        setDrafts(next)
      })
      .catch(() => setError("Nilai atau KKM belum dapat dimuat. Coba lagi."))
      .finally(() => mounted && setIsLoadingGrades(false))
    return () => {
      mounted = false
    }
  }, [selectedClass, subjectId])

  async function changeReligionSubject(
    studentId: string,
    nextSubjectId: string,
  ) {
    if (!references || !selectedClass) return
    const existing =
      references.religionSubjectOverrides.find(
        (item) =>
          item.student_id === studentId &&
          item.semester_id === selectedClass.semester_id,
      ) ?? null
    setSavingReligionStudentId(studentId)
    setError("")
    setMessage("")

    try {
      const saved = await setStudentReligionSubjectOverride(userId, {
        studentId,
        classId: selectedClass.id,
        semesterId: selectedClass.semester_id,
        subjectId: nextSubjectId || null,
        existing,
      })
      setReferences((current) =>
        current
          ? {
              ...current,
              religionSubjectOverrides: [
                ...current.religionSubjectOverrides.filter(
                  (item) => item.id !== existing?.id,
                ),
                ...(saved ? [saved] : []),
              ],
            }
          : current,
      )
      setMessage(
        nextSubjectId
          ? "Mapel agama siswa berhasil diganti. CP dan deskripsi mengikuti mapel pilihan."
          : "Mapel agama siswa kembali mengikuti agama pada biodata.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Pengaturan mapel agama belum tersimpan.",
      )
    } finally {
      setSavingReligionStudentId(null)
    }
  }

  function summary(studentId: string) {
    const domain = configuration ? toDomainConfiguration(configuration) : null
    if (!domain || !activeComponent) return { average: null, predicate: null }
    try {
      const scores = outcomes
        .map((outcome) =>
          parseScoreInput(
            drafts[keyFor(activeComponent.id, studentId, outcome.id)] ?? "",
          ),
        )
        .filter((score): score is number => score !== null)
      return calculateAssessmentResult(scores, domain)
    } catch {
      return { average: null, predicate: null }
    }
  }

  async function saveKkm() {
    if (!selectedClass || !subjectId) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      await saveGradingConfiguration(userId, {
        semesterId: selectedClass.semester_id,
        subjectId,
        mode: kkmMode,
        kkm: Number(kkmDraft),
      })
      setConfiguration(
        await getGradingConfiguration(selectedClass.semester_id, subjectId),
      )
      setMessage(
        kkmMode === "single"
          ? "Single KKM tersimpan."
          : "KKM mata pelajaran tersimpan.",
      )
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "KKM belum tersimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  async function saveScores() {
    if (!selectedClass || !subjectId || !activeComponent) return
    setIsSaving(true)
    setError("")
    setMessage("")
    const scope = {
      classId: selectedClass.id,
      subjectId,
      semesterId: selectedClass.semester_id,
      gradeLevel: selectedClass.grade_level,
    }
    try {
      await Promise.all(
        outcomes.map((outcome) =>
          saveLearningOutcomeScores(
            userId,
            scope,
            outcome.id,
            activeComponent.id,
            students.map((student) => ({
              studentId: student.id,
              score: parseScoreInput(
                drafts[keyFor(activeComponent.id, student.id, outcome.id)] ??
                  "",
              ),
              existingEntryId: entries.find(
                (item) =>
                  item.student_id === student.id &&
                  item.learning_outcome_id === outcome.id &&
                  item.assessment_component_id === activeComponent.id,
              )?.id,
            })),
          ),
        ),
      )
      setEntries(await getGradeEntries(scope))
      setMessage(
        `Nilai ${activeComponent.name} seluruh siswa berhasil disimpan.`,
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nilai belum tersimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  function componentDescription(studentId: string) {
    return descriptions.find(
      (item) =>
        item.student_id === studentId &&
        item.assessment_component_id === activeComponent?.id,
    )
  }
  function outcomeScores(studentId: string): OutcomeScore[] {
    if (!activeComponent) return []
    return outcomes
      .map((outcome) => {
        try {
          const score = parseScoreInput(
            drafts[keyFor(activeComponent.id, studentId, outcome.id)] ?? "",
          )
          return score === null
            ? null
            : { outcomeId: outcome.id, description: outcome.description, score }
        } catch {
          return null
        }
      })
      .filter((item): item is OutcomeScore => item !== null)
  }
  function generate(studentId: string, confirmOverwrite: boolean) {
    const existing = componentDescription(studentId)
    if (
      confirmOverwrite &&
      existing &&
      existing.final_description !== existing.generated_description &&
      !window.confirm(
        "Deskripsi sudah diedit manual. Buat ulang akan mengganti isi editor. Lanjutkan?",
      )
    )
      return
    try {
      const draft = generateDescriptionDraft(outcomeScores(studentId))
      setGeneratedDraft(draft.text)
      setFinalDraft(draft.text)
      setStrongestOutcomeId(draft.strongestOutcomeId)
      setWeakestOutcomeId(draft.weakestOutcomeId)
      setEditingStudentId(studentId)
      setError("")
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Deskripsi belum dapat dibuat.",
      )
    }
  }
  function openDescription(studentId: string) {
    const existing = componentDescription(studentId)
    if (!existing) return generate(studentId, false)
    setGeneratedDraft(existing.generated_description)
    setFinalDraft(existing.final_description)
    setStrongestOutcomeId(existing.strongest_outcome_id ?? "")
    setWeakestOutcomeId(existing.weakest_outcome_id)
    setEditingStudentId(studentId)
  }
  async function saveDescription() {
    if (
      !editingStudentId ||
      !selectedClass ||
      !subjectId ||
      !activeComponent ||
      !strongestOutcomeId
    )
      return
    setIsSaving(true)
    setError("")
    try {
      const saved = await saveReportDescription(userId, {
        studentId: editingStudentId,
        classId: selectedClass.id,
        subjectId,
        assessmentComponentId: activeComponent.id,
        semesterId: selectedClass.semester_id,
        gradeLevel: selectedClass.grade_level,
        strongestOutcomeId,
        weakestOutcomeId,
        generatedDescription: generatedDraft,
        finalDescription: finalDraft,
      })
      setDescriptions((current) => [
        ...current.filter(
          (item) =>
            item.student_id !== editingStudentId ||
            item.assessment_component_id !== activeComponent.id,
        ),
        saved,
      ])
      setEditingStudentId(null)
      setMessage(`Deskripsi ${activeComponent.name} berhasil disimpan.`)
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Deskripsi belum tersimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const ranges = configuration?.effectiveKkm
    ? calculatePredicateRanges(configuration.effectiveKkm)
    : []
  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-20 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            {onBack ? (
              <button
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Kembali"
                onClick={onBack}
              >
                <ArrowLeft size={20} />
              </button>
            ) : null}
            <span className="grid size-11 place-items-center rounded-2xl bg-[var(--rapotku-brand)] text-white">
              <BookOpenCheck size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold">Input Nilai</p>
              <p className="truncate text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? userName}
              </p>
            </div>
          </div>
          <button
            className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
            type="button"
            aria-label="Keluar"
            onClick={() => void onLogout()}
          >
            <LogOut size={19} />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
          Kelas 1–6
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Nilai seluruh siswa
        </h1>
        <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
          Isi seluruh CP aktif. Pengetahuan dan Keterampilan dihitung terpisah.
        </p>
        {error ? (
          <div
            className="mt-4 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm"
            role="alert"
          >
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            className="mt-4 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm text-[var(--rapotku-success)]"
            role="status"
          >
            {message}
          </div>
        ) : null}
        <section className="mt-6 grid gap-4 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6 lg:grid-cols-2">
          <label className="text-sm font-bold">
            Kelas
            <select
              className={selectClass}
              value={classId}
              onChange={(event) => {
                setIsLoadingGrades(true)
                setClassId(event.target.value)
                setSubjectId("")
              }}
            >
              <option value="">Pilih kelas</option>
              {classOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · Kelas {item.grade_level}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Mata pelajaran
            <select
              className={selectClass}
              value={subjectId}
              disabled={!classId}
              onChange={(event) => {
                setIsLoadingGrades(true)
                setSubjectId(event.target.value)
              }}
            >
              <option value="">Pilih mapel</option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </section>
        {isLoading ? (
          <p className="mt-8" role="status">
            <LoaderCircle className="mr-2 inline animate-spin" />
            Menyiapkan data...
          </p>
        ) : null}
        {selectedClass && subjectId ? (
          <>
            {selectedSubject?.religion_scope &&
            userRole !== "subject_teacher" ? (
              <section className="mt-5 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
                <details>
                  <summary className="cursor-pointer text-lg font-bold">
                    Atur siswa mapel agama
                  </summary>
                  <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
                    Otomatis mengikuti agama pada biodata. Penggantian manual
                    tidak mengubah biodata dan harus dilakukan sebelum nilai
                    atau deskripsi agama diisi.
                  </p>
                  <div className="mt-4 grid gap-3">
                    {classStudents.map((student) => {
                      const existing =
                        references?.religionSubjectOverrides.find(
                          (item) =>
                            item.student_id === student.id &&
                            item.semester_id === selectedClass.semester_id,
                        )
                      const automaticScope = normalizeReligion(student.religion)
                      const automaticSubject = religionSubjects.find(
                        (subject) => subject.religion_scope === automaticScope,
                      )
                      return (
                        <label
                          className="grid gap-2 rounded-2xl border border-[var(--rapotku-border)] p-3 sm:grid-cols-[minmax(0,1fr)_minmax(220px,320px)] sm:items-center"
                          key={student.id}
                        >
                          <span className="min-w-0">
                            <strong className="block truncate">
                              {student.full_name}
                            </strong>
                            <span className="text-xs text-[var(--rapotku-muted)]">
                              Biodata: {student.religion ?? "Belum diisi"}
                            </span>
                          </span>
                          <select
                            aria-label={`Mapel agama ${student.full_name}`}
                            className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"
                            value={existing?.subject_id ?? ""}
                            disabled={savingReligionStudentId === student.id}
                            onChange={(event) =>
                              void changeReligionSubject(
                                student.id,
                                event.target.value,
                              )
                            }
                          >
                            <option value="">
                              Otomatis —{" "}
                              {automaticSubject?.name ??
                                getReligionScopeLabel(automaticScope)}
                            </option>
                            {religionSubjects.map((subject) => (
                              <option key={subject.id} value={subject.id}>
                                Manual — {subject.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      )
                    })}
                  </div>
                </details>
              </section>
            ) : null}
            <section className="mt-5 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Pengaturan KKM</h2>
                  <p className="text-sm text-[var(--rapotku-muted)]">
                    Satu KKM dipakai kedua komponen.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-[180px_110px_auto] sm:items-end">
                  <label className="text-sm font-bold">
                    Mode
                    <select
                      className={selectClass}
                      value={kkmMode}
                      disabled={userRole !== "admin"}
                      onChange={(event) => {
                        setKkmMode(event.target.value as KkmMode)
                        setKkmDraft("")
                      }}
                    >
                      <option value="single">Single KKM</option>
                      <option value="multi">Multi KKM</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold">
                    KKM
                    <input
                      className={`${scoreClass} mt-2 block`}
                      type="number"
                      min="1"
                      max="100"
                      value={kkmDraft}
                      disabled={userRole !== "admin"}
                      onChange={(event) => setKkmDraft(event.target.value)}
                    />
                  </label>
                  {userRole === "admin" ? (
                    <button
                      className="min-h-12 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white"
                      type="button"
                      disabled={isSaving || !kkmDraft}
                      onClick={() => void saveKkm()}
                    >
                      Simpan KKM
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {ranges.length ? (
                  ranges.map((range) => (
                    <span
                      className="rounded-full bg-[#f4f5f7] px-3 py-2 text-xs font-bold"
                      key={range.predicate}
                    >
                      {range.predicate}: {range.minimum}–{range.maximum}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-[var(--rapotku-muted)]">
                    KKM belum diatur.
                  </span>
                )}
              </div>
            </section>
            <nav
              className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white p-2"
              aria-label="Komponen penilaian"
            >
              {components.map((component) => (
                <button
                  key={component.id}
                  type="button"
                  className={`min-h-12 rounded-xl px-4 font-bold ${component.id === componentId ? "bg-[var(--rapotku-brand)] text-white" : "text-[var(--rapotku-muted)]"}`}
                  onClick={() => setComponentId(component.id)}
                >
                  {component.name}
                </button>
              ))}
            </nav>
            <section className="mt-5 overflow-hidden rounded-3xl border border-[var(--rapotku-border)] bg-white">
              <div className="border-b border-[var(--rapotku-border)] p-4 sm:p-6">
                <h2 className="text-lg font-bold">{activeComponent?.name}</h2>
                <p className="text-sm text-[var(--rapotku-muted)]">
                  {outcomes.length} CP aktif
                </p>
              </div>
              {isLoadingGrades ? (
                <p className="p-8 text-center">Memuat nilai...</p>
              ) : outcomes.length === 0 ? (
                <p className="p-8 text-center font-bold">Belum ada CP aktif.</p>
              ) : students.length === 0 ? (
                <p className="p-8 text-center font-bold">
                  {selectedSubject?.religion_scope
                    ? "Belum ada siswa dengan agama yang sesuai untuk mapel ini."
                    : "Belum ada siswa."}
                </p>
              ) : (
                <>
                  <div className="divide-y divide-[var(--rapotku-border)] md:hidden">
                    {students.map((student, index) => {
                      const result = summary(student.id)
                      return (
                        <article className="p-4" key={student.id}>
                          <p className="text-xs text-[var(--rapotku-muted)]">
                            {index + 1}
                          </p>
                          <h3 className="font-bold">{student.full_name}</h3>
                          <p className="text-xs text-[var(--rapotku-muted)]">
                            NIS {student.nis}
                          </p>
                          <div className="mt-4 space-y-3">
                            {outcomes.map((outcome) => (
                              <label
                                className="flex items-center justify-between gap-3 text-sm"
                                key={outcome.id}
                              >
                                <span className="min-w-0">
                                  <strong className="block truncate">
                                    {outcome.code ?? outcome.title}
                                  </strong>
                                  <span className="line-clamp-2 text-xs text-[var(--rapotku-muted)]">
                                    {outcome.description}
                                  </span>
                                </span>
                                <input
                                  aria-label={`${activeComponent?.name} ${outcome.title} ${student.full_name}`}
                                  className={scoreClass}
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                  inputMode="decimal"
                                  value={
                                    drafts[
                                      keyFor(
                                        componentId,
                                        student.id,
                                        outcome.id,
                                      )
                                    ] ?? ""
                                  }
                                  onChange={(event) =>
                                    setDrafts((current) => ({
                                      ...current,
                                      [keyFor(
                                        componentId,
                                        student.id,
                                        outcome.id,
                                      )]: event.target.value,
                                    }))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-[#f4f5f7] px-3 py-2 font-bold">
                              Rata-rata: {result.average ?? "—"}
                            </span>
                            <span className="rounded-full bg-[var(--rapotku-brand-soft)] px-3 py-2 font-bold text-[var(--rapotku-brand)]">
                              Predikat: {result.predicate ?? "—"}
                            </span>
                            <button
                              className="min-h-9 rounded-full border px-3 font-bold"
                              type="button"
                              onClick={() => openDescription(student.id)}
                            >
                              {componentDescription(student.id)
                                ? "Edit deskripsi"
                                : "Buat deskripsi"}
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-max min-w-full text-left">
                      <thead className="bg-[#f7f8fa] text-xs uppercase text-[var(--rapotku-muted)]">
                        <tr>
                          <th className="sticky left-0 z-10 min-w-64 bg-[#f7f8fa] px-5 py-4">
                            Siswa
                          </th>
                          {outcomes.map((outcome) => (
                            <th
                              className="min-w-36 px-4 py-4 text-center"
                              key={outcome.id}
                            >
                              {outcome.code ?? outcome.title}
                            </th>
                          ))}
                          <th className="px-4 py-4">Rata-rata</th>
                          <th className="px-4 py-4">Predikat</th>
                          <th className="px-4 py-4">Deskripsi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.map((student) => {
                          const result = summary(student.id)
                          return (
                            <tr key={student.id}>
                              <td className="sticky left-0 z-10 bg-white px-5 py-4">
                                <strong>{student.full_name}</strong>
                                <p className="text-xs text-[var(--rapotku-muted)]">
                                  NIS {student.nis}
                                </p>
                              </td>
                              {outcomes.map((outcome) => (
                                <td className="px-4 py-3" key={outcome.id}>
                                  <input
                                    aria-label={`${activeComponent?.name} ${outcome.title} ${student.full_name}`}
                                    className={scoreClass}
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    value={
                                      drafts[
                                        keyFor(
                                          componentId,
                                          student.id,
                                          outcome.id,
                                        )
                                      ] ?? ""
                                    }
                                    onChange={(event) =>
                                      setDrafts((current) => ({
                                        ...current,
                                        [keyFor(
                                          componentId,
                                          student.id,
                                          outcome.id,
                                        )]: event.target.value,
                                      }))
                                    }
                                  />
                                </td>
                              ))}
                              <td className="px-4 text-center font-bold">
                                {result.average ?? "—"}
                              </td>
                              <td className="px-4 text-center font-bold text-[var(--rapotku-brand)]">
                                {result.predicate ?? "—"}
                              </td>
                              <td className="px-4">
                                <button
                                  className="min-h-10 rounded-xl border px-3 font-bold"
                                  type="button"
                                  onClick={() => openDescription(student.id)}
                                >
                                  {componentDescription(student.id)
                                    ? "Edit"
                                    : "Buat"}
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="sticky bottom-0 border-t bg-white/95 p-4 sm:flex sm:items-center sm:justify-between">
                    <p className="mb-3 text-sm text-[var(--rapotku-muted)] sm:mb-0">
                      {students.length} siswa · {outcomes.length} CP
                    </p>
                    <button
                      className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white sm:w-auto"
                      type="button"
                      disabled={isSaving}
                      onClick={() => void saveScores()}
                    >
                      {isSaving ? (
                        <LoaderCircle className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
                      {isSaving
                        ? "Menyimpan..."
                        : `Simpan ${activeComponent?.name}`}
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        ) : null}
      </main>
      {editingStudentId ? (
        <div className="fixed inset-0 z-50 grid items-end bg-[#1d222b]/45 sm:place-items-center sm:p-4">
          <section
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 sm:max-w-2xl sm:rounded-3xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="description-title"
          >
            <div className="flex justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
                  Draft otomatis · {activeComponent?.name}
                </p>
                <h2 id="description-title" className="text-xl font-bold">
                  Deskripsi{" "}
                  {
                    students.find((item) => item.id === editingStudentId)
                      ?.full_name
                  }
                </h2>
              </div>
              <button
                className="grid size-11 place-items-center rounded-xl border"
                type="button"
                aria-label="Tutup deskripsi"
                onClick={() => setEditingStudentId(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-[#f7f8fa] p-4">
              <p className="text-xs font-bold uppercase">Hasil sistem</p>
              <p className="mt-2 text-sm leading-6">{generatedDraft}</p>
            </div>
            <label className="mt-5 block text-sm font-bold">
              Deskripsi final
              <textarea
                className="mt-2 min-h-36 w-full rounded-2xl border p-4"
                maxLength={2000}
                value={finalDraft}
                onChange={(event) => setFinalDraft(event.target.value)}
              />
            </label>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl border px-4 font-bold"
                type="button"
                onClick={() => generate(editingStudentId, true)}
              >
                <Sparkles size={18} />
                Buat ulang draft
              </button>
              <button
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
                type="button"
                disabled={isSaving || !finalDraft.trim()}
                onClick={() => void saveDescription()}
              >
                <Save size={18} />
                Simpan deskripsi
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
