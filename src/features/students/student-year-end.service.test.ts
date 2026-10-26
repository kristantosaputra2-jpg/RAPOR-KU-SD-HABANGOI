import { describe, expect, it, vi } from "vitest"

import {
  getNextAcademicYearName,
  processStudentYearEnd,
} from "@/features/students/student-year-end.service"
import type { RapotKuSupabaseClient } from "@/lib/supabase/client"

describe("student year-end service", () => {
  it("menentukan tahun ajaran berikutnya", () => {
    expect(getNextAcademicYearName("2026/2027")).toBe("2027/2028")
  })

  it("memproses siswa terpilih sekali melalui database", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 2, error: null })
    const client = { rpc } as unknown as RapotKuSupabaseClient

    await expect(
      processStudentYearEnd(
        "class-6a",
        ["student-1", "student-1", "student-2"],
        null,
        client,
      ),
    ).resolves.toBe(2)
    expect(rpc).toHaveBeenCalledWith("process_student_year_end", {
      p_source_class_id: "class-6a",
      p_student_ids: ["student-1", "student-2"],
      p_target_class_id: null,
    })
  })
})
