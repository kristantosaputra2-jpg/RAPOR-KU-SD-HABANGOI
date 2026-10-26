import { describe, expect, it, vi } from "vitest"

import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

import {
  getStudentReligionSubjectOverrides,
  setStudentReligionSubjectOverride,
  type StudentReligionSubjectOverride,
} from "./student-religion-subject.service"

const saved: StudentReligionSubjectOverride = {
  id: "override-1",
  student_id: "student-1",
  class_id: "class-1",
  semester_id: "semester-1",
  subject_id: "christian-subject",
  created_at: "2026-10-26T00:00:00.000Z",
  updated_at: "2026-10-26T00:00:00.000Z",
}

describe("student religion subject service", () => {
  it("memuat penggantian mapel agama yang dapat diakses", async () => {
    const order = vi.fn().mockResolvedValue({ data: [saved], error: null })
    const select = vi.fn().mockReturnValue({ order })
    const client = {
      from: vi.fn().mockReturnValue({ select }),
    } as unknown as RapotKuSupabaseClient

    await expect(getStudentReligionSubjectOverrides(client)).resolves.toEqual([
      saved,
    ])
    expect(client.from).toHaveBeenCalledWith(
      "student_religion_subject_overrides",
    )
  })

  it("menyimpan pengganti manual tanpa mengubah agama biodata", async () => {
    const single = vi.fn().mockResolvedValue({ data: saved, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    const client = {
      from: vi.fn().mockReturnValue({ insert }),
    } as unknown as RapotKuSupabaseClient

    await setStudentReligionSubjectOverride(
      "user-1",
      {
        studentId: "student-1",
        classId: "class-1",
        semesterId: "semester-1",
        subjectId: "christian-subject",
        existing: null,
      },
      client,
    )

    expect(insert).toHaveBeenCalledWith({
      student_id: "student-1",
      class_id: "class-1",
      semester_id: "semester-1",
      subject_id: "christian-subject",
      created_by: "user-1",
      updated_by: "user-1",
    })
  })

  it("menghapus pengganti untuk kembali ke pengelompokan otomatis", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const remove = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ delete: remove }),
    } as unknown as RapotKuSupabaseClient

    await expect(
      setStudentReligionSubjectOverride(
        "user-1",
        {
          studentId: "student-1",
          classId: "class-1",
          semesterId: "semester-1",
          subjectId: null,
          existing: saved,
        },
        client,
      ),
    ).resolves.toBeNull()
    expect(eq).toHaveBeenCalledWith("id", "override-1")
  })

  it("mengubah mapel pengganti yang sudah ada", async () => {
    const changed = { ...saved, subject_id: "catholic-subject" }
    const single = vi.fn().mockResolvedValue({ data: changed, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const eq = vi.fn().mockReturnValue({ select })
    const update = vi.fn().mockReturnValue({ eq })
    const client = {
      from: vi.fn().mockReturnValue({ update }),
    } as unknown as RapotKuSupabaseClient

    await expect(
      setStudentReligionSubjectOverride(
        "user-1",
        {
          studentId: "student-1",
          classId: "class-1",
          semesterId: "semester-1",
          subjectId: "catholic-subject",
          existing: saved,
        },
        client,
      ),
    ).resolves.toEqual(changed)
    expect(update).toHaveBeenCalledWith({
      subject_id: "catholic-subject",
      updated_by: "user-1",
    })
  })
})
