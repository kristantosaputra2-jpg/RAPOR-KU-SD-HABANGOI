import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

import { isUserRole, type UserRole } from "@/features/auth/auth.types"
import {
  getSupabaseClient,
  type RapotKuSupabaseClient,
} from "@/lib/supabase/client"
import type { Tables } from "@/types/database.types"

export type LoginCredentials = Readonly<{
  email: string
  password: string
}>

export type PasswordUpdate = Readonly<{
  password: string
  confirmation: string
}>

export type UserProfile = Pick<
  Tables<"profiles">,
  "id" | "full_name" | "role" | "is_active"
> & {
  role: UserRole
}

export type AuthenticatedUser = Readonly<{
  session: Session
  user: User
  profile: UserProfile
}>

export class AuthFlowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "AuthFlowError"
  }
}

async function getActiveProfile(
  client: RapotKuSupabaseClient,
  userId: string,
): Promise<UserProfile> {
  const { data, error } = await client
    .from("profiles")
    .select("id,full_name,role,is_active")
    .eq("id", userId)
    .single()

  if (error || !data || !data.is_active || !isUserRole(data.role)) {
    throw new AuthFlowError(
      "Akun belum diaktifkan. Hubungi admin sekolah untuk mendapatkan akses.",
    )
  }

  return { ...data, role: data.role }
}

async function buildAuthenticatedUser(
  client: RapotKuSupabaseClient,
  user: User,
  session: Session,
): Promise<AuthenticatedUser> {
  const profile = await getActiveProfile(client, user.id)

  return { session, user, profile }
}

export async function signInWithPassword(
  credentials: LoginCredentials,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AuthenticatedUser> {
  const email = credentials.email.trim().toLowerCase()

  if (!email || !credentials.password) {
    throw new AuthFlowError("Email dan kata sandi wajib diisi.")
  }

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password: credentials.password,
  })

  if (error || !data.user || !data.session) {
    throw new AuthFlowError("Email atau kata sandi tidak sesuai.")
  }

  try {
    return await buildAuthenticatedUser(client, data.user, data.session)
  } catch (profileError) {
    await client.auth.signOut({ scope: "local" })

    if (profileError instanceof AuthFlowError) {
      throw profileError
    }

    throw new AuthFlowError(
      "Profil pengguna belum dapat dibaca. Silakan coba lagi.",
    )
  }
}

export async function requestPasswordReset(
  emailAddress: string,
  redirectTo: string,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const email = emailAddress.trim().toLowerCase()

  if (!email) {
    throw new AuthFlowError("Email wajib diisi.")
  }

  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  if (error) {
    throw new AuthFlowError(
      "Tautan reset belum dapat dikirim. Periksa email dan koneksi lalu coba lagi.",
    )
  }
}

export async function updatePassword(
  input: PasswordUpdate,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  if (input.password.length < 8) {
    throw new AuthFlowError("Password baru minimal 8 karakter.")
  }

  if (input.password !== input.confirmation) {
    throw new AuthFlowError("Konfirmasi password belum sama.")
  }

  const { error } = await client.auth.updateUser({ password: input.password })

  if (error) {
    throw new AuthFlowError(
      "Password baru belum dapat disimpan. Minta tautan reset baru lalu coba lagi.",
    )
  }
}

export function onPasswordRecovery(
  callback: () => void,
  client: RapotKuSupabaseClient = getSupabaseClient(),
): () => void {
  const { data } = client.auth.onAuthStateChange((event: AuthChangeEvent) => {
    if (event === "PASSWORD_RECOVERY") {
      callback()
    }
  })

  return () => data.subscription.unsubscribe()
}

export async function getCurrentAuthenticatedUser(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<AuthenticatedUser | null> {
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession()

  if (sessionError || !session) {
    return null
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser()

  if (userError || !user) {
    await client.auth.signOut({ scope: "local" })
    return null
  }

  try {
    return await buildAuthenticatedUser(client, user, session)
  } catch (profileError) {
    await client.auth.signOut({ scope: "local" })

    if (profileError instanceof AuthFlowError) {
      throw profileError
    }

    throw new AuthFlowError(
      "Sesi belum dapat dipulihkan. Silakan masuk kembali.",
    )
  }
}

export async function signOut(
  client: RapotKuSupabaseClient = getSupabaseClient(),
): Promise<void> {
  const { error } = await client.auth.signOut({ scope: "local" })

  if (error) {
    throw new AuthFlowError(
      "Belum dapat keluar dari aplikasi. Silakan coba lagi.",
    )
  }
}
