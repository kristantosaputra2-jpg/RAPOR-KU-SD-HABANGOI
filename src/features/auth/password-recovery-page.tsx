import { useState, type FormEvent } from "react"
import { ArrowLeft, Mail, ShieldCheck } from "lucide-react"

import { AppLogo } from "@/components/app-logo"
import {
  AuthFlowError,
  type PasswordUpdate,
} from "@/features/auth/auth.service"

type PasswordRecoveryPageProps = Readonly<{
  mode: "request" | "update"
  schoolName?: string
  onBack: () => void
  onRequestReset: (email: string) => Promise<void>
  onUpdatePassword: (input: PasswordUpdate) => Promise<void>
}>

export function PasswordRecoveryPage({
  mode,
  schoolName,
  onBack,
  onRequestReset,
  onUpdatePassword,
}: PasswordRecoveryPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      if (mode === "request") {
        await onRequestReset(String(formData.get("email") ?? ""))
        setSuccessMessage(
          "Tautan reset telah dikirim. Periksa kotak masuk atau folder spam Anda.",
        )
      } else {
        await onUpdatePassword({
          password: String(formData.get("password") ?? ""),
          confirmation: String(formData.get("confirmation") ?? ""),
        })
      }
    } catch (error) {
      setErrorMessage(
        error instanceof AuthFlowError
          ? error.message
          : "Proses belum berhasil. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRequest = mode === "request"

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--rapotku-canvas)] px-4 py-8 text-[var(--rapotku-text)] sm:px-8">
      <section className="w-full max-w-md rounded-[var(--rapotku-radius-card)] border border-[var(--rapotku-border)] bg-white p-6 shadow-[0_20px_50px_rgba(66,20,23,0.12)] sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <AppLogo className="size-11 shadow-sm" />
          <div>
            <p className="font-bold">RaporKu</p>
            <p className="text-xs text-[var(--rapotku-muted)]">
              {schoolName ?? "Rapor sekolah lebih mudah"}
            </p>
          </div>
        </div>

        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-[var(--rapotku-brand-soft)] text-[var(--rapotku-brand)]">
          {isRequest ? (
            <Mail aria-hidden="true" size={24} />
          ) : (
            <ShieldCheck aria-hidden="true" size={24} />
          )}
        </span>
        <h1 className="text-3xl font-bold tracking-tight">
          {isRequest ? "Lupa password" : "Buat password baru"}
        </h1>
        <p className="mt-3 leading-7 text-[var(--rapotku-muted)]">
          {isRequest
            ? "Masukkan email akun Anda. Kami akan mengirim tautan untuk membuat password baru."
            : "Gunakan minimal 8 karakter dan masukkan password yang sama pada kedua kolom."}
        </p>

        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          {isRequest ? (
            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="recovery-email"
              >
                Email
              </label>
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                id="recovery-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </div>
          ) : (
            <>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor="new-password"
                >
                  Password baru
                </label>
                <input
                  className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                  id="new-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label
                  className="mb-2 block text-sm font-semibold"
                  htmlFor="password-confirmation"
                >
                  Ulangi password baru
                </label>
                <input
                  className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none transition focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                  id="password-confirmation"
                  name="confirmation"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={isSubmitting}
                />
              </div>
            </>
          )}

          {errorMessage ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {errorMessage}
            </p>
          ) : null}
          {successMessage ? (
            <p
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              {successMessage}
            </p>
          ) : null}

          <button
            className="min-h-12 w-full rounded-xl bg-[var(--rapotku-brand)] px-5 font-semibold text-white shadow-sm transition hover:bg-[var(--rapotku-brand-strong)] disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Memproses..."
              : isRequest
                ? "Kirim tautan reset"
                : "Simpan password baru"}
          </button>
          <button
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-[var(--rapotku-brand)] hover:bg-[var(--rapotku-brand-soft)]"
            type="button"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ArrowLeft aria-hidden="true" size={17} /> Kembali ke halaman masuk
          </button>
        </form>
      </section>
    </main>
  )
}
