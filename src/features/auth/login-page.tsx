import { useState, type FormEvent } from "react"
import {
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"

import { AppLogo } from "@/components/app-logo"

import {
  AuthFlowError,
  type LoginCredentials,
} from "@/features/auth/auth.service"
import { MotionHeroImage } from "@/components/motion-hero-image"

type LoginPageProps = Readonly<{
  schoolName?: string
  noticeMessage?: string
  onLogin: (credentials: LoginCredentials) => Promise<void>
  onForgotPassword?: () => void
}>

export function LoginPage({
  schoolName,
  noticeMessage,
  onLogin,
  onForgotPassword,
}: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage("")
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await onLogin({
        email: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      })
    } catch (error) {
      setErrorMessage(
        error instanceof AuthFlowError
          ? error.message
          : "Belum dapat masuk. Periksa koneksi internet lalu coba lagi.",
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="app-shell min-h-screen bg-[var(--rapotku-canvas)] text-[var(--rapotku-text)] lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[var(--rapotku-brand-strong)] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <MotionHeroImage
          className="absolute inset-0 size-full"
          imageClassName="size-full object-cover object-center"
          alt=""
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(65,8,11,0.48)_0%,rgba(93,10,14,0.22)_42%,rgba(74,7,11,0.82)_100%)]" />

        <div className="relative flex items-center gap-3">
          <AppLogo className="size-12 shadow-lg" />
          <div>
            <p className="text-xl font-bold">RaporKu</p>
            <p className="text-sm font-medium text-white/90">
              {schoolName ?? "Rapor sekolah lebih mudah"}
            </p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <span className="mb-6 grid size-20 place-items-center rounded-3xl border border-white/20 bg-white/15 backdrop-blur-sm">
            <GraduationCap aria-hidden="true" size={42} strokeWidth={1.8} />
          </span>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
            Sederhana untuk guru
          </p>
          <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
            Kelola rapor dengan tenang, dari mana saja.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-white/80">
            Masuk untuk melanjutkan pekerjaan sesuai tugas dan kelas Anda.
          </p>
        </div>

        <div className="relative flex flex-wrap gap-5 text-sm text-white/85">
          <span className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" size={18} /> Mudah digunakan
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck aria-hidden="true" size={18} /> Data terlindungi
          </span>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8 lg:px-12">
        <div className="w-full max-w-md rounded-[var(--rapotku-radius-card)] bg-white/60 p-1 backdrop-blur-[2px] sm:p-2 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div className="mb-6 overflow-hidden rounded-3xl border border-[var(--rapotku-border)] bg-white shadow-[0_16px_38px_rgba(66,20,23,0.12)] lg:hidden">
            <MotionHeroImage
              className="w-full"
              imageClassName="h-auto w-full"
              alt="Ilustrasi siswa sekolah dasar di halaman sekolah"
            />
          </div>
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <AppLogo className="size-11 shadow-sm" />
            <div>
              <p className="font-bold">RaporKu</p>
              <p className="text-xs text-[var(--rapotku-muted)]">
                {schoolName ?? "Rapor sekolah lebih mudah"}
              </p>
            </div>
          </div>

          <p className="mb-2 text-sm font-semibold text-[var(--rapotku-brand)]">
            Selamat datang kembali
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Masuk ke akun Anda
          </h1>
          <p className="mt-3 leading-7 text-[var(--rapotku-muted)]">
            Gunakan email dan kata sandi yang diberikan oleh admin sekolah.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {noticeMessage ? (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                {noticeMessage}
              </p>
            ) : null}
            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="email"
              >
                Email
              </label>
              <input
                className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white px-4 outline-none transition placeholder:text-[#98a2b3] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                id="email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="nama@email.com"
                required
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-semibold"
                htmlFor="password"
              >
                Kata sandi
              </label>
              <div className="relative">
                <LockKeyhole
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rapotku-muted)]"
                  size={19}
                />
                <input
                  className="min-h-12 w-full rounded-xl border border-[var(--rapotku-border)] bg-white py-3 pl-11 pr-12 outline-none transition placeholder:text-[#98a2b3] focus:border-[var(--rapotku-brand)] focus:ring-4 focus:ring-[var(--rapotku-brand-soft)]"
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  required
                  disabled={isSubmitting}
                />
                <button
                  className="absolute right-1 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-lg text-[var(--rapotku-muted)] hover:bg-[var(--rapotku-canvas)] focus-visible:outline-2 focus-visible:outline-[var(--rapotku-brand)]"
                  type="button"
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" size={20} />
                  ) : (
                    <Eye aria-hidden="true" size={20} />
                  )}
                </button>
              </div>
              <div className="mt-2 text-right">
                <button
                  className="min-h-11 rounded-lg px-2 text-sm font-semibold text-[var(--rapotku-brand)] hover:bg-[var(--rapotku-brand-soft)] focus-visible:outline-2 focus-visible:outline-[var(--rapotku-brand)]"
                  type="button"
                  onClick={onForgotPassword}
                  disabled={isSubmitting}
                >
                  Lupa password?
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div
                className="rounded-xl border border-[#f5b7ba] bg-[var(--rapotku-brand-soft)] p-4 text-sm leading-6 text-[var(--rapotku-brand-strong)]"
                role="alert"
              >
                {errorMessage}
              </div>
            ) : null}

            <button
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--rapotku-brand)] px-5 font-semibold text-white shadow-[0_10px_24px_rgba(201,29,36,0.22)] transition hover:bg-[var(--rapotku-brand-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--rapotku-brand)] disabled:cursor-not-allowed disabled:opacity-65"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sedang masuk..." : "Masuk"}
            </button>
          </form>

          <p className="mt-7 text-center text-sm leading-6 text-[var(--rapotku-muted)]">
            Belum memiliki akun? Hubungi admin sekolah.
          </p>
        </div>
      </section>
    </main>
  )
}
