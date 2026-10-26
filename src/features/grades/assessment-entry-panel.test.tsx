import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AssessmentEntryPanel } from "./assessment-entry-panel"
import {
  createAssessmentItem,
  getAssessmentData,
  saveAssessmentScores,
} from "./assessment.service"

vi.mock("./assessment.service", () => ({
  createAssessmentItem: vi.fn(),
  getAssessmentData: vi.fn(),
  saveAssessmentScores: vi.fn(),
}))

const item = {
  id: "item-1",
  class_id: "class-1",
  subject_id: "subject-1",
  learning_outcome_id: "cp-1",
  assessment_component_id: "knowledge",
  semester_id: "semester-1",
  grade_level: 2,
  category: "formative",
  kind: "daily",
  title: "Nilai Harian 1",
  display_order: 1,
  is_active: true,
}

describe("AssessmentEntryPanel", () => {
  beforeEach(() => {
    vi.mocked(createAssessmentItem).mockReset()
    vi.mocked(saveAssessmentScores).mockReset()
    vi.mocked(getAssessmentData).mockResolvedValue({
      items: [item],
      scores: [
        {
          id: "score-1",
          assessment_item_id: "item-1",
          student_id: "student-1",
          score: 80,
        },
      ],
    })
  })

  it("menampilkan seluruh siswa dan menyimpan nilai penilaian terpilih", async () => {
    const user = userEvent.setup()
    const onDerivedGradesChanged = vi.fn().mockResolvedValue(undefined)
    const onModeChange = vi.fn()
    vi.mocked(saveAssessmentScores).mockResolvedValue(2)

    render(
      <AssessmentEntryPanel
        userId="user-1"
        scope={{
          classId: "class-1",
          subjectId: "subject-1",
          semesterId: "semester-1",
          gradeLevel: 2,
          assessmentComponentId: "knowledge",
        }}
        componentName="Pengetahuan"
        outcomes={[
          {
            id: "cp-1",
            code: "CP 1",
            title: "CP Pertama",
            description: "Memahami materi pertama",
          },
        ]}
        students={[
          { id: "student-1", full_name: "Siswa Satu", nis: "001" },
          { id: "student-2", full_name: "Siswa Dua", nis: "002" },
        ]}
        onModeChange={onModeChange}
        onDerivedGradesChanged={onDerivedGradesChanged}
      />,
    )

    const firstScore = await screen.findByLabelText("Nilai Harian 1 Siswa Satu")
    expect(firstScore).toHaveValue(80)
    expect(screen.getByText("Siswa Dua")).toBeInTheDocument()
    await user.type(screen.getByLabelText("Nilai Harian 1 Siswa Dua"), "90")
    await user.click(
      screen.getByRole("button", { name: "Simpan nilai penilaian" }),
    )

    await waitFor(() =>
      expect(saveAssessmentScores).toHaveBeenCalledWith("item-1", [
        { studentId: "student-1", score: 80 },
        { studentId: "student-2", score: 90 },
      ]),
    )
    expect(onModeChange).toHaveBeenCalledWith(true)
    expect(onDerivedGradesChanged).toHaveBeenCalled()
  })
})
