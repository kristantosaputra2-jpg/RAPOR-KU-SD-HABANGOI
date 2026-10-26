import { expect, test, type Page } from "@playwright/test"

const adminUser = {
  id: "admin-dashboard-test",
  aud: "authenticated",
  role: "authenticated",
  email: "admin@example.com",
  email_confirmed_at: "2026-09-02T00:00:00.000Z",
  phone: "",
  app_metadata: { provider: "email", providers: ["email"] },
  user_metadata: {},
  identities: [],
  created_at: "2026-09-02T00:00:00.000Z",
  updated_at: "2026-09-02T00:00:00.000Z",
}

async function openAuthenticatedDashboard(
  page: Page,
  withClassPeriod = false,
  withGradeData = false,
  gradeLevel = 2,
  profileRole: "admin" | "homeroom_teacher" | "subject_teacher" = "admin",
) {
  const supabaseUrl = process.env.RAPOTKU_E2E_SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error("VITE_SUPABASE_URL belum tersedia untuk pengujian E2E.")
  }

  const projectReference = new URL(supabaseUrl).hostname.split(".")[0]

  if (!projectReference) {
    throw new Error("Referensi project Supabase tidak valid.")
  }

  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({ status: 200, json: adminUser })
  })
  await page.route("**/rest/v1/profiles*", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        id: adminUser.id,
        full_name:
          profileRole === "admin"
            ? "Admin Sekolah"
            : profileRole === "homeroom_teacher"
              ? "Rina Wulandari"
              : "Budi Santoso",
        role: profileRole,
        is_active: true,
      },
    })
  })
  await page.route("**/rest/v1/schools*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod ? [{ id: "school-1" }] : [],
    })
  })
  await page.route("**/rest/v1/academic_years*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod
        ? [
            {
              id: "year-1",
              school_id: "school-1",
              name: "2026/2027",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/semesters*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withClassPeriod
        ? [
            {
              id: "semester-1",
              academic_year_id: "year-1",
              number: 1,
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/teacher_profiles*", async (route) => {
    await route.fulfill({
      status: 200,
      json: profileRole === "admin" ? [] : { id: "teacher-1" },
    })
  })
  await page.route("**/rest/v1/classes*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "class-1",
              academic_year_id: "year-1",
              semester_id: "semester-1",
              grade_level: gradeLevel,
              name: `Kelas ${gradeLevel}A`,
              homeroom_teacher_id:
                profileRole === "homeroom_teacher" ? "teacher-1" : null,
              template_group:
                gradeLevel <= 3 ? "lower_primary" : "upper_primary",
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/students*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? ["Ani", "Budi", "Citra"].map((name, index) => ({
            id: `student-${index + 1}`,
            full_name: name,
            nis: `100${index + 1}`,
            nisn: null,
            gender: index === 1 ? "male" : "female",
            birth_place: null,
            birth_date: null,
            religion: null,
            address: null,
            father_name: null,
            mother_name: null,
            guardian_name: null,
            is_active: true,
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route("**/rest/v1/class_members*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [1, 2, 3].map((number) => ({
            id: `member-${number}`,
            student_id: `student-${number}`,
            class_id: "class-1",
            semester_id: "semester-1",
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route(
    "**/rest/v1/student_religion_subject_overrides*",
    async (route) => {
      await route.fulfill({ status: 200, json: [] })
    },
  )
  await page.route("**/rest/v1/subjects*", async (route) => {
    const subjectNames =
      gradeLevel >= 4
        ? [
            "Matematika",
            "Bahasa Indonesia",
            "Pendidikan Pancasila",
            "IPAS",
            "Seni Budaya",
            "PJOK",
          ]
        : ["Matematika"]
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? subjectNames.map((name, index) => ({
            id: `subject-${index + 1}`,
            name,
            code: `MPL-${index + 1}`,
            religion_scope: null,
            is_local_content: false,
            display_order: index + 1,
            is_active: true,
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route("**/rest/v1/teacher_assignments*", async (route) => {
    const subjectCount = gradeLevel >= 4 ? 6 : 1
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? Array.from({ length: subjectCount }, (_, index) => ({
            id: `assignment-${index + 1}`,
            teacher_id: "teacher-1",
            class_id: "class-1",
            subject_id: `subject-${index + 1}`,
            academic_year_id: "year-1",
            semester_id: "semester-1",
            is_active: true,
            created_at: "2026-09-02T00:00:00.000Z",
            updated_at: "2026-09-02T00:00:00.000Z",
          }))
        : [],
    })
  })
  await page.route("**/rest/v1/learning_outcomes*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "outcome-1",
              subject_id: "subject-1",
              grade_level: gradeLevel,
              semester_id: "semester-1",
              code: "CP-1",
              title: "Bilangan dasar",
              description: "Memahami bilangan dasar.",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
            {
              id: "outcome-2",
              subject_id: "subject-1",
              grade_level: gradeLevel,
              semester_id: "semester-1",
              code: "CP-2",
              title: "Operasi hitung",
              description: "Menerapkan operasi hitung sederhana.",
              is_active: true,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/grading_rules*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "rule-1",
              class_id: "class-1",
              subject_id: "subject-1",
              semester_id: "semester-1",
              minimum_mastery_score: 65,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/assessment_components*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "component-knowledge",
              code: "knowledge",
              name: "Pengetahuan",
              display_order: 1,
              is_active: true,
            },
            {
              id: "component-skills",
              code: "skills",
              name: "Keterampilan",
              display_order: 2,
              is_active: true,
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/grading_settings*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [
            {
              id: "setting-1",
              semester_id: "semester-1",
              kkm_mode: "single",
              single_kkm: 65,
            },
          ]
        : [],
    })
  })
  await page.route("**/rest/v1/subject_kkm_rules*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/grade_entries*", async (route) => {
    await route.fulfill({
      status: 200,
      json: withGradeData
        ? [1, 2, 3].flatMap((studentNumber) =>
            [
              ["outcome-1", 90],
              ["outcome-2", 70],
            ].map(([outcomeId, score], index) => ({
              id: `grade-${studentNumber}-${index + 1}`,
              student_id: `student-${studentNumber}`,
              class_id: "class-1",
              subject_id: "subject-1",
              learning_outcome_id: outcomeId,
              assessment_component_id: "component-knowledge",
              semester_id: "semester-1",
              grade_level: gradeLevel,
              score,
              created_at: "2026-09-02T00:00:00.000Z",
              updated_at: "2026-09-02T00:00:00.000Z",
            })),
          )
        : [],
    })
  })
  await page.route("**/rest/v1/report_descriptions*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/attendance*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/extracurriculars*", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 201,
        json: {
          id: "extra-1",
          school_id: "school-1",
          name: "Pramuka",
          is_active: true,
          created_at: "2026-09-03T00:00:00.000Z",
          updated_at: "2026-09-03T00:00:00.000Z",
        },
      })
      return
    }
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/student_extracurriculars*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/achievements*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route("**/rest/v1/homeroom_notes*", async (route) => {
    await route.fulfill({ status: 200, json: [] })
  })
  await page.route(
    "**/rest/v1/report_completion_confirmations*",
    async (route) => {
      await route.fulfill({ status: 200, json: [] })
    },
  )
  await page.route("**/rest/v1/public_school_identity*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          school_name: "SD Negeri Tumbang Kawei",
          logo_url: null,
        },
      ],
    })
  })

  await page.addInitScript(
    ({ projectRef, user }) => {
      const session = {
        access_token: "e2e-access-token",
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "e2e-refresh-token",
        user,
      }

      window.localStorage.setItem(
        `sb-${projectRef}-auth-token`,
        JSON.stringify(session),
      )
    },
    { projectRef: projectReference, user: adminUser },
  )

  await page.goto("/")
  if (profileRole === "admin") {
    await expect(
      page.getByRole("heading", { name: "Ringkasan hari ini" }),
    ).toBeVisible()
  } else if (profileRole === "homeroom_teacher") {
    await expect(
      page.getByRole("heading", { name: "Selamat datang, Rina Wulandari" }),
    ).toBeVisible()
  } else {
    await expect(
      page.getByRole("heading", { name: "Selamat datang, Budi Santoso" }),
    ).toBeVisible()
  }
  await expect(
    page.getByText("RaporKu - SD Negeri Tumbang Kawei"),
  ).toBeVisible()
}

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const) {
  test(`Dashboard Wali Kelas nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 4, "homeroom_teacher")

    await expect(page.getByText("Kelas 4A")).toBeVisible()
    await expect(page.getByText("3")).toBeVisible()
    await expect(
      page.getByRole("heading", {
        name: "Selesaikan rapor dalam urutan yang mudah",
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Preview dan Cetak Rapor/ }).last(),
    ).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

test("Wali Kelas membuka monitoring dari menu HP", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAuthenticatedDashboard(page, true, true, 4, "homeroom_teacher")

  await page.getByRole("button", { name: "Buka menu" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Pantau Kelengkapan" })
    .click()

  await expect(
    page.getByRole("heading", { name: "Kelengkapan rapor siswa" }),
  ).toBeVisible()
})

for (const viewport of [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const) {
  test(`Dashboard Guru Mata Pelajaran nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 4, "subject_teacher")

    await expect(page.getByText("Matematika").last()).toBeVisible()
    await expect(page.getByText("Kelas 4A").last()).toBeVisible()
    await expect(
      page.getByRole("heading", {
        name: "Mulai dari tugas yang ingin dikerjakan",
      }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Input Nilai/ }).last(),
    ).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

test("Guru Mata Pelajaran membuka Input Nilai dari menu HP", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAuthenticatedDashboard(page, true, true, 4, "subject_teacher")

  await page.getByRole("button", { name: "Buka menu" }).click()
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Input Nilai" })
    .click()

  await expect(
    page.getByRole("heading", { name: "Nilai seluruh siswa" }),
  ).toBeVisible()
})

async function openSignedOutLogin(page: Page) {
  await page.route("**/rest/v1/public_school_identity*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          school_name: "SD Negeri Tumbang Kawei",
          logo_url: null,
        },
      ],
    })
  })

  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Masuk ke akun Anda" }),
  ).toBeVisible()
}

async function openSchoolSettings(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Pengaturan Sekolah" })
      .click()
  } else {
    await page.getByRole("button", { name: "Pengaturan Sekolah" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Pengaturan Sekolah" }),
  ).toBeVisible()
}

async function openAcademicPeriods(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Tahun & Semester" })
      .click()
  } else {
    await page.getByRole("button", { name: "Tahun & Semester" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Tahun Ajaran & Semester" }),
  ).toBeVisible()
}

async function openTeachers(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Guru" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Guru" }).click()
  }

  await expect(page.getByRole("heading", { name: "Data Guru" })).toBeVisible()
}

async function openClasses(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Kelas" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Kelas" }).click()
  }

  await expect(page.getByRole("heading", { name: "Data Kelas" })).toBeVisible()
}

async function openStudents(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Data Siswa" })
      .click()
  } else {
    await page.getByRole("button", { name: "Data Siswa" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Data Siswa", exact: true }),
  ).toBeVisible()
}

async function openSubjects(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Mata Pelajaran" })
      .click()
  } else {
    await page.getByRole("button", { name: "Mata Pelajaran" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Mata Pelajaran", exact: true }),
  ).toBeVisible()
}

async function openAssignments(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Penugasan Guru" })
      .click()
  } else {
    await page.getByRole("button", { name: "Penugasan Guru" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "Penugasan Guru", exact: true }),
  ).toBeVisible()
}

async function openLearningOutcomes(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "CP / Deskripsi" })
      .click()
  } else {
    await page.getByRole("button", { name: "CP / Deskripsi" }).click()
  }

  await expect(
    page.getByRole("heading", { name: "CP / Deskripsi", exact: true }),
  ).toBeVisible()
}

async function openGrades(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Input Nilai" })
      .click()
  } else {
    await page.getByRole("button", { name: "Input Nilai" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Nilai seluruh siswa" }),
  ).toBeVisible()
}

async function openAttendance(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Absensi" })
      .click()
  } else {
    await page.getByRole("button", { name: "Absensi" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Absensi seluruh siswa" }),
  ).toBeVisible()
}

async function openExtracurriculars(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Ekstrakurikuler" })
      .click()
  } else {
    await page.getByRole("button", { name: "Ekstrakurikuler" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Ekstrakurikuler siswa" }),
  ).toBeVisible()
}

async function openAchievements(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Prestasi" })
      .click()
  } else {
    await page.getByRole("button", { name: "Prestasi" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Prestasi siswa" }),
  ).toBeVisible()
}

async function openHomeroomNotes(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Catatan Wali Kelas" })
      .click()
  } else {
    await page.getByRole("button", { name: "Catatan Wali Kelas" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Catatan untuk setiap siswa" }),
  ).toBeVisible()
}

async function openReportCompleteness(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Monitoring" })
      .click()
  } else {
    await page.getByRole("button", { name: "Monitoring" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Kelengkapan rapor siswa" }),
  ).toBeVisible()
}

async function openReportPreview(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Laporan" })
      .click()
  } else {
    await page.getByRole("button", { name: "Laporan" }).click()
  }
  await expect(
    page.getByRole("heading", { name: "Preview rapor siswa" }),
  ).toBeVisible()
}

async function openLeger(page: Page, width: number) {
  if (width < 1024) {
    await page.getByRole("button", { name: "Buka menu" }).click()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Leger Kelas 1–6" })
      .click()
  } else {
    await page.getByRole("button", { name: "Leger Kelas 1–6" }).click()
  }
  await expect(
    page.getByRole("heading", {
      name: "Nilai kelas 1–6, terbaca dalam sekali lihat",
    }),
  ).toBeVisible()
}

const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
] as const

for (const viewport of [
  ...mobileViewports,
  { width: 1280, height: 900 },
] as const) {
  test(`Leger Kelas 1–3 nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 2)
    await openLeger(page, viewport.width)

    await expect(
      page.getByRole("heading", { name: "Leger Kelas 2A" }),
    ).toBeVisible()
    const legerSurface =
      viewport.width < 768
        ? page.locator("article").first()
        : page.locator("table")
    await expect(legerSurface.getByText("Matematika").first()).toBeVisible()
    await expect(legerSurface.getByText("Pengetahuan").first()).toBeVisible()
    await expect(legerSurface.getByText("Keterampilan").first()).toBeVisible()
    await expect(legerSurface.getByText("Ani").first()).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of [
  { width: 360, height: 800 },
  { width: 768, height: 1024 },
  { width: 1280, height: 900 },
] as const) {
  test(`Leger Kelas 4–6 nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 4)
    await openLeger(page, viewport.width)

    await expect(
      page.getByRole("heading", { name: "Leger Kelas 4A" }),
    ).toBeVisible()
    await expect(page.getByRole("button", { name: "Ekspor CSV" })).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Cetak leger" }),
    ).toBeVisible()

    const legerSurface =
      viewport.width < 768
        ? page.locator("article").first()
        : page.locator(".leger-table-results")
    for (const subjectName of ["Matematika", "IPAS", "PJOK"]) {
      await expect(legerSurface.getByText(subjectName).first()).toBeVisible()
    }
    await expect(legerSurface.getByText("Pengetahuan").first()).toBeVisible()
    await expect(legerSurface.getByText("Keterampilan").first()).toBeVisible()

    if (viewport.width >= 768) {
      const tableWidth = await legerSurface.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }))
      expect(tableWidth.scrollWidth).toBeGreaterThan(tableWidth.clientWidth)
    }

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
] as const) {
  test(`cetak leger dapat dibuka pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 2)
    await openLeger(page, viewport.width)
    await page.evaluate(() => {
      const testWindow = window as Window & { __printCalls?: number }
      testWindow.__printCalls = 0
      window.print = () => {
        testWindow.__printCalls = (testWindow.__printCalls ?? 0) + 1
      }
    })

    await page.getByRole("button", { name: "Cetak leger" }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __printCalls?: number }).__printCalls ?? 0,
        ),
      )
      .toBe(1)

    await page.emulateMedia({ media: "print" })
    await expect(page.locator(".leger-screen-only").first()).toBeHidden()
    await expect(page.locator(".leger-mobile-results")).toBeHidden()
    await expect(page.locator(".leger-table-results")).toBeVisible()
  })
}

test("ekspor leger mengunduh file CSV yang dapat dibuka di Excel", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openAuthenticatedDashboard(page, true, true, 2)
  await openLeger(page, 1280)

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Ekspor CSV" }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe("leger-kelas-2a.csv")
  expect(await download.failure()).toBeNull()
})

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
] as const) {
  test(`cetak leger kelas 4–6 memakai tabel A4 landscape pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true, 4)
    await openLeger(page, viewport.width)
    await page.evaluate(() => {
      const testWindow = window as Window & { __printCalls?: number }
      testWindow.__printCalls = 0
      window.print = () => {
        testWindow.__printCalls = (testWindow.__printCalls ?? 0) + 1
      }
    })

    await page.getByRole("button", { name: "Cetak leger" }).click()
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __printCalls?: number }).__printCalls ?? 0,
        ),
      )
      .toBe(1)

    await page.emulateMedia({ media: "print" })
    await expect(page.locator(".leger-mobile-results")).toBeHidden()
    await expect(
      page.locator(".leger-upper-primary .leger-table-results"),
    ).toBeVisible()
  })
}

test("ekspor leger kelas 4–6 mengunduh CSV", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openAuthenticatedDashboard(page, true, true, 4)
  await openLeger(page, 1280)

  const downloadPromise = page.waitForEvent("download")
  await page.getByRole("button", { name: "Ekspor CSV" }).click()
  const download = await downloadPromise

  expect(download.suggestedFilename()).toBe("leger-kelas-4a.csv")
  expect(await download.failure()).toBeNull()
})

for (const viewport of mobileViewports.slice(0, 2)) {
  test(`login bergambar utuh pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openSignedOutLogin(page)

    const heroImage = page.getByAltText(
      "Ilustrasi siswa sekolah dasar di halaman sekolah",
    )
    await expect(heroImage).toBeVisible()
    await expect(page.getByText("SD Negeri Tumbang Kawei").last()).toBeVisible()

    const imageRatio = await heroImage.evaluate((image: HTMLImageElement) => ({
      displayed: image.clientWidth / image.clientHeight,
      natural: image.naturalWidth / image.naturalHeight,
    }))

    expect(Math.abs(imageRatio.displayed - imageRatio.natural)).toBeLessThan(
      0.02,
    )
  })

  test(`lupa password nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openSignedOutLogin(page)

    await page.getByRole("button", { name: "Lupa password?" }).click()
    await expect(
      page.getByRole("heading", { name: "Lupa password" }),
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Kirim tautan reset" }),
    ).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of mobileViewports) {
  test(`dashboard nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByRole("button", { name: "Buka menu" })).toBeVisible()

    await page.getByRole("button", { name: "Buka menu" }).click()
    await expect(page.getByLabel("Menu Admin")).toBeVisible()
    await page
      .getByLabel("Menu Admin")
      .getByRole("button", { name: "Tutup menu" })
      .click()
    await expect(page.getByLabel("Menu Admin")).toBeHidden()
  })
}

test("dashboard nyaman pada desktop 1280px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openAuthenticatedDashboard(page)

  const layout = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(layout.scrollWidth).toBe(layout.clientWidth)
  await expect(page.getByRole("button", { name: "Buka menu" })).toBeHidden()
  await expect(
    page.getByRole("navigation", { name: "Menu utama" }),
  ).toBeVisible()
})

test("dashboard Admin menampilkan ringkasan semester aktif", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAuthenticatedDashboard(page, true, true)

  await expect(
    page.getByRole("article", { name: "Siswa Aktif" }).getByText("3"),
  ).toBeVisible()
  await expect(
    page.getByRole("article", { name: "Kelas" }).getByText("1"),
  ).toBeVisible()
  await expect(
    page.getByRole("article", { name: "Rapor Siap Cetak" }).getByText("0"),
  ).toBeVisible()
  await expect(page.getByText("3 rapor belum siap")).toBeVisible()
})

for (const viewport of [...mobileViewports, { width: 1280, height: 900 }]) {
  test(`preview rapor nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openReportPreview(page, viewport.width)

    await expect(page.getByText("Rapor Siswa", { exact: true })).toBeVisible()
    const resultLayout =
      viewport.width >= 768
        ? page.locator("table")
        : page.locator("article").filter({ hasText: "Nilai dan deskripsi" })
    await expect(resultLayout.getByText("Pengetahuan").first()).toBeVisible()
    await expect(resultLayout.getByText("Keterampilan").first()).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`cetak satu rapor dapat dibuka pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openReportPreview(page, viewport.width)
    await page.evaluate(() => {
      const testWindow = window as Window & { __printCalls?: number }
      testWindow.__printCalls = 0
      window.print = () => {
        testWindow.__printCalls = (testWindow.__printCalls ?? 0) + 1
      }
    })

    await page.getByRole("button", { name: "Cetak siswa ini" }).click()

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            (window as Window & { __printCalls?: number }).__printCalls ?? 0,
        ),
      )
      .toBe(1)
  })
}

test("cetak satu kelas menyusun semua siswa dengan satu batch data", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  const gradeRequests: Array<string> = []
  page.on("request", (request) => {
    if (request.url().includes("/rest/v1/grade_entries")) {
      gradeRequests.push(request.url())
    }
  })
  await openAuthenticatedDashboard(page, true, true)
  await openReportPreview(page, 1280)
  await page.evaluate(() => {
    const testWindow = window as Window & {
      __printedStudentCount?: number
      __printCalls?: number
    }
    testWindow.__printCalls = 0
    window.print = () => {
      testWindow.__printCalls = (testWindow.__printCalls ?? 0) + 1
      testWindow.__printedStudentCount = document.querySelectorAll(
        ".report-batch-student",
      ).length
    }
  })

  await page.getByRole("button", { name: "Cetak satu kelas (3)" }).click()

  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __printedStudentCount?: number })
            .__printedStudentCount ?? 0,
      ),
    )
    .toBe(3)
  expect(gradeRequests).toHaveLength(2)
  expect(decodeURIComponent(gradeRequests[1] ?? "")).toContain(
    "student_id=in.(student-1,student-2,student-3)",
  )
})

test("media cetak memakai lembar A4 dan page break", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await openAuthenticatedDashboard(page, true, true)
  await openReportPreview(page, 1280)
  await page.emulateMedia({ media: "print" })

  await expect(page.locator(".report-screen-only").first()).toBeHidden()
  await expect(page.locator(".report-mobile-results")).toBeHidden()
  await expect(page.locator(".report-table-results")).toBeVisible()

  const printLayout = await page
    .locator(".report-sheet")
    .first()
    .evaluate((element) => {
      const style = getComputedStyle(element)
      return {
        breakAfter: style.breakAfter,
        minHeight: Number.parseFloat(style.minHeight),
        shadow: style.boxShadow,
      }
    })
  expect(printLayout.breakAfter).toBe("page")
  expect(printLayout.minHeight).toBeGreaterThan(1000)
  expect(printLayout.shadow).toBe("none")
})

test("sidebar dashboard dapat digulir pada layar pendek", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 640 })
  await openAuthenticatedDashboard(page)

  const navigation = page.getByRole("navigation", { name: "Menu utama" })
  const dimensions = await navigation.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }))

  expect(dimensions.scrollHeight).toBeGreaterThan(dimensions.clientHeight)

  const scrollTop = await navigation.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    return element.scrollTop
  })

  expect(scrollTop).toBeGreaterThan(0)
  await expect(page.getByRole("button", { name: "Keluar" })).toBeVisible()
})

const settingsViewports = [
  ...mobileViewports,
  { width: 1280, height: 900 },
] as const

for (const viewport of settingsViewports) {
  test(`pengaturan sekolah nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openSchoolSettings(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel(/Nama sekolah/)).toBeVisible()
    await expect(page.getByLabel("Nama kepala sekolah")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Simpan pengaturan" }),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Guru nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openTeachers(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari guru")).toBeVisible()
    await expect(page.getByText("Belum ada data guru")).toBeVisible()

    await page.getByRole("button", { name: "Tambah Guru" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Lengkap/)).toBeVisible()
    await expect(page.getByLabel(/Peran Utama/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Kelas nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true)
    await openClasses(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari kelas")).toBeVisible()
    await expect(page.getByText("Belum ada data kelas")).toBeVisible()

    await page.getByRole("button", { name: "Tambah Kelas" }).click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Tingkat Kelas/)).toBeVisible()
    await expect(page.getByLabel(/Nama Rombel/)).toBeVisible()
    await expect(page.getByText(/lower_primary/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Data Siswa nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true)
    await openStudents(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari siswa")).toBeVisible()
    await expect(page.getByLabel("Filter kelas")).toBeVisible()
    await expect(page.getByText("Belum ada data siswa")).toBeVisible()

    await page.getByRole("button", { name: "Import Excel" }).click()
    await expect(
      page.getByRole("heading", { name: "Import Siswa dari Excel" }),
    ).toBeVisible()
    await expect(page.getByLabel("Pilih file Excel siswa")).toBeAttached()

    const importLayout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(importLayout.scrollWidth).toBe(importLayout.clientWidth)

    await page.getByRole("button", { name: "Kembali ke Data Siswa" }).click()

    await page.getByRole("button", { name: "Tambah Siswa" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Lengkap/)).toBeVisible()
    await expect(page.getByLabel(/Kelas Semester Aktif/)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Mata Pelajaran nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openSubjects(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari mata pelajaran")).toBeVisible()
    await expect(page.getByLabel("Filter jenis mata pelajaran")).toBeVisible()
    await expect(page.getByText("Belum ada mata pelajaran")).toBeVisible()

    await page
      .getByRole("button", { name: "Tambah Mata Pelajaran" })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel(/Nama Mata Pelajaran/)).toBeVisible()
    await expect(page.getByLabel(/Kelompok Agama Siswa/)).toBeVisible()
    await expect(
      page.getByLabel(/Ini mata pelajaran muatan lokal/),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Penugasan Guru nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openAssignments(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari penugasan")).toBeVisible()
    await expect(page.getByLabel("Filter kelas")).toBeVisible()
    await expect(page.getByText("Belum ada penugasan")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Tambah Penugasan" }),
    ).toBeDisabled()
  })
}

for (const viewport of settingsViewports) {
  test(`CP dan Deskripsi nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openLearningOutcomes(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Cari CP")).toBeVisible()
    await expect(page.getByLabel("Filter mata pelajaran")).toBeVisible()
    await expect(page.getByText("Belum ada CP")).toBeVisible()
    await expect(page.getByText(/tidak mengarang rumus nilai/i)).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Input Nilai nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openGrades(page, viewport.width)

    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Ani"]:visible',
      ),
    ).toBeVisible()
    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Budi"]:visible',
      ),
    ).toBeVisible()
    await expect(
      page.locator(
        'input[aria-label="Pengetahuan Bilangan dasar Citra"]:visible',
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "Keterampilan" }).click()
    await expect(
      page.locator(
        'input[aria-label="Keterampilan Bilangan dasar Ani"]:visible',
      ),
    ).toBeVisible()
    await page.getByRole("button", { name: "Pengetahuan" }).click()
    await expect(page.getByText("A: 89–100")).toBeVisible()
    await expect(page.getByText("B: 77–88")).toBeVisible()

    await page.locator("button:visible", { hasText: "Buat" }).first().click()
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(page.getByLabel("Deskripsi final")).toHaveValue(
      /perlu meningkatkan/,
    )

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

test("Admin mengganti mapel agama siswa tanpa mengubah biodata", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await openAuthenticatedDashboard(page, true, true)

  await page.route("**/rest/v1/students*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: "student-1",
          full_name: "Ani",
          nis: "1001",
          nisn: null,
          gender: "female",
          birth_place: null,
          birth_date: null,
          religion: "Katolik",
          address: null,
          father_name: null,
          mother_name: null,
          guardian_name: null,
          is_active: true,
          created_at: "2026-09-02T00:00:00.000Z",
          updated_at: "2026-09-02T00:00:00.000Z",
        },
      ],
    })
  })
  await page.route("**/rest/v1/subjects*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: "subject-1",
          name: "Pendidikan Agama Katolik",
          code: "PAKAT",
          religion_scope: "catholic",
          is_local_content: false,
          display_order: 1,
          is_active: true,
          created_at: "2026-09-02T00:00:00.000Z",
          updated_at: "2026-09-02T00:00:00.000Z",
        },
        {
          id: "subject-2",
          name: "Pendidikan Agama Kristen Protestan",
          code: "PAKRIS",
          religion_scope: "christian",
          is_local_content: false,
          display_order: 2,
          is_active: true,
          created_at: "2026-09-02T00:00:00.000Z",
          updated_at: "2026-09-02T00:00:00.000Z",
        },
      ],
    })
  })
  await page.route("**/rest/v1/teacher_assignments*", async (route) => {
    await route.fulfill({
      status: 200,
      json: ["subject-1", "subject-2"].map((subjectId, index) => ({
        id: `assignment-${index + 1}`,
        teacher_id: "teacher-1",
        class_id: "class-1",
        subject_id: subjectId,
        academic_year_id: "year-1",
        semester_id: "semester-1",
        is_active: true,
        created_at: "2026-09-02T00:00:00.000Z",
        updated_at: "2026-09-02T00:00:00.000Z",
      })),
    })
  })
  await page.route("**/rest/v1/learning_outcomes*", async (route) => {
    await route.fulfill({
      status: 200,
      json: [
        {
          id: "outcome-catholic",
          subject_id: "subject-1",
          grade_level: 2,
          semester_id: "semester-1",
          code: "CP-KAT",
          title: "CP Katolik",
          description: "CP Pendidikan Agama Katolik.",
          is_active: true,
          created_at: "2026-09-02T00:00:00.000Z",
          updated_at: "2026-09-02T00:00:00.000Z",
        },
        {
          id: "outcome-christian",
          subject_id: "subject-2",
          grade_level: 2,
          semester_id: "semester-1",
          code: "CP-PRO",
          title: "CP Protestan",
          description: "CP Pendidikan Agama Kristen Protestan.",
          is_active: true,
          created_at: "2026-09-02T00:00:00.000Z",
          updated_at: "2026-09-02T00:00:00.000Z",
        },
      ],
    })
  })
  await page.route(
    "**/rest/v1/student_religion_subject_overrides*",
    async (route) => {
      if (route.request().method() === "POST") {
        const body = route.request().postDataJSON()
        await route.fulfill({
          status: 201,
          json: {
            id: "override-1",
            ...body,
            created_at: "2026-10-26T00:00:00.000Z",
            updated_at: "2026-10-26T00:00:00.000Z",
          },
        })
        return
      }
      await route.fulfill({ status: 200, json: [] })
    },
  )

  await openGrades(page, 390)
  await page.getByText("Atur siswa mapel agama").click()
  await expect(page.getByText("Biodata: Katolik")).toBeVisible()
  await page.getByLabel("Mapel agama Ani").selectOption("subject-2")
  await expect(
    page.getByText(/CP dan deskripsi mengikuti mapel pilihan/),
  ).toBeVisible()

  await page.getByLabel("Mata pelajaran").selectOption("subject-2")
  await expect(
    page.locator('input[aria-label="Pengetahuan CP Protestan Ani"]:visible'),
  ).toBeVisible()
})

for (const gradeLevel of [4, 5, 6]) {
  test(`Input Nilai kelas ${gradeLevel} memuat seluruh siswa dan dua komponen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await openAuthenticatedDashboard(page, true, true, gradeLevel)
    await openGrades(page, 1280)

    await expect(page.getByLabel("Kelas")).toHaveValue("class-1")
    await expect(
      page.getByRole("option", {
        name: `Kelas ${gradeLevel}A · Kelas ${gradeLevel}`,
      }),
    ).toBeAttached()

    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(
          `input[aria-label="Pengetahuan Bilangan dasar ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }

    await page.getByRole("button", { name: "Keterampilan" }).click()
    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(
          `input[aria-label="Keterampilan Bilangan dasar ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }
  })
}

for (const viewport of settingsViewports) {
  test(`Absensi nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openAttendance(page, viewport.width)

    for (const studentName of ["Ani", "Budi", "Citra"]) {
      await expect(
        page.locator(`input[aria-label="Sakit ${studentName}"]:visible`),
      ).toBeVisible()
      await expect(
        page.locator(`input[aria-label="Izin ${studentName}"]:visible`),
      ).toBeVisible()
      await expect(
        page.locator(
          `input[aria-label="Tanpa keterangan ${studentName}"]:visible`,
        ),
      ).toBeVisible()
    }

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(
      page.getByRole("button", { name: "Simpan Absensi" }),
    ).toBeVisible()
  })
}

for (const viewport of settingsViewports) {
  test(`Ekstrakurikuler nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openExtracurriculars(page, viewport.width)

    await page.getByLabel("Nama ekstrakurikuler").fill("Pramuka")
    await page.getByRole("button", { name: "Tambah" }).click()
    await expect(page.getByLabel("Pilih ekstrakurikuler")).toHaveValue(
      "extra-1",
    )
    await page.getByRole("checkbox", { name: /Ani/ }).check()
    await expect(page.getByLabel("Predikat Ani")).toBeVisible()
    await expect(page.getByLabel("Deskripsi Ani")).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of settingsViewports) {
  test(`Prestasi nyaman pada ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openAchievements(page, viewport.width)

    await expect(page.getByLabel("Siswa")).toBeVisible()
    await expect(page.getByLabel("Jenis prestasi")).toBeVisible()
    await expect(page.getByLabel("Tingkat prestasi")).toBeVisible()
    await expect(page.getByLabel("Tahun prestasi")).toBeVisible()
    await expect(page.getByLabel("Tanggal prestasi")).toBeVisible()
    await expect(page.getByLabel("Keterangan prestasi")).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of settingsViewports) {
  test(`Catatan Wali Kelas nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openHomeroomNotes(page, viewport.width)

    const note = page.getByLabel("Catatan Ani")
    await expect(note).toBeVisible()
    await expect(note).toHaveAttribute("maxlength", "500")
    await note.fill("Pertahankan semangat belajar dan sikap baikmu.")
    await expect(page.getByText("Pratinjau di rapor").first()).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of settingsViewports) {
  test(`Kelengkapan Rapor nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page, true, true)
    await openReportCompleteness(page, viewport.width)

    await expect(page.getByText("Ani", { exact: true })).toBeVisible()
    await expect(page.getByLabel("Memang tidak ada prestasi Ani")).toBeVisible()
    await expect(
      page.getByLabel("Memang tidak ada ekstrakurikuler Ani"),
    ).toBeVisible()

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(layout.scrollWidth).toBe(layout.clientWidth)
  })
}

for (const viewport of settingsViewports) {
  test(`tahun ajaran dan semester nyaman pada ${viewport.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport)
    await openAuthenticatedDashboard(page)
    await openAcademicPeriods(page, viewport.width)

    const layout = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(layout.scrollWidth).toBe(layout.clientWidth)
    await expect(page.getByLabel("Nama tahun ajaran")).toBeVisible()
    await expect(page.getByText("Belum ada tahun ajaran")).toBeVisible()
    await expect(page.getByRole("button", { name: "Tambah" })).toBeVisible()
  })
}
