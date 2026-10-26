import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"

export class StudentYearEndError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "StudentYearEndError"
  }
}

export function getNextAcademicYearName(name: string): string {
  const match = /^(\d{4})\/(\d{4})$/.exec(name)

  if (!match || Number(match[2]) !== Number(match[1]) + 1) {
    throw new StudentYearEndError("Format tahun ajaran tidak valid.")
  }

  const nextStart = Number(match[2])
  return `${nextStart}/${nextStart + 1}`
}

export async function processStudentYearEnd(
  sourceClassId: string,
  studentIds: ReadonlyArray<string>,
  targetClassId: string | null,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<number> {
  const uniqueStudentIds = [...new Set(studentIds)]

  if (!sourceClassId || !uniqueStudentIds.length) {
    throw new StudentYearEndError(
      "Pilih kelas dan minimal satu siswa untuk diproses.",
    )
  }

  const { data, error } = await client.rpc("process_student_year_end", {
    p_source_class_id: sourceClassId,
    p_student_ids: uniqueStudentIds,
    p_target_class_id: targetClassId,
  })

  if (error || typeof data !== "number") {
    throw new StudentYearEndError(
      "Kenaikan kelas atau kelulusan belum dapat disimpan. Periksa pilihan kelas dan koneksi internet lalu coba lagi.",
    )
  }

  return data
}
