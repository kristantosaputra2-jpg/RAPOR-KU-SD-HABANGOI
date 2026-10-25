import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { AuthFlowError } from "@/features/auth/auth.service"
import { LoginPage } from "@/features/auth/login-page"

describe("LoginPage", () => {
  it("membuka alur lupa password", async () => {
    const user = userEvent.setup()
    const onForgotPassword = vi.fn()
    render(<LoginPage onLogin={vi.fn()} onForgotPassword={onForgotPassword} />)

    await user.click(screen.getByRole("button", { name: "Lupa password?" }))

    expect(onForgotPassword).toHaveBeenCalledOnce()
  })

  it("menampilkan dan menyembunyikan kata sandi", async () => {
    const user = userEvent.setup()
    render(<LoginPage schoolName="SD Negeri Tumbang Kawei" onLogin={vi.fn()} />)
    const password = screen.getByLabelText("Kata sandi")

    expect(password).toHaveAttribute("type", "password")
    await user.click(
      screen.getByRole("button", { name: "Tampilkan kata sandi" }),
    )
    expect(password).toHaveAttribute("type", "text")
    await user.click(
      screen.getByRole("button", { name: "Sembunyikan kata sandi" }),
    )
    expect(password).toHaveAttribute("type", "password")
  })

  it("menampilkan identitas dan ilustrasi sekolah pada login", () => {
    render(<LoginPage schoolName="SD Negeri Tumbang Kawei" onLogin={vi.fn()} />)

    expect(screen.getAllByText("SD Negeri Tumbang Kawei")).toHaveLength(2)
    expect(
      screen.getByAltText("Ilustrasi siswa sekolah dasar di halaman sekolah"),
    ).toHaveAttribute("src", "/images/rapotku-school-hero.png")
  })

  it("menampilkan pesan autentikasi yang ramah", async () => {
    const user = userEvent.setup()
    const onLogin = vi
      .fn()
      .mockRejectedValue(
        new AuthFlowError("Email atau kata sandi tidak sesuai."),
      )
    render(<LoginPage onLogin={onLogin} />)

    await user.type(screen.getByLabelText("Email"), "guru@example.com")
    await user.type(screen.getByLabelText("Kata sandi"), "salah")
    await user.click(screen.getByRole("button", { name: "Masuk" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email atau kata sandi tidak sesuai.",
    )
  })

  it("menampilkan pesan koneksi untuk error yang tidak dikenal", async () => {
    const user = userEvent.setup()
    const onLogin = vi.fn().mockRejectedValue(new Error("network"))
    render(<LoginPage onLogin={onLogin} />)

    await user.type(screen.getByLabelText("Email"), "guru@example.com")
    await user.type(screen.getByLabelText("Kata sandi"), "aman1234")
    await user.click(screen.getByRole("button", { name: "Masuk" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Periksa koneksi internet lalu coba lagi.",
    )
  })
})
