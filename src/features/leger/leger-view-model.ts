import {
  REPORT_STATUS_LABELS,
  type ReportStatus,
} from "@/features/report-status/report-completeness"
import type { StudentReportCompleteness } from "@/features/report-status/report-completeness.service"
import type { ReportViewModel } from "@/features/reports/report-view-model"

export type LegerComponentValue = Readonly<{
  componentId: string
  componentName: string
  average: number | null
  predicate: string | null
  description: string | null
}>

export type LegerRow = Readonly<{
  studentId: string
  studentName: string
  nis: string
  subjects: ReadonlyArray<
    Readonly<{
      subjectId: string
      subjectName: string
      components: ReadonlyArray<LegerComponentValue>
    }>
  >
  status: ReportStatus
  statusLabel: string
  achievementSummary: ReadonlyArray<string>
}>

export type LegerViewModel = Readonly<{
  templateGroup: "lower_primary" | "upper_primary"
  schoolName: string
  className: string
  academicYear: string
  semester: string
  subjectColumns: ReadonlyArray<
    Readonly<{
      subjectId: string
      subjectName: string
      components: ReadonlyArray<
        Readonly<{ componentId: string; componentName: string }>
      >
    }>
  >
  rows: ReadonlyArray<LegerRow>
}>

export type LowerPrimaryLegerRow = LegerRow
export type LowerPrimaryLegerViewModel = LegerViewModel
export type UpperPrimaryLegerViewModel = LegerViewModel

export class LegerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "LegerError"
  }
}

export const LowerPrimaryLegerError = LegerError

function buildLegerViewModel(
  reports: ReadonlyArray<ReportViewModel>,
  completeness: ReadonlyArray<StudentReportCompleteness>,
  templateGroup: "lower_primary" | "upper_primary",
): LegerViewModel {
  const firstReport = reports[0]
  if (!firstReport) {
    throw new LegerError("Belum ada siswa untuk ditampilkan di leger.")
  }
  if (reports.some((report) => report.templateGroup !== templateGroup)) {
    throw new LegerError(
      templateGroup === "lower_primary"
        ? "Leger ini hanya digunakan untuk kelas 1 sampai 3."
        : "Leger ini hanya digunakan untuk kelas 4 sampai 6.",
    )
  }

  const subjectColumns = Array.from(
    new Map(
      reports.flatMap((report) =>
        report.subjects.map((subject) => [subject.subjectId, subject] as const),
      ),
    ).values(),
    (subject) => ({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      components: subject.components.map((component) => ({
        componentId: component.componentId,
        componentName: component.componentName,
      })),
    }),
  )
  const completenessByStudent = new Map(
    completeness.map((item) => [item.studentId, item]),
  )

  return {
    templateGroup,
    schoolName: firstReport.school.name,
    className: firstReport.academicPeriod.className,
    academicYear: firstReport.academicPeriod.academicYear,
    semester: firstReport.academicPeriod.semester,
    subjectColumns,
    rows: reports.map((report) => {
      const status =
        completenessByStudent.get(report.student.id)?.status ?? "not_started"
      return {
        studentId: report.student.id,
        studentName: report.student.name,
        nis: report.student.nis,
        subjects: report.subjects.map((subject) => ({
          subjectId: subject.subjectId,
          subjectName: subject.subjectName,
          components: subject.components.map((component) => ({
            componentId: component.componentId,
            componentName: component.componentName,
            average: component.average,
            predicate: component.predicate,
            description: component.description,
          })),
        })),
        status,
        statusLabel: REPORT_STATUS_LABELS[status],
        achievementSummary: report.subjects.flatMap((subject) =>
          subject.components.flatMap((component) =>
            component.description
              ? [
                  `${subject.subjectName} — ${component.componentName}: ${component.description}`,
                ]
              : [],
          ),
        ),
      }
    }),
  }
}

export function buildLowerPrimaryLegerViewModel(
  reports: ReadonlyArray<ReportViewModel>,
  completeness: ReadonlyArray<StudentReportCompleteness>,
): LowerPrimaryLegerViewModel {
  return buildLegerViewModel(reports, completeness, "lower_primary")
}

export function buildUpperPrimaryLegerViewModel(
  reports: ReadonlyArray<ReportViewModel>,
  completeness: ReadonlyArray<StudentReportCompleteness>,
): UpperPrimaryLegerViewModel {
  return buildLegerViewModel(reports, completeness, "upper_primary")
}
