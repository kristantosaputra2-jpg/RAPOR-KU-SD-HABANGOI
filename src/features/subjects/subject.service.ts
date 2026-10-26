import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Database, Tables } from "@/types/database.types"

const subjectColumns =
  "id,name,code,religion_scope,is_local_content,display_order,is_active,created_at,updated_at"

export const RELIGION_SCOPE_OPTIONS = [
  { value: "islam", label: "Islam" },
  { value: "christian", label: "Kristen" },
  { value: "catholic", label: "Katolik" },
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddha" },
  { value: "confucian", label: "Konghucu" },
  { value: "belief", label: "Kepercayaan" },
] as const

export type ReligionScope = (typeof RELIGION_SCOPE_OPTIONS)[number]["value"]

export type Subject = Pick<
  Tables<"subjects">,
  | "id"
  | "name"
  | "code"
  | "religion_scope"
  | "is_local_content"
  | "display_order"
  | "is_active"
  | "created_at"
  | "updated_at"
>

export type SubjectInput = Readonly<{
  name: string
  code: string
  religionScope: ReligionScope | null
  isLocalContent: boolean
  displayOrder: number
}>

type NormalizedSubjectInput = Readonly<{
  name: string
  code: string | null
  religion_scope: ReligionScope | null
  is_local_content: boolean
  display_order: number
}>

export class SubjectError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SubjectError"
  }
}

export function normalizeReligion(
  religion: string | null | undefined,
): ReligionScope | null {
  const value = religion?.trim().toLocaleLowerCase("id-ID") ?? ""
  if (!value) return null
  if (value.includes("katolik")) return "catholic"
  if (value.includes("kristen") || value.includes("protestan")) {
    return "christian"
  }
  if (value.includes("islam")) return "islam"
  if (value.includes("hindu")) return "hindu"
  if (value.includes("buddha")) return "buddhist"
  if (value.includes("konghucu") || value.includes("khonghucu")) {
    return "confucian"
  }
  if (value.includes("kepercayaan") || value.includes("penghayat")) {
    return "belief"
  }
  return null
}

export function subjectMatchesStudentReligion(
  subject: Pick<Subject, "id" | "religion_scope">,
  religion: string | null | undefined,
  overrideSubjectId: string | null = null,
) {
  if (subject.religion_scope === null) return true
  if (overrideSubjectId) return subject.id === overrideSubjectId
  return subject.religion_scope === normalizeReligion(religion)
}

export function getReligionScopeLabel(scope: string | null) {
  return (
    RELIGION_SCOPE_OPTIONS.find((option) => option.value === scope)?.label ??
    "Semua siswa"
  )
}

function errorCode(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
    ? error.code
    : ""
}

export function normalizeSubjectInput(
  input: SubjectInput,
): NormalizedSubjectInput {
  const name = input.name.trim()
  const code = input.code.trim()

  if (!name) {
    throw new SubjectError("Nama mata pelajaran wajib diisi.")
  }

  if (name.length > 120) {
    throw new SubjectError("Nama mata pelajaran maksimal 120 karakter.")
  }

  if (code && (code.length > 30 || !/^[a-zA-Z0-9./_-]+$/.test(code))) {
    throw new SubjectError(
      "Kode maksimal 30 karakter dan hanya boleh berisi huruf, angka, titik, garis miring, garis bawah, atau tanda hubung.",
    )
  }

  if (
    !Number.isInteger(input.displayOrder) ||
    input.displayOrder < 1 ||
    input.displayOrder > 999
  ) {
    throw new SubjectError("Urutan tampil harus berupa angka 1 sampai 999.")
  }

  return {
    name,
    code: code || null,
    religion_scope: input.religionScope,
    is_local_content: input.isLocalContent,
    display_order: input.displayOrder,
  }
}

function saveErrorMessage(error: unknown, action: "create" | "update") {
  if (errorCode(error) === "23505") {
    return "Nama atau kode mata pelajaran tersebut sudah digunakan."
  }

  if (errorCode(error) === "23514") {
    return "Data mata pelajaran belum sesuai. Periksa nama, kode, dan urutan tampil."
  }

  return action === "create"
    ? "Mata pelajaran belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
    : "Perubahan mata pelajaran belum dapat disimpan. Periksa koneksi internet lalu coba lagi."
}

export async function getSubjects(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<ReadonlyArray<Subject>> {
  const { data, error } = await client
    .from("subjects")
    .select(subjectColumns)
    .order("display_order", { ascending: true })
    .order("name", { ascending: true })

  if (error) {
    throw new SubjectError(
      "Mata pelajaran belum dapat dimuat. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}

export async function createSubject(
  userId: string,
  input: SubjectInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Subject> {
  const normalized = normalizeSubjectInput(input)
  const insert: Database["public"]["Tables"]["subjects"]["Insert"] = {
    ...normalized,
    created_by: userId,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("subjects")
    .insert(insert)
    .select(subjectColumns)
    .single()

  if (error || !data) {
    throw new SubjectError(saveErrorMessage(error, "create"))
  }

  return data
}

export async function updateSubject(
  userId: string,
  subjectId: string,
  input: SubjectInput,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Subject> {
  const normalized = normalizeSubjectInput(input)
  const update: Database["public"]["Tables"]["subjects"]["Update"] = {
    ...normalized,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("subjects")
    .update(update)
    .eq("id", subjectId)
    .select(subjectColumns)
    .single()

  if (error || !data) {
    throw new SubjectError(saveErrorMessage(error, "update"))
  }

  return data
}

export async function setSubjectActive(
  userId: string,
  subjectId: string,
  isActive: boolean,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<Subject> {
  const update: Database["public"]["Tables"]["subjects"]["Update"] = {
    is_active: isActive,
    updated_by: userId,
  }
  const { data, error } = await client
    .from("subjects")
    .update(update)
    .eq("id", subjectId)
    .select(subjectColumns)
    .single()

  if (error || !data) {
    throw new SubjectError(
      "Status mata pelajaran belum dapat diubah. Periksa koneksi internet lalu coba lagi.",
    )
  }

  return data
}
