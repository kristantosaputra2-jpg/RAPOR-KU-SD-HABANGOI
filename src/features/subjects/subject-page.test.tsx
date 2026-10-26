import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { SubjectPage } from "@/features/subjects/subject-page"

const subjectMocks = vi.hoisted(() => ({
  getSubjects: vi.fn(),
  createSubject: vi.fn(),
  updateSubject: vi.fn(),
  setSubjectActive: vi.fn(),
}))

vi.mock("@/features/subjects/subject.service", async (importOriginal) => {
  const original =
    await importOriginal<typeof import("@/features/subjects/subject.service")>()
  return { ...original, ...subjectMocks }
})

const subject = {
  id: "subject-1",
  name: "Bahasa Daerah",
  code: "MULOK-01",
  religion_scope: null,
  is_local_content: true,
  display_order: 8,
  is_active: true,
  created_at: "2026-09-03T00:00:00.000Z",
  updated_at: "2026-09-03T00:00:00.000Z",
}

function renderPage() {
  return render(
    <SubjectPage
      userId="admin-1"
      userName="Admin Sekolah"
      schoolName="SD Negeri Tumbang Kawei"
      onBack={vi.fn()}
      onLogout={vi.fn()}
    />,
  )
}

describe("SubjectPage", () => {
  beforeEach(() => {
    Object.values(subjectMocks).forEach((mock) => mock.mockReset())
    subjectMocks.getSubjects.mockResolvedValue([])
  })

  it("menampilkan empty state tanpa membuat daftar mapel otomatis", async () => {
    renderPage()

    expect(await screen.findByText("Belum ada mata pelajaran")).toBeVisible()
    expect(screen.getByLabelText("Cari mata pelajaran")).toBeVisible()
    expect(screen.getByLabelText("Filter jenis mata pelajaran")).toBeVisible()
  })

  it("menyediakan form mata pelajaran dan muatan lokal", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(
      (
        await screen.findAllByRole("button", {
          name: "Tambah Mata Pelajaran",
        })
      )[0],
    )

    expect(screen.getByLabelText(/Nama Mata Pelajaran/)).toBeVisible()
    expect(screen.getByLabelText(/Kode/)).toBeVisible()
    expect(screen.getByLabelText(/Urutan Tampil/)).toBeVisible()
    expect(screen.getByLabelText(/Kelompok Agama Siswa/)).toBeVisible()
    expect(
      screen.getByLabelText(/Ini mata pelajaran muatan lokal/),
    ).toBeVisible()
  })

  it("menambah muatan lokal dengan urutan tampil", async () => {
    const user = userEvent.setup()
    subjectMocks.createSubject.mockResolvedValue(subject)
    renderPage()

    await user.click(
      (
        await screen.findAllByRole("button", {
          name: "Tambah Mata Pelajaran",
        })
      )[0],
    )
    await user.type(
      screen.getByLabelText(/Nama Mata Pelajaran/),
      "Bahasa Daerah",
    )
    await user.type(screen.getByLabelText(/Kode/), "MULOK-01")
    await user.clear(screen.getByLabelText(/Urutan Tampil/))
    await user.type(screen.getByLabelText(/Urutan Tampil/), "8")
    await user.click(screen.getByLabelText(/Ini mata pelajaran muatan lokal/))
    await user.click(
      screen.getByRole("button", { name: "Simpan Mata Pelajaran" }),
    )

    await waitFor(() => {
      expect(subjectMocks.createSubject).toHaveBeenCalledWith("admin-1", {
        name: "Bahasa Daerah",
        code: "MULOK-01",
        religionScope: null,
        isLocalContent: true,
        displayOrder: 8,
      })
    })
    expect(
      await screen.findByText("Mata pelajaran berhasil ditambahkan."),
    ).toBeVisible()
  })

  it("menampilkan jenis, kode, dan status mapel", async () => {
    subjectMocks.getSubjects.mockResolvedValue([subject])
    renderPage()

    expect(await screen.findByText("Bahasa Daerah")).toBeVisible()
    expect(screen.getByText("Kode: MULOK-01")).toBeVisible()
    expect(screen.getAllByText("Muatan lokal").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Aktif").length).toBeGreaterThan(0)
  })
})
