import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { PasswordRecoveryPage } from "@/features/auth/password-recovery-page"

describe("PasswordRecoveryPage", () => {
  it("mengirim email pemulihan dan menampilkan petunjuk berikutnya", async () => {
    const user = userEvent.setup()
    const onRequestReset = vi.fn().mockResolvedValue(undefined)
    render(
      <PasswordRecoveryPage
        mode="request"
        onBack={vi.fn()}
        onRequestReset={onRequestReset}
        onUpdatePassword={vi.fn()}
      />,
    )

    await user.type(screen.getByLabelText("Email"), "guru@example.com")
    await user.click(screen.getByRole("button", { name: "Kirim tautan reset" }))

    expect(onRequestReset).toHaveBeenCalledWith("guru@example.com")
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Tautan reset telah dikirim",
    )
  })

  it("mengirim password baru beserta konfirmasinya", async () => {
    const user = userEvent.setup()
    const onUpdatePassword = vi.fn().mockResolvedValue(undefined)
    render(
      <PasswordRecoveryPage
        mode="update"
        onBack={vi.fn()}
        onRequestReset={vi.fn()}
        onUpdatePassword={onUpdatePassword}
      />,
    )

    await user.type(screen.getByLabelText("Password baru"), "rahasia123")
    await user.type(screen.getByLabelText("Ulangi password baru"), "rahasia123")
    await user.click(
      screen.getByRole("button", { name: "Simpan password baru" }),
    )

    expect(onUpdatePassword).toHaveBeenCalledWith({
      password: "rahasia123",
      confirmation: "rahasia123",
    })
  })
})
