import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { StudentYearEndPage } from "@/features/students/student-year-end-page"

const periodMocks = vi.hoisted(() => ({ getAcademicPeriods: vi.fn() }))
const classMocks = vi.hoisted(() => ({ getClasses: vi.fn() }))
const studentMocks = vi.hoisted(() => ({
  getStudents: vi.fn(),
  getClassMemberships: vi.fn(),
}))
const yearEndMocks = vi.hoisted(() => ({ processStudentYearEnd: vi.fn() }))

vi.mock(
  "@/features/academic-periods/academic-periods.service",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/academic-periods/academic-periods.service")
    >()),
    ...periodMocks,
  }),
)
vi.mock("@/features/classes/class.service", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/features/classes/class.service")
  >()),
  ...classMocks,
}))
vi.mock("@/features/students/student.service", async (importOriginal) => ({
  ...(await importOriginal<
    typeof import("@/features/students/student.service")
  >()),
  ...studentMocks,
}))
vi.mock(
  "@/features/students/student-year-end.service",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("@/features/students/student-year-end.service")
    >()),
    ...yearEndMocks,
  }),
)

const periods = {
  schoolId: "school-1",
  academicYears: [
    {
      id: "year-1",
      school_id: "school-1",
      name: "2026/2027",
      is_active: true,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    },
    {
      id: "year-2",
      school_id: "school-1",
      name: "2027/2028",
      is_active: false,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    },
  ],
  semesters: [
    {
      id: "semester-2",
      academic_year_id: "year-1",
      number: 2,
      is_active: true,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    },
    {
      id: "semester-next",
      academic_year_id: "year-2",
      number: 1,
      is_active: false,
      created_at: "2026-09-02T00:00:00Z",
      updated_at: "2026-09-02T00:00:00Z",
    },
  ],
}

const classes = [
  {
    id: "class-5",
    academic_year_id: "year-1",
    semester_id: "semester-2",
    grade_level: 5,
    name: "5A",
    homeroom_teacher_id: null,
    template_group: "upper_primary" as const,
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "class-6",
    academic_year_id: "year-1",
    semester_id: "semester-2",
    grade_level: 6,
    name: "6A",
    homeroom_teacher_id: null,
    template_group: "upper_primary" as const,
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "class-next",
    academic_year_id: "year-2",
    semester_id: "semester-next",
    grade_level: 6,
    name: "6A",
    homeroom_teacher_id: null,
    template_group: "upper_primary" as const,
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
]

const students = [
  {
    id: "student-1",
    full_name: "Ani",
    nis: "001",
    nisn: null,
    gender: "female" as const,
    birth_place: null,
    birth_date: null,
    religion: null,
    address: null,
    father_name: null,
    mother_name: null,
    guardian_name: null,
    is_active: true,
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "student-2",
    full_name: "Budi",
    nis: "002",
    nisn: null,
    gender: "male" as const,
    birth_place: null,
    birth_date: null,
    religion: null,
    address: null,
    father_name: null,
    mother_name: null,
    guardian_name: null,
    is_active: true,
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
]

const memberships = [
  {
    id: "member-1",
    student_id: "student-1",
    class_id: "class-5",
    semester_id: "semester-2",
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
  {
    id: "member-2",
    student_id: "student-2",
    class_id: "class-6",
    semester_id: "semester-2",
    created_at: "2026-09-02T00:00:00Z",
    updated_at: "2026-09-02T00:00:00Z",
  },
]

function renderPage() {
  return render(
    <StudentYearEndPage
      userName="Admin"
      schoolName="SD Negeri Tumbang Habangoi"
      onBack={vi.fn()}
      onLogout={vi.fn()}
    />,
  )
}

describe("StudentYearEndPage", () => {
  beforeEach(() => {
    Object.values(periodMocks).forEach((mock) => mock.mockReset())
    Object.values(classMocks).forEach((mock) => mock.mockReset())
    Object.values(studentMocks).forEach((mock) => mock.mockReset())
    Object.values(yearEndMocks).forEach((mock) => mock.mockReset())
    periodMocks.getAcademicPeriods.mockResolvedValue(periods)
    classMocks.getClasses.mockResolvedValue(classes)
    studentMocks.getStudents.mockResolvedValue(students)
    studentMocks.getClassMemberships.mockResolvedValue(memberships)
    yearEndMocks.processStudentYearEnd.mockResolvedValue(1)
    vi.spyOn(window, "confirm").mockReturnValue(true)
  })

  it("menaikkan siswa ke kelas semester satu tahun berikutnya", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(
      await screen.findByLabelText("Kelas semester genap"),
      "class-5",
    )
    await user.selectOptions(
      screen.getByLabelText(/Kelas 6, semester 1/),
      "class-next",
    )
    await user.click(screen.getByText("Ani"))
    await user.click(screen.getByRole("button", { name: "Naikkan 1 siswa" }))

    await waitFor(() => {
      expect(yearEndMocks.processStudentYearEnd).toHaveBeenCalledWith(
        "class-5",
        ["student-1"],
        "class-next",
      )
    })
  })

  it("meluluskan kelas enam tanpa menghapus riwayat", async () => {
    const user = userEvent.setup()
    renderPage()

    await user.selectOptions(
      await screen.findByLabelText("Kelas semester genap"),
      "class-6",
    )
    await user.click(screen.getByRole("button", { name: "Pilih semua" }))
    await user.click(screen.getByRole("button", { name: "Luluskan 1 siswa" }))

    await waitFor(() => {
      expect(yearEndMocks.processStudentYearEnd).toHaveBeenCalledWith(
        "class-6",
        ["student-2"],
        null,
      )
    })
  })
})
