import type { ReactNode } from "react"

import type { ReportViewModel } from "./report-view-model"
import { ReportSummaryChart } from "./report-summary-chart"

type Props = Readonly<{ report: ReportViewModel }>

function Value({ children }: Readonly<{ children: string | number | null }>) {
  return children === null || children === "" ? <>-</> : <>{children}</>
}

function FormalTitle({ children }: Readonly<{ children: ReactNode }>) {
  return <h2 className="report-formal-title">{children}</h2>
}

function SchoolHeader({ report }: Props) {
  return (
    <header className="report-school-header">
      <img
        src="/images/tut-wuri-handayani-official.png"
        alt="Logo Tut Wuri Handayani"
      />
      <div>
        <p className="report-school-name">{report.school.name}</p>
        <p>
          <Value>{report.school.address}</Value>
        </p>
        <p>
          NPSN: <Value>{report.school.npsn}</Value>
        </p>
      </div>
    </header>
  )
}

function IdentityRow({
  label,
  value,
}: Readonly<{ label: string; value: string | null }>) {
  return (
    <div className="report-identity-row">
      <dt>{label}</dt>
      <span>:</span>
      <dd>
        <Value>{value}</Value>
      </dd>
    </div>
  )
}

function FamilyRows({ report }: Props) {
  const members = [
    ["Ayah", report.student.father],
    ["Ibu", report.student.mother],
    ["Wali", report.student.guardian],
  ] as const
  return (
    <>
      {members.map(([label, member]) => (
        <section className="report-family-section" key={label}>
          <h3>{label}</h3>
          <IdentityRow label="Nama" value={member.name} />
          <IdentityRow label="Pendidikan" value={member.education} />
          <IdentityRow label="Pekerjaan" value={member.occupation} />
          <IdentityRow label="Alamat" value={member.address} />
          <IdentityRow label="Nomor telepon" value={member.phone} />
        </section>
      ))}
    </>
  )
}

function Signature({
  role,
  name,
  nip,
}: Readonly<{ role: string; name: string | null; nip?: string | null }>) {
  return (
    <div className="report-signature">
      <p>{role}</p>
      <div className="report-signature-space" />
      <p className="report-signature-name">
        {name ?? "...................................."}
      </p>
      {nip !== undefined ? (
        <p>
          NIP. <Value>{nip}</Value>
        </p>
      ) : null}
    </div>
  )
}

export function ReportPreviewTemplate({ report }: Props) {
  return (
    <div className="report-document" data-template-group={report.templateGroup}>
      <article className="report-sheet report-cover-sheet">
        <div className="report-cover-content">
          <h1
            className="report-cover-headline"
            aria-label="Laporan Hasil Capaian Kompetensi Peserta Didik Sekolah Dasar"
          >
            <span>LAPORAN</span>
            <span>HASIL CAPAIAN KOMPETENSI PESERTA DIDIK</span>
            <span>SEKOLAH DASAR</span>
          </h1>
          <img
            className="report-tut-wuri-logo"
            src="/images/tut-wuri-handayani-official.png"
            alt="Logo Tut Wuri Handayani"
          />
          <dl className="report-cover-student">
            <dt>Nama Peserta Didik</dt>
            <dd>{report.student.name}</dd>
            <dt>NIS / NISN</dt>
            <dd>
              {report.student.nis} / <Value>{report.student.nisn}</Value>
            </dd>
          </dl>
          <div className="report-cover-school">
            <p>{report.school.name}</p>
            <span>
              <Value>{report.school.address}</Value>
            </span>
          </div>
          <div className="report-cover-ministry">
            <p>KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</p>
            <p>REPUBLIK INDONESIA</p>
          </div>
        </div>
      </article>

      <article className="report-sheet report-identity-sheet">
        <FormalTitle>IDENTITAS PESERTA DIDIK</FormalTitle>
        <dl className="report-identity-list">
          <IdentityRow label="Nama Peserta Didik" value={report.student.name} />
          <IdentityRow
            label="NIS / NISN"
            value={`${report.student.nis} / ${report.student.nisn ?? "-"}`}
          />
          <IdentityRow
            label="Tempat, Tanggal Lahir"
            value={report.student.birth}
          />
          <IdentityRow label="Jenis Kelamin" value={report.student.gender} />
          <IdentityRow label="Agama" value={report.student.religion} />
          <IdentityRow
            label="Alamat Peserta Didik"
            value={report.student.address}
          />
          <IdentityRow label="Nomor Telepon" value={report.student.phone} />
          <FamilyRows report={report} />
        </dl>
        <div className="report-identity-approval">
          <div
            className="report-photo-frame"
            aria-label="Foto siswa ukuran 3 kali 4"
          >
            {report.student.photoUrl ? (
              <img
                src={report.student.photoUrl}
                alt={`Foto ${report.student.name}`}
              />
            ) : (
              <span>
                Foto
                <br />3 × 4
              </span>
            )}
          </div>
          <Signature
            role="Kepala Sekolah"
            name={report.school.principalName}
            nip={report.school.principalNip}
          />
        </div>
      </article>

      <article className="report-sheet report-results-sheet">
        <SchoolHeader report={report} />
        <FormalTitle>RAPOR DAN PROFIL PESERTA DIDIK</FormalTitle>
        <dl className="report-profile-grid">
          <IdentityRow label="Nama Peserta Didik" value={report.student.name} />
          <IdentityRow label="Kelas" value={report.academicPeriod.className} />
          <IdentityRow
            label="NIS / NISN"
            value={`${report.student.nis} / ${report.student.nisn ?? "-"}`}
          />
          <IdentityRow
            label="Semester"
            value={report.academicPeriod.semester}
          />
          <IdentityRow
            label="Tahun Pelajaran"
            value={report.academicPeriod.academicYear}
          />
          <IdentityRow label="Kelompok Rapor" value={report.templateLabel} />
        </dl>
        <h3 className="report-section-heading">
          A. Kompetensi Pengetahuan dan Keterampilan
        </h3>
        {report.subjects.length === 0 ? (
          <p className="report-empty">
            Mata pelajaran yang ditugaskan belum tersedia.
          </p>
        ) : (
          <div className="report-results-scroll">
            <table className="report-results-table">
              <thead>
                <tr>
                  <th rowSpan={2}>No.</th>
                  <th rowSpan={2}>Mata Pelajaran</th>
                  <th rowSpan={2}>KKM</th>
                  <th colSpan={3}>Pengetahuan</th>
                  <th colSpan={3}>Keterampilan</th>
                </tr>
                <tr>
                  <th>Nilai</th>
                  <th>Predikat</th>
                  <th>Deskripsi</th>
                  <th>Nilai</th>
                  <th>Predikat</th>
                  <th>Deskripsi</th>
                </tr>
              </thead>
              <tbody>
                {report.subjects.map((subject, index) => {
                  const knowledge = subject.components.find(
                    (item) =>
                      item.componentName.toLowerCase() === "pengetahuan",
                  )
                  const skills = subject.components.find(
                    (item) =>
                      item.componentName.toLowerCase() === "keterampilan",
                  )
                  return (
                    <tr key={subject.subjectId}>
                      <td>{index + 1}</td>
                      <td className="report-subject-name">
                        {subject.subjectName}
                      </td>
                      <td>
                        <Value>{subject.kkm}</Value>
                      </td>
                      <td>
                        <Value>{knowledge?.average ?? null}</Value>
                      </td>
                      <td>
                        <Value>{knowledge?.predicate ?? null}</Value>
                      </td>
                      <td className="report-description">
                        <Value>{knowledge?.description ?? null}</Value>
                      </td>
                      <td>
                        <Value>{skills?.average ?? null}</Value>
                      </td>
                      <td>
                        <Value>{skills?.predicate ?? null}</Value>
                      </td>
                      <td className="report-description">
                        <Value>{skills?.description ?? null}</Value>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </article>

      <article className="report-sheet report-summary-sheet">
        <SchoolHeader report={report} />
        <h3 className="report-section-heading">B. Ekstrakurikuler</h3>
        <table className="report-simple-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Kegiatan</th>
              <th>Predikat</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {report.extracurriculars.length ? (
              report.extracurriculars.map((item, index) => (
                <tr key={`${item.name}:${index}`}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.achievement}</td>
                  <td>{item.description}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td>1</td>
                <td colSpan={3}>-</td>
              </tr>
            )}
          </tbody>
        </table>
        <h3 className="report-section-heading">C. Saran-saran</h3>
        <div className="report-note">
          <Value>{report.homeroomNote}</Value>
        </div>
        <h3 className="report-section-heading">D. Prestasi</h3>
        <table className="report-simple-table">
          <thead>
            <tr>
              <th>No.</th>
              <th>Jenis Prestasi</th>
              <th>Tingkat</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {report.achievements.length ? (
              report.achievements.map((item, index) => (
                <tr key={`${item.type}:${index}`}>
                  <td>{index + 1}</td>
                  <td>{item.type}</td>
                  <td>{item.level}</td>
                  <td>
                    {item.description} ({item.year})
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td>1</td>
                <td colSpan={3}>-</td>
              </tr>
            )}
          </tbody>
        </table>
        <h3 className="report-section-heading">E. Ketidakhadiran</h3>
        <table className="report-attendance-table">
          <tbody>
            <tr>
              <th>Sakit</th>
              <td>
                <Value>{report.attendance.sickDays}</Value> hari
              </td>
            </tr>
            <tr>
              <th>Izin</th>
              <td>
                <Value>{report.attendance.permittedDays}</Value> hari
              </td>
            </tr>
            <tr>
              <th>Tanpa Keterangan</th>
              <td>
                <Value>{report.attendance.absentDays}</Value> hari
              </td>
            </tr>
          </tbody>
        </table>
        <div className="report-signatures-grid">
          <Signature role="Orang Tua / Wali" name={null} />
          <Signature
            role="Wali Kelas"
            name={report.homeroomTeacher.name}
            nip={report.homeroomTeacher.nip}
          />
          <Signature
            role="Mengetahui, Kepala Sekolah"
            name={report.school.principalName}
            nip={report.school.principalNip}
          />
        </div>
      </article>
      <ReportSummaryChart report={report} />
    </div>
  )
}
