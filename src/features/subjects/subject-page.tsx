import { useEffect, useMemo, useState, type FormEvent } from "react"
import {
  AlertCircle,
  ArrowDownUp,
  ArrowLeft,
  BookOpen,
  BookOpenCheck,
  CheckCircle2,
  LoaderCircle,
  LogOut,
  MapPin,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
  X,
} from "lucide-react"

import {
  createSubject,
  getReligionScopeLabel,
  getSubjects,
  RELIGION_SCOPE_OPTIONS,
  setSubjectActive,
  updateSubject,
  type Subject,
  type SubjectInput,
} from "@/features/subjects/subject.service"

type SubjectPageProps = Readonly<{
  userId: string
  userName: string
  schoolName?: string
  onBack: () => void
  onLogout: () => Promise<void>
}>

const emptyForm: SubjectInput = {
  name: "",
  code: "",
  religionScope: null,
  isLocalContent: false,
  displayOrder: 1,
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 text-[var(--rapotku-text)] outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"

function formFromSubject(subject: Subject): SubjectInput {
  return {
    name: subject.name,
    code: subject.code ?? "",
    religionScope: subject.religion_scope as SubjectInput["religionScope"],
    isLocalContent: subject.is_local_content,
    displayOrder: subject.display_order,
  }
}

function sortSubjects(subjects: ReadonlyArray<Subject>) {
  return [...subjects].sort(
    (left, right) =>
      left.display_order - right.display_order ||
      left.name.localeCompare(right.name, "id"),
  )
}

export function SubjectPage({
  userId,
  userName,
  schoolName,
  onBack,
  onLogout,
}: SubjectPageProps) {
  const [subjects, setSubjects] = useState<ReadonlyArray<Subject>>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("active")
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [form, setForm] = useState<SubjectInput>(emptyForm)
  const [formError, setFormError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [statusTarget, setStatusTarget] = useState<Subject | null>(null)
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [logoutError, setLogoutError] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    let isMounted = true

    void getSubjects()
      .then((loadedSubjects) => {
        if (isMounted) {
          setSubjects(loadedSubjects)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(
            "Mata pelajaran belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
          )
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [loadAttempt])

  const filteredSubjects = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return subjects.filter((subject) => {
      const matchesSearch =
        !query ||
        subject.name.toLowerCase().includes(query) ||
        (subject.code ?? "").toLowerCase().includes(query)
      const matchesType =
        typeFilter === "all" ||
        (typeFilter === "local"
          ? subject.is_local_content
          : !subject.is_local_content)
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? subject.is_active : !subject.is_active)

      return matchesSearch && matchesType && matchesStatus
    })
  }, [searchTerm, statusFilter, subjects, typeFilter])

  function nextDisplayOrder() {
    const highest = subjects.reduce(
      (current, subject) => Math.max(current, subject.display_order),
      0,
    )
    return Math.min(highest + 1, 999)
  }

  function openCreateForm() {
    setEditingSubject(null)
    setForm({ ...emptyForm, displayOrder: nextDisplayOrder() })
    setFormError("")
    setIsFormOpen(true)
  }

  function openEditForm(subject: Subject) {
    setEditingSubject(subject)
    setForm(formFromSubject(subject))
    setFormError("")
    setIsFormOpen(true)
  }

  function closeForm() {
    if (!isSaving) setIsFormOpen(false)
  }

  function retryLoad() {
    setIsLoading(true)
    setLoadError("")
    setLoadAttempt((current) => current + 1)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError("")
    setSuccessMessage("")
    setIsSaving(true)

    try {
      const savedSubject = editingSubject
        ? await updateSubject(userId, editingSubject.id, form)
        : await createSubject(userId, form)

      setSubjects((current) =>
        sortSubjects(
          editingSubject
            ? current.map((subject) =>
                subject.id === savedSubject.id ? savedSubject : subject,
              )
            : [...current, savedSubject],
        ),
      )
      setSuccessMessage(
        editingSubject
          ? "Mata pelajaran berhasil diperbarui."
          : "Mata pelajaran berhasil ditambahkan.",
      )
      setIsFormOpen(false)
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Mata pelajaran belum dapat disimpan. Coba lagi.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(subject: Subject) {
    setIsChangingStatus(true)
    setLoadError("")
    setSuccessMessage("")

    try {
      const savedSubject = await setSubjectActive(
        userId,
        subject.id,
        !subject.is_active,
      )
      setSubjects((current) =>
        current.map((item) =>
          item.id === savedSubject.id ? savedSubject : item,
        ),
      )
      setSuccessMessage(
        savedSubject.is_active
          ? "Mata pelajaran berhasil diaktifkan kembali."
          : "Mata pelajaran berhasil dinonaktifkan.",
      )
      setStatusTarget(null)
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "Status mata pelajaran belum dapat diubah. Coba lagi.",
      )
    } finally {
      setIsChangingStatus(false)
    }
  }

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

  const activeCount = subjects.filter((subject) => subject.is_active).length
  const localContentCount = subjects.filter(
    (subject) => subject.is_active && subject.is_local_content,
  ).length

  return (
    <div className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)]">
      <header className="sticky top-0 z-30 border-b border-[var(--rapotku-border)] bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)] bg-white transition hover:bg-[var(--rapotku-canvas)]"
            type="button"
            aria-label="Kembali ke Dashboard"
            onClick={onBack}
          >
            <ArrowLeft aria-hidden="true" size={20} />
          </button>
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand)] text-white">
            <BookOpenCheck aria-hidden="true" size={21} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold leading-tight">RaporKu</p>
            <p className="truncate text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Admin Sekolah"}
            </p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-bold">{userName}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Admin</p>
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--rapotku-border)] bg-white px-3 text-sm font-semibold disabled:opacity-60"
            type="button"
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
          >
            <LogOut aria-hidden="true" size={18} />
            <span className="hidden sm:inline">
              {isLoggingOut ? "Keluar..." : "Keluar"}
            </span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[var(--rapotku-brand)]">
              Data Master
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Mata Pelajaran
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--rapotku-muted)] sm:text-base">
              Susun daftar mata pelajaran sekolah tanpa daftar bawaan yang
              dipaksakan sistem.
            </p>
          </div>
          <button
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white shadow-[0_8px_18px_rgba(201,29,36,0.2)] transition hover:bg-[var(--rapotku-brand-strong)]"
            type="button"
            onClick={openCreateForm}
          >
            <Plus aria-hidden="true" size={20} />
            Tambah Mata Pelajaran
          </button>
        </section>

        {logoutError || loadError ? (
          <div
            className="mt-5 flex items-start gap-3 rounded-2xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 shrink-0"
              size={19}
            />
            <div className="flex-1">
              <p>{logoutError || loadError}</p>
              {loadError ? (
                <button
                  className="mt-2 font-bold underline"
                  type="button"
                  onClick={retryLoad}
                >
                  Coba lagi
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {successMessage ? (
          <div
            className="mt-5 flex items-center gap-3 rounded-2xl border border-[#b9e3ce] bg-[#ecf8f2] p-4 text-sm font-semibold text-[var(--rapotku-success)]"
            role="status"
          >
            <CheckCircle2 aria-hidden="true" size={19} />
            {successMessage}
          </div>
        ) : null}

        <section
          aria-label="Ringkasan mata pelajaran"
          className="mt-6 grid grid-cols-3 gap-3"
        >
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <BookOpen aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{subjects.length}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Total</p>
          </article>
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[#ecf8f2] text-[var(--rapotku-success)]">
              <CheckCircle2 aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{activeCount}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Aktif</p>
          </article>
          <article className="rounded-2xl border border-[var(--rapotku-border)] bg-white p-4">
            <span className="grid size-10 place-items-center rounded-xl bg-[#fff7e8] text-[#9a5a00]">
              <MapPin aria-hidden="true" size={20} />
            </span>
            <p className="mt-3 text-2xl font-bold">{localContentCount}</p>
            <p className="text-xs text-[var(--rapotku-muted)]">Muatan lokal</p>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-[var(--rapotku-border)] bg-white p-4 shadow-[0_8px_28px_rgba(24,31,45,0.04)] sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_210px_180px]">
            <label className="relative block">
              <span className="sr-only">Cari mata pelajaran</span>
              <Search
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rapotku-muted)]"
                size={19}
              />
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white pl-12 pr-4 outline-none focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                aria-label="Cari mata pelajaran"
                placeholder="Cari nama atau kode"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>
            <label>
              <span className="sr-only">Filter jenis mata pelajaran</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)]"
                aria-label="Filter jenis mata pelajaran"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              >
                <option value="all">Semua jenis</option>
                <option value="regular">Mata pelajaran umum</option>
                <option value="local">Muatan lokal</option>
              </select>
            </label>
            <label>
              <span className="sr-only">Filter status mata pelajaran</span>
              <select
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none focus:border-[var(--rapotku-brand)]"
                aria-label="Filter status mata pelajaran"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="active">Aktif</option>
                <option value="inactive">Tidak aktif</option>
                <option value="all">Semua status</option>
              </select>
            </label>
          </div>

          <p className="mt-4 text-right text-xs text-[var(--rapotku-muted)]">
            {filteredSubjects.length} mata pelajaran ditampilkan
          </p>

          {isLoading ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <div className="text-center">
                <LoaderCircle
                  aria-hidden="true"
                  className="mx-auto animate-spin text-[var(--rapotku-brand)]"
                  size={30}
                />
                <p className="mt-3 text-sm text-[var(--rapotku-muted)]">
                  Memuat mata pelajaran...
                </p>
              </div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="grid min-h-72 place-items-center py-8 text-center">
              <div>
                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                  <BookOpen aria-hidden="true" size={26} />
                </span>
                <h2 className="mt-4 text-lg font-bold">
                  Belum ada mata pelajaran
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[var(--rapotku-muted)]">
                  Tambahkan mata pelajaran yang benar-benar digunakan sekolah.
                  Tidak ada daftar yang dibuat otomatis.
                </p>
                <button
                  className="mt-5 min-h-11 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white"
                  type="button"
                  onClick={openCreateForm}
                >
                  Tambah Mata Pelajaran
                </button>
              </div>
            </div>
          ) : filteredSubjects.length === 0 ? (
            <div className="grid min-h-56 place-items-center py-8 text-center">
              <div>
                <Search
                  aria-hidden="true"
                  className="mx-auto text-[#98a2b3]"
                  size={30}
                />
                <h2 className="mt-3 font-bold">
                  Mata pelajaran tidak ditemukan
                </h2>
                <p className="mt-2 text-sm text-[var(--rapotku-muted)]">
                  Coba ubah kata pencarian atau filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--rapotku-border)]">
              <div className="hidden grid-cols-[80px_minmax(220px,1fr)_180px_140px_160px] gap-4 bg-[#f8f9fb] px-5 py-3 text-xs font-bold uppercase tracking-wide text-[var(--rapotku-muted)] md:grid">
                <span>Urutan</span>
                <span>Mata pelajaran</span>
                <span>Jenis</span>
                <span>Status</span>
                <span>Aksi</span>
              </div>
              <ul className="divide-y divide-[var(--rapotku-border)]">
                {filteredSubjects.map((subject) => (
                  <li
                    className="grid gap-4 p-4 md:grid-cols-[80px_minmax(220px,1fr)_180px_140px_160px] md:items-center md:px-5"
                    key={subject.id}
                  >
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--rapotku-muted)]">
                      <ArrowDownUp aria-hidden="true" size={16} />
                      {subject.display_order}
                    </div>
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
                        <BookOpen aria-hidden="true" size={20} />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold">{subject.name}</p>
                        <p className="mt-1 text-xs text-[var(--rapotku-muted)]">
                          Kode: {subject.code ?? "Belum diisi"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[var(--rapotku-brand)]">
                          Siswa: {getReligionScopeLabel(subject.religion_scope)}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-[var(--rapotku-muted)] md:hidden">
                        Jenis
                      </p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                          subject.is_local_content
                            ? "bg-[#fff7e8] text-[#9a5a00]"
                            : "bg-[#eef6ff] text-[#245da8]"
                        }`}
                      >
                        {subject.is_local_content
                          ? "Muatan lokal"
                          : "Mata pelajaran umum"}
                      </span>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-[var(--rapotku-muted)] md:hidden">
                        Status
                      </p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1.5 text-xs font-bold ${
                          subject.is_active
                            ? "bg-[#ecf8f2] text-[var(--rapotku-success)]"
                            : "bg-[#f0f1f3] text-[#667085]"
                        }`}
                      >
                        {subject.is_active ? "Aktif" : "Tidak aktif"}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--rapotku-border)] px-3 text-sm font-semibold"
                        type="button"
                        onClick={() => openEditForm(subject)}
                      >
                        <Pencil aria-hidden="true" size={17} />
                        Edit
                      </button>
                      <button
                        className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                        type="button"
                        aria-label={
                          subject.is_active
                            ? `Nonaktifkan ${subject.name}`
                            : `Aktifkan ${subject.name}`
                        }
                        onClick={() =>
                          subject.is_active
                            ? setStatusTarget(subject)
                            : void handleStatusChange(subject)
                        }
                      >
                        <ToggleLeft aria-hidden="true" size={19} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 rounded-xl bg-[#f7f8fa] px-4 py-3 text-sm leading-6 text-[var(--rapotku-muted)]">
            Penugasan mata pelajaran ke kelas dan guru dibuat pada tahap
            penugasan berikutnya.
          </p>
        </section>
      </main>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 grid items-end bg-[#1d222b]/50 sm:items-center sm:p-5">
          <button
            className="absolute inset-0"
            type="button"
            aria-label="Tutup formulir"
            onClick={closeForm}
          />
          <section
            className="relative mx-auto w-full max-w-xl overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-form-title"
          >
            <div className="flex items-center justify-between border-b border-[var(--rapotku-border)] px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--rapotku-brand)]">
                  Data Master
                </p>
                <h2 className="mt-1 text-xl font-bold" id="subject-form-title">
                  {editingSubject
                    ? "Edit Mata Pelajaran"
                    : "Tambah Mata Pelajaran"}
                </h2>
              </div>
              <button
                className="grid size-11 place-items-center rounded-xl border border-[var(--rapotku-border)]"
                type="button"
                aria-label="Tutup"
                onClick={closeForm}
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <form onSubmit={(event) => void handleSubmit(event)}>
              <div className="space-y-4 p-5 sm:p-6">
                {formError ? (
                  <div
                    className="flex gap-3 rounded-xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm text-[var(--rapotku-brand-strong)]"
                    role="alert"
                  >
                    <AlertCircle
                      aria-hidden="true"
                      className="shrink-0"
                      size={19}
                    />
                    <p>{formError}</p>
                  </div>
                ) : null}
                <label>
                  <span className="text-sm font-semibold">
                    Nama Mata Pelajaran{" "}
                    <span className="text-[var(--rapotku-brand)]">*</span>
                  </span>
                  <input
                    className={inputClassName}
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    maxLength={120}
                    autoFocus
                    placeholder="Isi sesuai yang digunakan sekolah"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-semibold">
                      Kode{" "}
                      <span className="font-normal text-[var(--rapotku-muted)]">
                        (opsional)
                      </span>
                    </span>
                    <input
                      className={inputClassName}
                      value={form.code}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          code: event.target.value,
                        }))
                      }
                      maxLength={30}
                      placeholder="Contoh: MTK"
                    />
                  </label>
                  <label>
                    <span className="text-sm font-semibold">
                      Urutan Tampil{" "}
                      <span className="text-[var(--rapotku-brand)]">*</span>
                    </span>
                    <input
                      className={inputClassName}
                      type="number"
                      min={1}
                      max={999}
                      value={form.displayOrder}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          displayOrder: Number(event.target.value),
                        }))
                      }
                      required
                    />
                  </label>
                </div>
                <label>
                  <span className="text-sm font-semibold">
                    Kelompok Agama Siswa
                  </span>
                  <select
                    className={inputClassName}
                    value={form.religionScope ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        religionScope:
                          (event.target
                            .value as SubjectInput["religionScope"]) || null,
                      }))
                    }
                  >
                    <option value="">Semua siswa (bukan mapel agama)</option>
                    {RELIGION_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="mt-2 block text-xs leading-5 text-[var(--rapotku-muted)]">
                    Untuk mapel agama, siswa akan masuk otomatis sesuai agama
                    pada biodatanya.
                  </span>
                </label>
                <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[var(--rapotku-border)] p-4">
                  <input
                    className="size-5 accent-[var(--rapotku-brand)]"
                    type="checkbox"
                    checked={form.isLocalContent}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isLocalContent: event.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-sm font-bold">
                      Ini mata pelajaran muatan lokal
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--rapotku-muted)]">
                      Aktifkan untuk pelajaran khusus daerah atau sekolah.
                    </span>
                  </span>
                </label>
              </div>
              <div className="flex gap-3 border-t border-[var(--rapotku-border)] bg-white px-5 py-4 sm:justify-end sm:px-6">
                <button
                  className="min-h-12 flex-1 rounded-xl border border-[var(--rapotku-border)] px-5 font-bold sm:flex-none"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Batal
                </button>
                <button
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-5 font-bold text-white disabled:opacity-60 sm:flex-none"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <LoaderCircle
                      aria-hidden="true"
                      className="animate-spin"
                      size={19}
                    />
                  ) : null}
                  {isSaving ? "Menyimpan..." : "Simpan Mata Pelajaran"}
                </button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {statusTarget ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-[#1d222b]/50 p-4">
          <section
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="deactivate-subject-title"
          >
            <span className="grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
              <ToggleLeft aria-hidden="true" size={23} />
            </span>
            <h2
              className="mt-4 text-xl font-bold"
              id="deactivate-subject-title"
            >
              Nonaktifkan mata pelajaran?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--rapotku-muted)]">
              <strong>{statusTarget.name}</strong> tidak akan muncul pada daftar
              aktif. Data tetap tersimpan dan dapat diaktifkan kembali.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                className="min-h-12 flex-1 rounded-xl border border-[var(--rapotku-border)] font-bold"
                type="button"
                onClick={() => setStatusTarget(null)}
                disabled={isChangingStatus}
              >
                Batal
              </button>
              <button
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--rapotku-brand)] px-4 font-bold text-white disabled:opacity-60"
                type="button"
                onClick={() => void handleStatusChange(statusTarget)}
                disabled={isChangingStatus}
              >
                {isChangingStatus ? (
                  <LoaderCircle
                    aria-hidden="true"
                    className="animate-spin"
                    size={18}
                  />
                ) : null}
                Nonaktifkan
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
