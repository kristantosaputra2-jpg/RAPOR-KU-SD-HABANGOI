import { describe, expect, it, vi } from "vitest"

import {
  createSubject,
  getSubjects,
  normalizeReligion,
  normalizeSubjectInput,
  subjectMatchesStudentReligion,
  updateSubject,
  type SubjectInput,
} from "@/features/subjects/subject.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

const input: SubjectInput = {
  name: "  Bahasa Daerah  ",
  code: " MULOK-01 ",
  religionScope: null,
  isLocalContent: true,
  displayOrder: 8,
}

const savedSubject = {
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

describe("subject service", () => {
  it("menormalkan mata pelajaran configurable", () => {
    expect(normalizeSubjectInput(input)).toEqual({
      name: "Bahasa Daerah",
      code: "MULOK-01",
      religion_scope: null,
      is_local_content: true,
      display_order: 8,
    })
  })

  it("mengizinkan kode kosong", () => {
    expect(normalizeSubjectInput({ ...input, code: "" }).code).toBeNull()
  })

  it("mencocokkan variasi nama agama dengan kelompok mapel", () => {
    expect(normalizeReligion("Kristen Protestan")).toBe("christian")
    expect(normalizeReligion("Khonghucu")).toBe("confucian")
    expect(normalizeReligion("Penghayat Kepercayaan")).toBe("belief")
    expect(
      subjectMatchesStudentReligion(
        { id: "catholic", religion_scope: "catholic" },
        "Katolik",
      ),
    ).toBe(true)
    expect(
      subjectMatchesStudentReligion(
        { id: "islam", religion_scope: "islam" },
        "Hindu",
      ),
    ).toBe(false)
    expect(
      subjectMatchesStudentReligion(
        { id: "general", religion_scope: null },
        "Hindu",
      ),
    ).toBe(true)
    expect(
      subjectMatchesStudentReligion(
        { id: "christian", religion_scope: "christian" },
        "Katolik",
        "christian",
      ),
    ).toBe(true)
    expect(
      subjectMatchesStudentReligion(
        { id: "catholic", religion_scope: "catholic" },
        "Katolik",
        "christian",
      ),
    ).toBe(false)
  })

  it("menolak urutan di luar batas", () => {
    expect(() => normalizeSubjectInput({ ...input, displayOrder: 0 })).toThrow(
      "Urutan tampil harus berupa angka 1 sampai 999.",
    )
  })

  it("memuat mapel sesuai urutan tanpa select semua kolom", async () => {
    const finalOrder = vi.fn().mockResolvedValue({
      data: [savedSubject],
      error: null,
    })
    const firstOrder = vi.fn().mockReturnValue({ order: finalOrder })
    const select = vi.fn().mockReturnValue({ order: firstOrder })
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as RapotKuSupabaseClient

    await expect(getSubjects(client)).resolves.toEqual([savedSubject])
    expect(firstOrder).toHaveBeenCalledWith("display_order", {
      ascending: true,
    })
    expect(finalOrder).toHaveBeenCalledWith("name", { ascending: true })
  })

  it("menambah mata pelajaran dengan jejak Admin", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: savedSubject, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await createSubject("admin-1", input, client)

    expect(insert).toHaveBeenCalledWith({
      name: "Bahasa Daerah",
      code: "MULOK-01",
      religion_scope: null,
      is_local_content: true,
      display_order: 8,
      created_by: "admin-1",
      updated_by: "admin-1",
    })
  })

  it("memperbarui mapel tanpa mengubah audit pembuat", async () => {
    const single = vi
      .fn()
      .mockResolvedValue({ data: savedSubject, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as RapotKuSupabaseClient

    await updateSubject("admin-1", "subject-1", input, client)

    expect(update).toHaveBeenCalledWith({
      name: "Bahasa Daerah",
      code: "MULOK-01",
      religion_scope: null,
      is_local_content: true,
      display_order: 8,
      updated_by: "admin-1",
    })
    expect(eq).toHaveBeenCalledWith("id", "subject-1")
  })
})
