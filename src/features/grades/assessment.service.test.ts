import { describe, expect, it, vi } from "vitest"

import { saveAssessmentScores } from "./assessment.service"

describe("saveAssessmentScores", () => {
  it("sends zero and empty scores without losing student identity", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null })
    const result = await saveAssessmentScores(
      "item-1",
      [
        { studentId: "student-1", score: 0 },
        { studentId: "student-2", score: null },
      ],
      { rpc } as never,
    )

    expect(result).toBe(1)
    expect(rpc).toHaveBeenCalledWith("save_assessment_scores", {
      p_assessment_item_id: "item-1",
      p_scores: [
        { student_id: "student-1", score: 0 },
        { student_id: "student-2", score: null },
      ],
    })
  })

  it("rejects scores outside zero to one hundred", async () => {
    await expect(
      saveAssessmentScores("item-1", [{ studentId: "student-1", score: 101 }], {
        rpc: vi.fn(),
      } as never),
    ).rejects.toThrow("0 sampai 100")
  })
})
