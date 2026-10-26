import { useEffect, useMemo, useState } from "react"
import { LoaderCircle, Plus, Save } from "lucide-react"

import {
  createAssessmentItem,
  getAssessmentData,
  saveAssessmentScores,
  type AssessmentCategory,
  type AssessmentItem,
  type AssessmentKind,
  type AssessmentScore,
  type AssessmentScope,
} from "./assessment.service"
import { parseScoreInput } from "./grade.service"

type Props = Readonly<{
  userId: string
  scope: AssessmentScope
  componentName: string
  outcomes: ReadonlyArray<{
    id: string
    code: string | null
    title: string
    description: string
  }>
  students: ReadonlyArray<{
    id: string
    full_name: string
    nis: string
  }>
  onModeChange: (enabled: boolean) => void
  onDerivedGradesChanged: () => Promise<void>
}>

const fieldClass =
  "min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm focus:border-[var(--rapotku-brand)] focus:outline-none"
const scoreClass =
  "min-h-12 w-24 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-center text-base font-bold focus:border-[var(--rapotku-brand)] focus:outline-none"

const kindLabels: Record<AssessmentKind, string> = {
  daily: "Nilai Harian",
  exercise: "Latihan",
  assignment: "Tugas",
  other: "Formatif Lainnya",
  midterm: "Penilaian Tengah Semester (PTS)",
  final: "Penilaian Akhir Semester (PAS)",
}

const formativeKinds: ReadonlyArray<AssessmentKind> = [
  "daily",
  "exercise",
  "assignment",
  "other",
]
const summativeKinds: ReadonlyArray<AssessmentKind> = ["midterm", "final"]

export function AssessmentEntryPanel({
  userId,
  scope,
  componentName,
  outcomes,
  students,
  onModeChange,
  onDerivedGradesChanged,
}: Props) {
  const [items, setItems] = useState<ReadonlyArray<AssessmentItem>>([])
  const [scores, setScores] = useState<ReadonlyArray<AssessmentScore>>([])
  const [selectedItemId, setSelectedItemId] = useState("")
  const [category, setCategory] = useState<AssessmentCategory>("formative")
  const [kind, setKind] = useState<AssessmentKind>("daily")
  const [outcomeId, setOutcomeId] = useState("")
  const [title, setTitle] = useState("")
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const selectedItem = items.find((item) => item.id === selectedItemId)
  const selectedOutcome = outcomes.find(
    (outcome) => outcome.id === selectedItem?.learning_outcome_id,
  )
  const formativeCount = items.filter(
    (item) => item.category === "formative",
  ).length
  const summativeKindsPresent = new Set(
    items
      .filter((item) => item.category === "summative")
      .map((item) => item.kind),
  )

  async function load(preferredItemId?: string) {
    setIsLoading(true)
    try {
      const data = await getAssessmentData(scope)
      setItems(data.items)
      setScores(data.scores)
      onModeChange(data.items.length > 0)
      setSelectedItemId((current) => {
        const preferred = preferredItemId ?? current
        return data.items.some((item) => item.id === preferred)
          ? preferred
          : (data.items[0]?.id ?? "")
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data belum dimuat.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setOutcomeId(outcomes[0]?.id ?? "")
    setSelectedItemId("")
    setError("")
    setMessage("")
    void load()
    // Scope primitives are the intended reload boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    scope.classId,
    scope.subjectId,
    scope.semesterId,
    scope.assessmentComponentId,
  ])

  useEffect(() => {
    const next: Record<string, string> = {}
    scores
      .filter((score) => score.assessment_item_id === selectedItemId)
      .forEach((score) => {
        next[score.student_id] = score.score.toString()
      })
    setDrafts(next)
  }, [scores, selectedItemId])

  const availableKinds = useMemo(
    () => (category === "formative" ? formativeKinds : summativeKinds),
    [category],
  )

  async function createItem() {
    if (!outcomeId) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      const saved = await createAssessmentItem(userId, scope, {
        learningOutcomeId: outcomeId,
        category,
        kind,
        title: category === "summative" ? kindLabels[kind] : title,
      })
      setTitle("")
      await load(saved.id)
      setMessage("Penilaian berhasil dibuat. Silakan isi nilai seluruh siswa.")
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Penilaian belum dibuat.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function saveScores() {
    if (!selectedItem) return
    setIsSaving(true)
    setError("")
    setMessage("")
    try {
      await saveAssessmentScores(
        selectedItem.id,
        students.map((student) => ({
          studentId: student.id,
          score: parseScoreInput(drafts[student.id] ?? ""),
        })),
      )
      await load(selectedItem.id)
      await onDerivedGradesChanged()
      setMessage(
        "Nilai tersimpan. Nilai akhir diperbarui otomatis saat Formatif, PTS, dan PAS lengkap.",
      )
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Nilai belum tersimpan.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="mt-5 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 sm:p-6">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
            Penilaian {componentName}
          </p>
          <h2 className="text-xl font-bold">Formatif 40% · Sumatif 60%</h2>
          <p className="mt-1 max-w-3xl text-sm text-[var(--rapotku-muted)]">
            Formatif dapat berisi nilai harian, latihan, tugas, dan lainnya.
            Sumatif wajib memiliki PTS dan PAS dengan bobot sama.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <span className="rounded-full bg-[#eef5ff] px-3 py-2">
            {formativeCount} Formatif
          </span>
          <span className="rounded-full bg-[#fff4e8] px-3 py-2">
            PTS {summativeKindsPresent.has("midterm") ? "✓" : "—"}
          </span>
          <span className="rounded-full bg-[#fff4e8] px-3 py-2">
            PAS {summativeKindsPresent.has("final") ? "✓" : "—"}
          </span>
        </div>
      </div>

      {error ? (
        <p
          className="mt-4 rounded-2xl bg-[var(--rapotku-brand-soft)] p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          className="mt-4 rounded-2xl bg-[#ecf8f2] p-3 text-sm text-[var(--rapotku-success)]"
          role="status"
        >
          {message}
        </p>
      ) : null}

      <details className="mt-5 rounded-2xl border border-[var(--rapotku-border)] p-4">
        <summary className="cursor-pointer font-bold">Tambah penilaian</summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-bold">
            Kelompok
            <select
              className={`${fieldClass} mt-2`}
              value={category}
              onChange={(event) => {
                const next = event.target.value as AssessmentCategory
                setCategory(next)
                setKind(next === "formative" ? "daily" : "midterm")
              }}
            >
              <option value="formative">Formatif</option>
              <option value="summative">Sumatif</option>
            </select>
          </label>
          <label className="text-sm font-bold">
            Jenis
            <select
              className={`${fieldClass} mt-2`}
              value={kind}
              onChange={(event) =>
                setKind(event.target.value as AssessmentKind)
              }
            >
              {availableKinds.map((itemKind) => (
                <option key={itemKind} value={itemKind}>
                  {kindLabels[itemKind]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            CP
            <select
              className={`${fieldClass} mt-2`}
              value={outcomeId}
              onChange={(event) => setOutcomeId(event.target.value)}
            >
              {outcomes.map((outcome) => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.code ?? outcome.title}
                </option>
              ))}
            </select>
          </label>
          {category === "formative" ? (
            <label className="text-sm font-bold">
              Nama penilaian
              <input
                className={`${fieldClass} mt-2`}
                maxLength={100}
                placeholder="Contoh: Latihan Pecahan 1"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
          ) : (
            <div className="self-end text-sm text-[var(--rapotku-muted)]">
              Nama PTS/PAS dibuat otomatis.
            </div>
          )}
        </div>
        <button
          className="mt-4 flex min-h-12 items-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-50"
          type="button"
          disabled={
            isSaving ||
            !outcomeId ||
            (category === "formative" && !title.trim())
          }
          onClick={() => void createItem()}
        >
          <Plus size={18} /> Buat penilaian
        </button>
      </details>

      {isLoading ? (
        <p className="mt-5" role="status">
          <LoaderCircle className="mr-2 inline animate-spin" size={18} />
          Memuat penilaian...
        </p>
      ) : items.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-[#f7f8fa] p-5 text-center font-bold">
          Belum ada penilaian. Tambahkan Formatif, PTS, atau PAS.
        </p>
      ) : (
        <div className="mt-5">
          <label className="text-sm font-bold">
            Penilaian yang diisi
            <select
              className={`${fieldClass} mt-2`}
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
            >
              {items.map((item) => {
                const outcome = outcomes.find(
                  (candidate) => candidate.id === item.learning_outcome_id,
                )
                return (
                  <option key={item.id} value={item.id}>
                    {item.category === "formative" ? "Formatif" : "Sumatif"} ·{" "}
                    {item.title} · {outcome?.code ?? outcome?.title}
                  </option>
                )
              })}
            </select>
          </label>
          {selectedItem ? (
            <>
              <p className="mt-3 text-sm text-[var(--rapotku-muted)]">
                CP: {selectedOutcome?.description ?? "—"}
              </p>
              <div className="mt-4 divide-y divide-[var(--rapotku-border)] rounded-2xl border border-[var(--rapotku-border)]">
                {students.map((student) => (
                  <label
                    className="flex items-center justify-between gap-3 p-3 sm:px-4"
                    key={student.id}
                  >
                    <span className="min-w-0">
                      <strong className="block truncate">
                        {student.full_name}
                      </strong>
                      <span className="text-xs text-[var(--rapotku-muted)]">
                        NIS {student.nis}
                      </span>
                    </span>
                    <input
                      aria-label={`${selectedItem.title} ${student.full_name}`}
                      className={scoreClass}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      inputMode="decimal"
                      value={drafts[student.id] ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [student.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white sm:w-auto"
                type="button"
                disabled={isSaving}
                onClick={() => void saveScores()}
              >
                {isSaving ? (
                  <LoaderCircle className="animate-spin" size={18} />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? "Menyimpan..." : "Simpan nilai penilaian"}
              </button>
            </>
          ) : null}
        </div>
      )}
    </section>
  )
}
