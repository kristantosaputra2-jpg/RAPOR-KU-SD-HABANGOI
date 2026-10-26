import type { ReportViewModel } from "./report-view-model"

type Props = Readonly<{ report: ReportViewModel }>

function componentAverage(
  subject: ReportViewModel["subjects"][number],
  componentName: string,
) {
  return (
    subject.components.find(
      (component) => component.componentName.toLowerCase() === componentName,
    )?.average ?? null
  )
}

function GradeBar({
  label,
  value,
  variant,
}: Readonly<{
  label: string
  value: number | null
  variant: "knowledge" | "skills"
}>) {
  return (
    <div className="report-chart-measure">
      <span className="report-chart-measure-label">{label}</span>
      <div className="report-chart-track" aria-hidden="true">
        {value === null ? null : (
          <span
            className={`report-chart-bar report-chart-bar--${variant}`}
            style={{ width: `${value}%` }}
          />
        )}
      </div>
      <strong>{value ?? "-"}</strong>
    </div>
  )
}

export function ReportSummaryChart({ report }: Props) {
  return (
    <article
      className="report-sheet report-chart-sheet"
      aria-label="Grafik ringkasan hasil belajar"
    >
      <header className="report-chart-header">
        <div>
          <p>LAMPIRAN RAPOR PESERTA DIDIK</p>
          <h2>Grafik Ringkasan Hasil Belajar</h2>
          <span>{report.school.name}</span>
        </div>
        <strong>TA {report.academicPeriod.academicYear}</strong>
      </header>

      <dl className="report-chart-identity">
        <div>
          <dt>Nama Peserta Didik</dt>
          <dd>{report.student.name}</dd>
        </div>
        <div>
          <dt>NIS / NISN</dt>
          <dd>
            {report.student.nis} / {report.student.nisn ?? "-"}
          </dd>
        </div>
        <div>
          <dt>Kelas</dt>
          <dd>{report.academicPeriod.className}</dd>
        </div>
        <div>
          <dt>Semester</dt>
          <dd>{report.academicPeriod.semester}</dd>
        </div>
      </dl>

      <section className="report-chart-card">
        <div className="report-chart-card-header">
          <div>
            <h3>Capaian Nilai per Mata Pelajaran</h3>
            <p>Nilai Pengetahuan dan Keterampilan ditampilkan terpisah.</p>
          </div>
          <div className="report-chart-legend" aria-label="Keterangan grafik">
            <span>
              <i className="report-chart-key report-chart-key--knowledge" />
              Pengetahuan
            </span>
            <span>
              <i className="report-chart-key report-chart-key--skills" />
              Keterampilan
            </span>
          </div>
        </div>

        {report.subjects.length ? (
          <div className="report-chart-subjects">
            {report.subjects.map((subject) => (
              <div className="report-chart-subject" key={subject.subjectId}>
                <h4>{subject.subjectName}</h4>
                <GradeBar
                  label="P"
                  value={componentAverage(subject, "pengetahuan")}
                  variant="knowledge"
                />
                <GradeBar
                  label="K"
                  value={componentAverage(subject, "keterampilan")}
                  variant="skills"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="report-chart-empty">
            Nilai mata pelajaran belum tersedia.
          </p>
        )}
      </section>

      <footer className="report-chart-footer">
        <span>Skala nilai 0–100</span>
        <span>Grafik ini merupakan ringkasan dari nilai pada rapor utama.</span>
      </footer>
    </article>
  )
}
