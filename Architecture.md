# Architecture.md — Aplikasi Rapor SD Kelas 1–6

**Versi:** 0.1  
**Status:** Arsitektur Sistem Awal  
**Acuan utama:** `prd_rapor_sd_kelas_1-6_v0.4.md` dan `AGENTS.md`

---

# 1. Tujuan Dokumen

Dokumen ini menjelaskan arsitektur teknis aplikasi Rapor SD Kelas 1–6 agar developer manusia maupun AI agent memahami bagaimana sistem harus dibangun, bagaimana komponen saling berhubungan, dan batas tanggung jawab tiap layer.

Dokumen ini tidak menggantikan PRD.

Urutan acuan:

1. Requirement terbaru yang disetujui user
2. PRD terbaru
3. `AGENTS.md`
4. `Architecture.md`
5. Implementasi yang ada

---

# 2. Tujuan Arsitektur

Arsitektur harus mendukung:

- penggunaan dari HP dan laptop;
- koneksi internet yang tidak selalu stabil;
- satu sekolah per deployment;
- data sekolah yang terisolasi;
- role Admin, Wali Kelas, Guru Mapel;
- kelas 1–3 dan 4–6 dalam satu aplikasi;
- aturan penilaian yang dapat berbeda antar kelompok kelas;
- perubahan format rapor tanpa membangun ulang seluruh aplikasi;
- input nilai seluruh siswa dalam satu layar;
- CP/deskripsi otomatis tetapi editable;
- leger otomatis;
- import siswa Excel;
- print/PDF rapor;
- keamanan berbasis Supabase Auth + RLS.

---

# 3. Non-Goals MVP

Arsitektur awal tidak ditujukan untuk:

- multi-school SaaS dalam satu database;
- integrasi Dapodik;
- aplikasi Android native;
- full offline-first;
- portal orang tua;
- portal siswa;
- WhatsApp automation;
- LMS;
- payment;
- AI chatbot umum;
- analytics skala besar;
- event-driven microservices;
- distributed system kompleks.

MVP harus tetap sederhana.

---

# 4. Model Deployment

Model:

> 1 sekolah = 1 deployment = 1 Supabase project = 1 database

Setiap sekolah memiliki:

- repository GitHub;
- deployment Cloudflare;
- project Supabase;
- database;
- domain/subdomain;
- environment variables;
- konfigurasi sekolah sendiri.

Contoh konseptual:

```text
School A
├── GitHub Repo A
├── Supabase Project A
├── Cloudflare Deployment A
└── rapor.school-a.sch.id

School B
├── GitHub Repo B
├── Supabase Project B
├── Cloudflare Deployment B
└── rapor.school-b.sch.id
```

Keuntungan:

- isolasi data sederhana;
- keamanan lebih mudah;
- migrasi lebih terkontrol;
- konfigurasi sekolah tidak saling memengaruhi.

---

# 5. High-Level Architecture

```text
┌───────────────────────────────┐
│           USER                │
│ Admin / Wali / Guru Mapel     │
└───────────────┬───────────────┘
                │ HTTPS
                ▼
┌───────────────────────────────┐
│       FRONTEND WEB APP        │
│ Cloudflare Pages              │
│ Mobile-first UI               │
└───────────────┬───────────────┘
                │
                │ Supabase Client
                ▼
┌───────────────────────────────┐
│          SUPABASE             │
│ Auth                          │
│ PostgreSQL                    │
│ Row Level Security            │
│ Storage                       │
└───────────────┬───────────────┘
                │
                │ optional server-side tasks
                ▼
┌───────────────────────────────┐
│   CLOUDFLARE WORKERS          │
│ Only if needed                │
└───────────────────────────────┘
```

Cloudflare Workers tidak wajib pada tahap awal.

Gunakan hanya jika frontend tidak cukup aman atau tidak cocok untuk operasi tertentu.

---

# 6. Frontend Technology

Status:

**Final — disetujui 2 September 2026**

- React
- TypeScript
- Vite
- Tailwind CSS
- komponen UI ringan seperti shadcn/ui

Alasan:

- cocok untuk aplikasi form-heavy;
- ekosistem luas;
- ringan;
- cocok dengan Cloudflare Pages;
- mudah ditest;
- familiar untuk AI coding tools.

Arsitektur tidak boleh tergantung penuh pada framework tertentu.

---

# 7. Frontend Layer

Frontend memiliki tanggung jawab:

- render UI;
- form input;
- client validation;
- status loading;
- status save;
- responsive layout;
- navigation;
- report preview;
- user feedback.

Frontend **tidak boleh menjadi sumber utama security**.

Permission frontend hanya untuk UX.

Authorization sebenarnya harus tetap ada di database melalui RLS.

---

# 8. Application Layer

Application layer bertanggung jawab pada use case.

Contoh:

```text
createStudent
importStudents
assignTeacher
saveGrades
generateDescription
checkReportCompleteness
generateLeger
prepareReportPreview
```

Layer ini mengorkestrasi:

- business logic;
- validation;
- data access.

---

# 9. Domain / Business Logic Layer

Business logic harus dipisahkan dari UI.

Contoh module:

```text
grading
report-description
report-completeness
permissions
leger
report-view-model
```

Contoh function:

```ts
calculateFinalGrade()
calculatePredicate()
selectStrongestLearningOutcome()
selectWeakestLearningOutcome()
generateReportDescription()
calculateReportCompleteness()
buildLegerRows()
```

Business logic harus dapat diuji tanpa browser.

---

# 10. Data Access Layer

Frontend sebaiknya tidak memiliki Supabase query acak di banyak komponen.

Gunakan service layer.

Contoh:

```text
student.service.ts
teacher.service.ts
grade.service.ts
report.service.ts
leger.service.ts
```

Flow:

```text
UI
↓
Application / Feature
↓
Service
↓
Supabase
```

---

# 11. Struktur Modul Domain

Rekomendasi:

```text
features/
  auth/
  dashboard/
  schools/
  academic-years/
  semesters/
  teachers/
  classes/
  students/
  subjects/
  learning-outcomes/
  assessments/
  grades/
  attendance/
  extracurriculars/
  achievements/
  homeroom-notes/
  report-status/
  reports/
  leger/
  settings/
```

---

# 12. Lower Primary vs Upper Primary

Aplikasi memiliki satu core system.

Namun aturan rapor menggunakan dua template group:

```text
lower_primary
upper_primary
```

## lower_primary

Untuk:

- kelas 1;
- kelas 2;
- kelas 3.

Workflow cenderung lebih sederhana.

## upper_primary

Untuk:

- kelas 4;
- kelas 5;
- kelas 6.

Mendukung komponen lebih rinci.

Core domain tidak boleh diduplikasi.

Gunakan strategy/configuration pattern.

Contoh konsep:

```ts
getGradingStrategy(templateGroup)
getReportTemplate(templateGroup)
getLegerDefinition(templateGroup)
```

---

# 13. Template Strategy

Jangan membuat:

```text
ReportClass1.tsx
ReportClass2.tsx
ReportClass3.tsx
ReportClass4.tsx
ReportClass5.tsx
ReportClass6.tsx
```

jika sebagian besar logic sama.

Lebih baik:

```text
report core
+
template configuration
+
lower primary layout
+
upper primary layout
```

Tujuan:

- mengurangi duplikasi;
- memudahkan maintenance;
- format baru dapat ditambahkan.

---

# 14. Data Model Konseptual

Entitas utama:

```text
schools
users
teacher_profiles
academic_years
semesters
classes
class_members
students
subjects
teacher_assignments
learning_outcomes
assessment_components
grade_entries
report_descriptions
attendance
extracurriculars
student_extracurriculars
achievements
homeroom_notes
report_status
report_templates
```

## Implementasi Ekstrakurikuler MVP

`extracurriculars` menyimpan master kegiatan per sekolah. Penempatan dan hasil
siswa disimpan terpisah di `student_extracurriculars`, terikat pada siswa,
kelas, dan semester. Hasil terdiri dari `achievement` untuk predikat/capaian
dan `description` untuk uraian rapor.

Admin dapat mengelola master serta data siswa. Wali kelas hanya dapat membaca
dan mengubah data ekstrakurikuler kelas yang menjadi tanggung jawabnya. Kedua
tabel memakai RLS dan tidak dapat diakses pengguna anonim.

Schema final masih TBD.

## Implementasi Prestasi MVP

`achievements` menyimpan prestasi siswa per kelas dan semester. Setiap catatan
memuat jenis prestasi, tingkat prestasi, keterangan, tahun, serta tanggal
opsional. Jika tanggal diisi, tahunnya wajib sama dengan tahun prestasi.

Admin dapat mengelola prestasi semua kelas. Wali kelas hanya dapat membaca,
menambah, dan memperbarui prestasi pada kelas yang menjadi tanggung jawabnya.
Tabel memakai RLS, tidak dapat diakses pengguna anonim, dan tidak memberikan
izin hapus pada tahap ini. Penyajian prestasi di rapor dikerjakan bersama tahap
Preview Rapor agar data dan template cetak tetap terpisah.

## Implementasi Catatan Wali Kelas MVP

`homeroom_notes` menyimpan satu catatan per siswa, kelas, dan semester. Catatan
dibatasi maksimal 500 karakter pada UI, service, dan database agar tetap aman
untuk layout cetak. Guru melihat seluruh siswa dalam satu halaman, menyimpan
semua catatan dalam satu permintaan, serta memperoleh pratinjau teks rapor.

Admin dapat mengelola semua kelas. Wali kelas dibatasi oleh RLS ke kelas yang
menjadi tanggung jawabnya. Pengguna anonim tidak dapat membaca data dan izin
hapus tidak diberikan pada tahap ini.

## Implementasi Kelengkapan Rapor MVP

Status kelengkapan dihitung sebagai derived output dan tidak disimpan manual:

- `Belum Diisi`: belum ada komponen isi rapor yang selesai;
- `Sebagian`: sebagian komponen sudah selesai;
- `Lengkap`: seluruh isi selesai tetapi identitas belum lengkap;
- `Siap Cetak`: isi dan identitas seluruhnya lengkap.

Nilai dinyatakan lengkap jika seluruh CP aktif pada setiap mata pelajaran yang
ditugaskan mempunyai nilai pada seluruh komponen penilaian aktif. Deskripsi
wajib tersedia untuk setiap mata pelajaran dan komponen. Absensi, catatan wali
kelas, ekstrakurikuler, dan prestasi juga diperiksa per siswa.

Karena siswa dapat sah tidak memiliki ekstrakurikuler atau prestasi,
`report_completion_confirmations` hanya menyimpan konfirmasi eksplisit wali
kelas untuk kondisi “memang tidak ada”. Konfirmasi tersebut bukan status akhir;
mesin selalu menghitung ulang status dari data terbaru. Tabel konfirmasi memakai
RLS yang sama dengan komponen wali kelas lainnya.

## Implementasi Data Guru MVP

`teacher_profiles` menyimpan master guru secara terpisah dari akun autentikasi.

Field utama yang sudah diterapkan:

```text
id
user_id (nullable)
full_name
nip (nullable)
nuptk (nullable)
email
role
is_active
created_by / updated_by
created_at / updated_at
```

`user_id` tetap kosong sampai akun Supabase Auth benar-benar dibuat melalui alur Admin yang aman. Menambahkan guru tidak meminta atau mengarang kata sandi. Role pada master guru adalah peran utama, sedangkan akses aktual ke kelas dan mata pelajaran tetap berasal dari `teacher_assignments` pada tahap berikutnya.

## Implementasi Data Kelas MVP

`classes` menyimpan rombel per periode akademik dengan struktur:

```text
id
academic_year_id
semester_id
grade_level (1–6)
name
homeroom_teacher_id (nullable)
template_group (generated)
created_by / updated_by
created_at / updated_at
```

Relasi gabungan `semester_id + academic_year_id` mencegah semester terhubung ke tahun ajaran yang salah. `template_group` dihasilkan otomatis oleh database: kelas 1–3 menggunakan `lower_primary` dan kelas 4–6 menggunakan `upper_primary`. Wali kelas dapat dipilih dari master guru, sedangkan permission akun tetap diselesaikan melalui assignment pada tahap authorization berikutnya.

---

## Implementasi Data Siswa MVP

Identitas siswa dan penempatan kelas dipisahkan agar pergantian semester tidak menghapus riwayat.

`students` menyimpan:

```text
id
full_name
nis
nisn (nullable)
gender
birth_place / birth_date (nullable)
religion / address (nullable)
father_name / mother_name / guardian_name (nullable)
is_active
created_by / updated_by
created_at / updated_at
```

`class_members` menghubungkan `student_id` ke `class_id` dan `semester_id`. Constraint database memastikan satu siswa hanya memiliki satu kelas dalam satu semester. NIS wajib dan unik. NISN boleh kosong untuk kasus siswa yang belum memilikinya; jika diisi harus unik dan terdiri dari 10 angka.

`student_biodata` menyimpan data keluarga serta lokasi foto secara terpisah dari identitas inti siswa. Pemisahan ini memungkinkan Wali Kelas melengkapi foto 3×4, nomor telepon, serta nama, pendidikan, pekerjaan, alamat, dan nomor telepon ayah/ibu/wali tanpa memperoleh hak untuk mengubah NIS, NISN, status, atau penempatan kelas. Admin dapat mengelola seluruh biodata; Wali Kelas dibatasi RLS hanya pada siswa dalam kelas yang menjadi tanggung jawabnya. Tinggi/berat badan dan kondisi kesehatan tidak disimpan sesuai keputusan produk terbaru.

Akses baca `students` dan `class_members` untuk Wali Kelas serta Guru Mata Pelajaran mengikuti penugasan aktif. Akses tulis identitas inti siswa tetap khusus Admin.

---

## Implementasi Mata Pelajaran MVP

Master mata pelajaran disimpan sebagai konfigurasi sekolah, bukan daftar tetap di frontend maupun migration.

`subjects` menyimpan:

```text
id
name
code (nullable)
religion_scope (nullable)
is_local_content
display_order
is_active
created_by / updated_by
created_at / updated_at
```

Nama wajib unik tanpa membedakan huruf besar-kecil. Kode bersifat opsional dan, jika diisi, juga unik tanpa membedakan huruf besar-kecil. `religion_scope` bersifat opsional: `null` berlaku untuk seluruh siswa, sedangkan nilai agama membatasi mapel kepada siswa dengan agama yang cocok. `is_local_content` membedakan muatan lokal tanpa membuat tabel atau workflow terpisah, sedangkan `display_order` mengatur urutan tampilan rapor tanpa bergantung pada nama mapel.

Pengelompokan mapel agama secara default diturunkan dari `students.religion`. Admin atau Wali Kelas dapat menyimpan satu pengganti manual per siswa dan semester pada `student_religion_subject_overrides` tanpa mengubah biodata agama. Guru Mata Pelajaran dapat membaca pilihan tersebut agar daftar siswa pada mapel penugasannya tepat, tetapi tidak dapat mengubahnya. Filter yang sama digunakan pada Input Nilai, pemeriksaan kelengkapan, report view model, dan leger. Trigger database memastikan hanya mapel agama efektif siswa yang dapat menerima nilai atau deskripsi. Pengganti harus ditetapkan sebelum nilai atau deskripsi mapel agama yang bertentangan tersimpan agar data lama tidak tersembunyi.

Pada tahap ini Admin aktif dapat mengelola master mata pelajaran. Pengguna aktif yang sudah login dapat membaca mapel aktif sebagai persiapan workflow penugasan. Hubungan mapel ke kelas dan guru tetap dipisahkan ke `teacher_assignments` pada tahap berikutnya.

---

## Implementasi Penugasan Guru MVP

`teacher_assignments` menjadi sumber izin aktual Guru Mata Pelajaran dan menyimpan:

```text
id
teacher_id
class_id
subject_id
academic_year_id
semester_id
is_active
created_by / updated_by
created_at / updated_at
```

Periode pada assignment wajib sama dengan periode kelas melalui foreign key gabungan. Satu kombinasi kelas dan mata pelajaran hanya memiliki satu guru penanggung jawab; pergantian guru dilakukan dengan memperbarui assignment yang ada agar tidak menimbulkan dua sumber kebenaran.

Hanya Admin aktif yang dapat menambah, mengganti guru, atau mengubah status assignment. Guru yang memiliki `teacher_profiles.user_id` terhubung ke akun Auth hanya dapat membaca assignment aktif miliknya beserta kelas dan mata pelajaran terkait. Role tanpa assignment tidak memperoleh akses hanya karena berlabel `subject_teacher`.

---

# 15. Data Ownership

Setiap data harus mempunyai konteks yang jelas.

Contoh nilai harus terkait ke:

- student;
- class;
- subject;
- teacher assignment;
- semester;
- academic year.

Jangan menyimpan nilai tanpa scope akademik yang jelas.

---

# 16. Authentication

Authentication menggunakan Supabase Auth.

User login dengan akun yang dibuat sekolah/admin.

Minimal:

- email/password;
- session persistence;
- logout;
- protected routes.

Future option:

- magic link;
- Google login.

Tidak wajib MVP.

---

# 17. Authorization

Authorization menggunakan dua layer.

## Layer 1 — Frontend

Untuk UX.

Contoh:

- hide menu;
- disable action;
- redirect unauthorized route.

## Layer 2 — Database

Untuk security sebenarnya.

Menggunakan Supabase RLS.

RLS harus memastikan:

- guru mapel tidak dapat update mapel lain;
- wali kelas dapat menginput seluruh nilai kelas sendiri tetapi tidak dapat update kelas lain;
- anonymous tidak dapat membaca data;
- admin memiliki akses ke seluruh modul MVP.

---

# 18. Permission Model

Permission sebaiknya berdasarkan assignment, bukan hanya role.

Contoh:

Guru A adalah `subject_teacher`.

Tetapi akses aktual bergantung pada:

```text
teacher_assignments
```

yang menghubungkan:

- teacher;
- class;
- subject;
- academic year;
- semester.

---

# 19. Supabase RLS

Setiap tabel sensitif harus RLS enabled.

Contoh policy konseptual:

```text
Subject teacher can select grade entries
WHERE grade_entries.subject_id belongs to teacher assignment
AND class_id belongs to assignment
```

Jangan menggunakan:

```text
if (user.role === "teacher")
```

di frontend sebagai satu-satunya security.

---

# 20. Service Role

Supabase service role key:

- tidak boleh berada di frontend;
- tidak boleh masuk repository;
- hanya boleh digunakan di server-side trusted environment jika benar-benar diperlukan.

Untuk MVP, gunakan publishable key + RLS. Legacy anon key hanya untuk kompatibilitas proyek lama.

---

# 21. School Configuration

Identitas sekolah disimpan sebagai data.

Contoh:

```text
school_name
npsn
address
village
district
city
province
postal_code
email
principal_name
principal_nip
logo_url
```

Tidak boleh hardcoded.

---

# 22. Academic Context

Semua data nilai harus terkait dengan:

```text
academic_year
semester
class
student
subject
```

Historical data harus tetap terbaca.

Perubahan semester aktif tidak boleh menghapus data lama.

Implementasi saat ini:

- `academic_years` menyimpan riwayat tahun ajaran per sekolah;
- `semesters` menyimpan Semester 1 dan 2 per tahun ajaran;
- hanya satu tahun ajaran dan satu semester yang dapat aktif;
- aktivasi semester juga menyelaraskan tahun ajaran aktif dalam satu transaksi;
- data lama tidak memiliki aksi hapus dari frontend;
- pengguna aktif boleh membaca periode, sedangkan hanya Admin aktif yang boleh menambah atau mengubahnya melalui RLS.

---

# 23. Learning Outcome Architecture

Gunakan istilah generik:

```text
learning_outcomes
```

Jangan hardcode sistem ke K13.

Learning outcome dapat menyimpan:

```text
id
subject_id
grade_level
semester_id
code
title
description
is_active
```

Implementasi Master CP MVP saat ini menggunakan field di atas ditambah audit `created_by`, `updated_by`, `created_at`, dan `updated_at`. `code` bersifat opsional, sedangkan `title` dan `description` wajib. Relasi kelas dinyatakan melalui `grade_level` 1–6 sesuai struktur PRD, bukan terikat pada satu rombel tertentu.

Struktur tetap generik dan tidak menanam KI/KD. Admin aktif dapat mengelola seluruh CP. Guru dengan akun yang terhubung ke penugasan aktif hanya dapat membaca, menambah, dan mengubah CP yang cocok dengan mata pelajaran, jenjang kelas, serta semester penugasannya. Guru non-Admin hanya melihat CP aktif. CP dinonaktifkan, bukan dihapus, untuk menjaga riwayat.

`report_descriptions` sudah diimplementasikan setelah workflow nilai disetujui. Draft memilih CP bernilai tertinggi sebagai capaian sangat baik dan CP bernilai terendah sebagai bagian yang perlu ditingkatkan. Jika hanya satu CP yang bernilai, draft hanya menyebut capaian sangat baik. Jika terjadi nilai seri, urutan CP yang stabil menentukan pilihan agar hasil konsisten.

---

# 24. Assessment Component Architecture

Untuk mendukung perubahan kurikulum:

```text
assessment_components
```

MVP menyediakan dua data komponen awal: `knowledge` (Pengetahuan) dan `skills` (Keterampilan). Keduanya disimpan sebagai data konfigurasi, bukan kolom khusus, sehingga struktur tetap dapat mengikuti perubahan format rapor. Setiap CP aktif dinilai pada kedua komponen dan jumlah CP tidak dibatasi angka tetap.

---

# 25. Grade Architecture

Nilai mentah sebaiknya disimpan sebagai entry.

Contoh:

```text
grade_entries
```

Kemudian nilai akhir adalah hasil calculation.

Keputusan formula yang disetujui pada 3 September 2026:

- input nilai tetap berupa angka 0–100 per siswa dan CP;
- rata-rata, predikat, dan deskripsi dihitung terpisah untuk Pengetahuan dan Keterampilan;
- setiap hasil komponen merupakan rata-rata nilai CP yang terisi pada komponen tersebut;
- `grading_settings` memilih mode `single` atau `multi` per semester;
- mode `single` memakai satu KKM untuk seluruh mata pelajaran, sedangkan mode `multi` membaca KKM per mata pelajaran dari `subject_kkm_rules`;
- panjang interval predikat adalah `ceil((100 - KKM) / 3)`;
- nilai di bawah KKM mendapat D (Kurang), kemudian C (Cukup), B (Baik), dan A (Sangat Baik);
- ambang A–D dihitung saat digunakan dan tidak ditanam sebagai angka tetap.
- Admin mengelola mode KKM, nilai Single KKM, atau KKM per mata pelajaran melalui halaman Pengaturan Rapor untuk semester aktif; halaman ini hanya menjadi antarmuka bagi `grading_settings` dan `subject_kkm_rules`, bukan tempat business logic predikat.

Nilai mentah disimpan pada `grade_entries` dan dibedakan dengan `assessment_component_id`. Constraint gabungan memastikan satu siswa hanya memiliki satu nilai untuk kombinasi kelas, mapel, CP, komponen, dan semester; siswa benar-benar berada di kelas tersebut; serta CP cocok dengan mata pelajaran, jenjang kelas, dan semester. Admin dapat mengelola seluruh nilai. Wali Kelas dapat membaca dan mengubah seluruh nilai serta deskripsi untuk kelas dan semester yang menjadi tanggung jawabnya, termasuk ketika belum ada Guru Mata Pelajaran. Guru Mata Pelajaran hanya dapat mengubah nilai dan deskripsi pada kombinasi kelas, mapel, dan semester dalam assignment aktif.

UI kelas 1–6 memakai tab Pengetahuan/Keterampilan dan menampilkan seluruh CP aktif tanpa membatasi jumlahnya. Pada HP, setiap siswa menjadi kartu berisi daftar CP. Pada desktop, seluruh siswa dan CP tampil dalam matriks dengan nama siswa sticky. Rata-rata, predikat, serta deskripsi dihitung dan disimpan terpisah untuk setiap komponen. Wali Kelas menerima seluruh mapel aktif untuk kelasnya, Guru Mata Pelajaran hanya menerima pilihan yang lolos penugasan, dan Admin dapat membuka seluruh kelas serta mapel.

Hindari menyimpan terlalu banyak data derived jika bisa dihitung.

Namun derived value boleh disimpan jika:

- report generation berat;
- audit diperlukan;
- aturan harus dibekukan per semester.

Keputusan final dibuat di schema design.

---

# 26. Report Description Architecture

Deskripsi memiliki dua bagian:

```text
generated_description
final_description
```

atau mekanisme equivalent.

Tujuan:

- hasil sistem dapat disimpan;
- edit manual guru tidak hilang;
- regenerate tidak otomatis overwrite.

Implementasi menyimpan satu deskripsi per siswa, kelas, mata pelajaran, komponen penilaian, dan semester. `strongest_outcome_id` dan `weakest_outcome_id` mencatat sumber draft. Deskripsi final tetap editable; pembuatan ulang draft yang berbeda dari hasil edit guru harus melalui konfirmasi eksplisit.

---

# 27. Description Flow

```text
grades
↓
learning outcomes
↓
identify strongest/weakest
↓
generate draft
↓
teacher review
↓
manual edit
↓
final description
```

---

# 28. Report Completeness Engine

Report completeness merupakan business rule.

Contoh per siswa:

```text
identity_complete
grades_complete
descriptions_complete
attendance_complete
extracurricular_complete
achievement_checked
homeroom_note_complete
```

Status:

```text
not_started
partial
complete
ready_to_print
```

---

# 29. Leger Architecture

Leger tidak diisi manual.

Leger dibentuk dari query + transformation.

Flow:

```text
students
+
subjects
+
grades
+
descriptions
+
report config
↓
leger view model
↓
table
↓
print/export
```

Lower primary dan upper primary dapat memiliki definisi kolom berbeda.

Implementasi lower primary memakai query batch per kelas dan semester, lalu
mengubah data rapor menjadi view model khusus leger. Nilai Pengetahuan dan
Keterampilan tetap menjadi kolom terpisah, status kelengkapan menggunakan
status rapor yang sudah ada, dan ringkasan capaian hanya membaca deskripsi
final guru. Pada HP, data yang sama ditampilkan sebagai kartu per siswa agar
tidak membutuhkan horizontal scroll ekstrem.

Output lower primary memakai HTML print dengan halaman A4 landscape. Ekspor
memakai CSV UTF-8 berseparator titik koma agar ringan, gratis, dan dapat dibuka
di Excel tanpa dependency tambahan. Kolom nilai angka dan predikat tetap
dipisahkan supaya hasil dapat diolah tanpa membaca teks gabungan.

Kelas 4–6 memakai pipeline query batch dan komponen yang sama, tetapi diproses
sebagai `upper_primary`. Tabelnya mendukung banyak mata pelajaran melalui area
scroll mendatar terkontrol pada tablet/desktop dan kartu per siswa pada HP.
Nilai akhir, predikat, dan deskripsi tetap disusun per komponen Pengetahuan dan
Keterampilan; sistem tidak membuat nilai gabungan baru.

---

# 30. Report Generation Architecture

Gunakan pipeline:

```text
database data
↓
report query
↓
report view model
↓
template
↓
HTML print
↓
PDF if needed
```

Jangan gabungkan query database dan print markup dalam satu file besar.

---

# 31. Report View Model

Sebelum render, data dikonversi ke bentuk stabil.

Contoh:

```ts
type ReportViewModel = {
  school: SchoolInfo
  student: StudentInfo
  academicPeriod: AcademicPeriod
  subjects: SubjectResult[]
  attendance: AttendanceSummary
  extracurriculars: ExtracurricularResult[]
  achievements: Achievement[]
  homeroomNote?: string
}
```

Template hanya menerima view model.

---

# 32. Print Architecture

Prioritas MVP:

- browser print;
- print CSS;
- A4;
- page-break control.

PDF engine:

**Final untuk MVP**

Gunakan HTML print, print CSS, dialog cetak browser, dan pilihan `Save as PDF`
yang tersedia di Chrome. Tidak ada engine PDF server-side atau layanan berbayar
tambahan pada MVP.

Engine khusus hanya boleh diusulkan kembali jika pengujian format rapor nyata
menemukan hasil browser print yang tidak dapat diterima.

---

# 33. Excel Import Architecture

Pipeline:

```text
file upload
↓
parse locally/client
↓
column mapping
↓
validation
↓
preview
↓
confirm
↓
batch insert
```

Jangan insert langsung saat upload.

---

# 34. Excel Validation

Validasi:

- required fields;
- duplicate NIS;
- duplicate NISN;
- invalid dates;
- empty name;
- invalid gender value;
- duplicate student candidate.

Error harus per-row.

---

# 35. Transaction Strategy Import

Untuk batch import:

lebih baik:

```text
validate all
↓
confirm
↓
transaction/batch insert
```

Jika sebagian gagal, sistem harus menjelaskan row yang gagal.

Keputusan implementasi MVP:

- satu file `.xlsx` ditujukan ke satu kelas pada semester aktif;
- sheet pertama digunakan sebagai sumber data;
- maksimal 5 MB dan 500 siswa per import agar tetap ringan di HP;
- file dibaca di browser, tanpa upload file mentah ke server;
- seluruh baris divalidasi dan ditampilkan sebelum konfirmasi;
- penyimpanan siswa dan `class_members` dilakukan oleh satu fungsi database
  `SECURITY INVOKER`, sehingga seluruh batch otomatis batal bila satu insert gagal;
- fungsi hanya dapat dieksekusi role `authenticated` dan tetap memeriksa Admin aktif.

---

# 36. Mobile Architecture

Mobile bukan versi tambahan.

Mobile adalah target utama.

UI harus:

- responsive;
- minimal horizontal scroll;
- usable dengan touch;
- tidak bergantung hover;
- mempertahankan input siswa banyak.

---

# 37. Grade Entry Mobile Pattern

Desktop:

```text
table
```

Mobile:

opsi:

```text
compact table
+
horizontal grouping
+
sticky student name
+
drawer detail
```

Jangan membuat guru masuk satu siswa satu halaman kecuali memang diperlukan.

---

# 38. Low-Bandwidth Strategy

Karena target termasuk sekolah pedalaman:

- bundle kecil;
- lazy load;
- selective data fetching;
- batching;
- image optimization;
- cache static asset;
- avoid polling;
- avoid realtime subscription kecuali diperlukan.

Realtime Supabase tidak perlu digunakan default.

---

# 39. Query Strategy

Gunakan:

- filter server-side;
- select field spesifik;
- batching;
- pagination jika data besar.

Hindari:

```text
select *
```

untuk list sederhana.

---

# 40. Caching Strategy

Static:

Cloudflare cache.

Application data:

gunakan query cache ringan jika framework mendukung.

Jangan cache nilai terlalu agresif hingga guru melihat data stale.

---

# 41. Offline Behavior

Full offline belum MVP.

Tetapi UX harus tahan koneksi buruk.

Minimum:

- loading indicator;
- save status;
- retry;
- failure message;
- prevent accidental data loss.

Future:

PWA + offline queue.

---

# 42. Error Handling Architecture

Error dibagi:

## Validation Error

Contoh:

```text
Nilai harus antara 0–100.
```

## Permission Error

```text
Anda tidak memiliki akses untuk mengubah nilai ini.
```

## Network Error

```text
Data belum tersimpan. Periksa koneksi internet.
```

## System Error

Pesan user-friendly.

Technical error tetap log internal.

---

# 43. Logging

Frontend:

log minimum.

Jangan log:

- password;
- token;
- data pribadi penuh.

Server-side logging hanya jika Workers digunakan.

---

# 44. Audit Trail

Minimal:

```text
updated_by
updated_at
```

Untuk data sensitif seperti nilai.

Future:

audit_events.

---

# 45. Storage

Supabase Storage digunakan jika diperlukan untuk:

- logo sekolah;
- foto siswa 3×4 pada bucket privat `student-photos`, maksimal 2 MB dan hanya JPG/PNG;
- attachment tertentu.

Jangan simpan file binary di PostgreSQL.
Foto siswa tidak memiliki URL publik. Admin dan Wali Kelas yang ditugaskan memperoleh akses melalui policy Storage dan URL sementara.

---

# 46. Cloudflare Pages

Frontend di-deploy ke Cloudflare Pages.

Pipeline:

```text
GitHub push
↓
CI
↓
build
↓
Cloudflare deployment
```

---

# 47. Cloudflare Workers

Gunakan hanya jika ada kebutuhan seperti:

- server-side PDF;
- protected admin task;
- signed export;
- proxy khusus;
- trusted service-role operation.

Jangan menggunakan Workers untuk semua logic secara default.

---

# 48. GitHub CI/CD

Rekomendasi pipeline:

```text
install
↓
typecheck
↓
lint
↓
unit test
↓
build
↓
deploy
```

E2E dapat berjalan pada PR atau staging.

---

# 49. Environment Strategy

Minimal:

```text
development
production
```

Lebih baik:

```text
development
staging
production
```

Jika biaya/complexity masih terlalu tinggi, staging dapat ditunda.

---

# 50. Environment Variables

Contoh frontend:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Jangan commit `.env`.

Gunakan:

```text
.env.example
```

tanpa secret.

---

# 51. Database Migration

Semua schema change melalui migration.

Flow:

```text
create migration
↓
test local/dev
↓
review
↓
apply production
```

Jangan ubah schema production manual tanpa histori.

---

# 52. Migration Naming

Contoh:

```text
20260831_create_students_table.sql
20260831_add_teacher_assignments.sql
```

Gunakan format konsisten sesuai tool migration yang dipilih.

---

# 53. Schema Evolution

Karena format rapor berubah:

jangan hapus field historical terlalu cepat.

Gunakan:

- additive migrations;
- deprecation period;
- template versioning.

---

# 54. Report Template Versioning

Setiap template rapor sebaiknya dapat memiliki versi.

Contoh:

```text
lower_primary_v1
upper_primary_v1
```

Future:

```text
lower_primary_v2
```

Historical report dapat mempertahankan template lama.

---

# 55. Configuration Versioning

Aturan penilaian per tahun ajaran mungkin berubah.

Jangan selalu menggunakan config terbaru untuk data lama.

Pertimbangkan relasi:

```text
academic_year
→ report_template
→ grading_rule_version
```

---

# 56. Testing Architecture

Layer test:

```text
unit
integration
permission/RLS
E2E
print/report
```

---

# 57. Unit Test Focus

Prioritas:

- grade calculation;
- predicate;
- CP selection;
- description generation;
- completeness;
- leger transformation.

---

# 58. Integration Test Focus

Contoh:

```text
create student
→ assign class
→ save grades
→ generate description
→ completeness update
```

---

# 59. RLS Test

Wajib test:

- subject teacher cannot edit other subject;
- homeroom teacher cannot edit unrelated class;
- anonymous denied;
- admin allowed.

---

# 60. E2E Test

Critical path:

## Admin

```text
login
→ setup
→ class
→ student
→ teacher assignment
```

## Guru

```text
login
→ class
→ subject
→ grade entry
→ description
→ save
```

## Wali

```text
login
→ completeness
→ attendance
→ achievement
→ preview
→ print
```

---

# 61. Print Test

Gunakan snapshot/manual visual test untuk:

- A4;
- nama panjang;
- deskripsi panjang;
- empty values;
- page breaks;
- upper vs lower primary.

---

# 62. Failure Modes

Arsitektur harus mengantisipasi:

## Supabase unreachable

UI:

```text
connection error
retry
do not falsely show saved
```

## Import malformed Excel

Tidak insert.

Show row errors.

## Partial grade data

Status:

```text
partial
```

Jangan error.

## Permission misconfiguration

Test RLS sebelum production.

## Report template bug

Tidak merusak source academic data.

---

# 63. Backup Strategy

Minimal:

- Supabase backup sesuai plan;
- repository GitHub;
- migration history.

Future:

- scheduled logical export.

---

# 64. Recovery Principle

Jika deployment frontend rusak:

rollback GitHub/Cloudflare.

Jika schema migration rusak:

gunakan migration fix/rollback.

Jangan restore database penuh kecuali perlu.

---

# 65. Observability

MVP observability sederhana.

Minimum:

- build logs;
- Cloudflare deploy logs;
- Supabase logs;
- client error reporting optional.

Future:

Sentry atau equivalent.

Status:

**TBD**

---

# 66. Security Boundary

Trust boundary:

```text
Browser = untrusted
Supabase RLS = primary data authorization
Workers = trusted only if secrets stored there
```

Tidak boleh mempercayai:

- role dari localStorage;
- hidden buttons;
- route protection saja.

---

# 67. Personal Data

Data siswa adalah data sensitif.

Prinsip:

- minimal collection;
- minimum exposure;
- role restricted;
- no public endpoint;
- no debug dump production.

---

# 68. Performance Target

Tidak ditetapkan angka formal dulu.

Namun prinsip:

- dashboard load cepat;
- grade page tetap responsive;
- bulk student table usable;
- report preview tidak freeze;
- mobile 4G/weak network tetap usable.

---

# 69. Scalability Path

MVP fokus satu sekolah.

Jika nanti berkembang:

Phase 1:

```text
single school per deployment
```

Phase 2:

```text
shared codebase template
automated provisioning
```

Phase 3:

```text
optional multi-tenant SaaS
```

Jangan lompat ke Phase 3 sekarang.

---

# 70. Architecture Decision Records

Untuk keputusan besar, tambahkan ADR.

Contoh:

```text
docs/adr/
  001-single-school-deployment.md
  002-supabase-auth-rls.md
  003-report-template-strategy.md
```

Format:

```text
Context
Decision
Consequences
Alternatives
```

---

# 71. Current Architecture Decisions

## Final

- Supabase backend/database/auth;
- Cloudflare hosting;
- GitHub repository;
- one school per deployment;
- mobile-first;
- role-based access;
- RLS;
- lower/upper primary separation;
- report template separated from data;
- Excel import;
- CP editable auto-description;
- leger derived output.

---

# 72. Current TBD

Belum final:

- exact PDF engine;
- exact schema;
- exact grading formula;
- exact report layout;
- exact PWA strategy;
- observability tool.

Frontend foundation yang sudah final:

```text
React + TypeScript + Vite
Tailwind
shadcn/ui
pnpm
Vitest
Testing Library
Playwright
```

---

# 73. Recommended Initial Folder Structure

```text
/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   ├── schools/
│   │   ├── teachers/
│   │   ├── classes/
│   │   ├── students/
│   │   ├── subjects/
│   │   ├── learning-outcomes/
│   │   ├── grades/
│   │   ├── reports/
│   │   └── leger/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── validation/
│   │   └── permissions/
│   ├── config/
│   ├── types/
│   └── utils/
│
├── supabase/
│   ├── migrations/
│   └── seed/
│
├── docs/
│   ├── architecture.md
│   ├── database.md
│   ├── permissions.md
│   ├── report-templates.md
│   └── adr/
│
├── AGENTS.md
├── README.md
└── prd_rapor_sd_kelas_1-6_v0.4.md
```

---

# 74. Implementation Order

Recommended sequence:

## Phase 1 — Foundation

1. frontend scaffold;
2. Supabase project;
3. Auth;
4. role model;
5. school settings;
6. academic year;
7. semester.

## Phase 2 — Master Data

8. teachers;
9. classes;
10. students;
11. subjects;
12. teacher assignments;
13. Excel import.

## Phase 3 — Academic Core

14. learning outcomes;
15. assessment components;
16. grade entry;
17. description generation;
18. completeness engine.

## Phase 4 — Homeroom

19. attendance;
20. extracurricular;
21. achievements;
22. homeroom notes.

## Phase 5 — Output

23. leger;
24. lower primary report;
25. upper primary report;
26. preview;
27. print/PDF.

## Phase 6 — Hardening

28. RLS review;
29. testing;
30. mobile polish;
31. performance;
32. production deployment.

---

# 75. Architectural Guardrails

Developer dan AI agent harus menjaga aturan:

1. Jangan hardcode sekolah.
2. Jangan hardcode kurikulum.
3. Jangan bypass RLS.
4. Jangan masukkan service role ke frontend.
5. Jangan campur business logic ke component besar.
6. Jangan duplikasi core lower/upper primary.
7. Jangan membuat leger manual.
8. Jangan overwrite deskripsi guru.
9. Jangan menambahkan Worker tanpa alasan.
10. Jangan menambah scope di luar PRD.

---

# 76. Prinsip Evaluasi Arsitektur

Setiap keputusan teknis harus diuji dengan tiga pertanyaan:

### A. Apakah mudah digunakan guru dari HP?

Jika tidak, sederhanakan.

### B. Apakah aman walau frontend dimanipulasi?

Jika tidak, perbaiki RLS/authorization.

### C. Apakah perubahan format rapor bisa dilakukan tanpa membangun ulang semua modul?

Jika tidak, arsitektur terlalu terikat template.

---

# 77. Kesimpulan

## Implementasi Preview Rapor MVP

Preview rapor memakai alur terpisah:

```text
Supabase services + RLS
→ report source data
→ pure report view model
→ template presentasi
→ preview responsif
```

Template kelas 1–3 dan kelas 4–6 memakai core data yang sama, lalu dipilih
melalui `template_group`. Nilai angka 0–100 dihitung per komponen penilaian,
sedangkan predikat A–D ditentukan dari konfigurasi KKM single atau multi.
Field yang belum terisi ditampilkan dengan penanda yang jelas dan tidak
diisi dengan data buatan. Print CSS, format A4, page break, dan PDF tetap
menjadi tahap terpisah setelah preview.

Sub-tahap cetak satu siswa memakai komponen presentasi yang sama dengan preview.
Media cetak menyembunyikan kontrol aplikasi, menetapkan kertas A4 portrait,
memisahkan setiap bagian utama dengan page break, dan mempertahankan header tabel
ketika halaman hasil belajar harus berlanjut. Browser print menjadi jalur MVP.
Batch print sudah memakai jalur yang sama. Google Chrome desktop dan simulasi
Chrome Android Pixel 5 telah diverifikasi; uji singkat pada HP fisik tetap menjadi
bagian pemeriksaan sebelum penggunaan produksi.

Struktur output resmi MVP disetujui pada 11 September 2026 dan didokumentasikan
di `docs/report-templates.md`. Sampul menempatkan judul lengkap di atas lambang
Tut Wuri Handayani yang berada di tengah. Halaman identitas menempatkan foto 3×4
di bagian bawah berdampingan dengan tanda tangan kepala sekolah agar dapat
terkena satu cap/stempel. Data kesehatan tetap tidak menjadi bagian template.

Batch print satu kelas mengambil data siswa dengan filter kelompok dalam satu
rangkaian query, lalu membagi hasilnya menjadi view model per siswa di memori.
Pendekatan ini menghindari N+1 query. Setiap siswa tetap memakai template preview
yang sama dan dipisahkan dengan page break sebelum dialog cetak browser dibuka.

Leger kelas 4–6 menggunakan view model yang sama dengan tampilan layar. Hasil
cetak memakai A4 landscape dengan seluruh mapel serta komponen Pengetahuan dan
Keterampilan tetap terpisah. Ekspor CSV juga menyimpan nilai, predikat, dan
deskripsi tiap komponen pada kolom tersendiri; sistem tidak membuat nilai gabungan
baru yang tidak ditetapkan oleh aturan sekolah.

Dashboard Wali Kelas membaca profil guru yang terhubung dengan akun Auth, lalu
memfilter kelas berdasarkan `homeroom_teacher_id` dan semester aktif. Daftar
siswa hanya dihitung dari keanggotaan kelas tersebut. RLS pada `students` dan
`class_members` memberikan akses baca kepada Wali Kelas hanya jika kelas memang
terhubung dengan profil gurunya; navigasi frontend tetap hanya berfungsi sebagai
lapisan UX, bukan sumber authorization.

Dashboard Guru Mata Pelajaran membaca profil guru yang terhubung dengan akun
Auth, kemudian mengambil `teacher_assignments` aktif pada semester aktif. Kelas
dan mata pelajaran ditampilkan dari referensi yang lolos RLS, bukan dari daftar
yang ditanam di frontend. Dashboard menjadi pusat navigasi menuju Input Nilai dan
CP/Deskripsi. RLS pada `students` dan `class_members` memberi akses baca hanya
untuk kelas yang memiliki penugasan aktif bagi guru tersebut; akses nilai tetap
dibatasi lagi oleh kombinasi kelas, mata pelajaran, dan semester.

---

Arsitektur aplikasi mengikuti pola:

```text
Mobile-first Web App
→ Application Layer
→ Business Logic
→ Supabase Services
→ PostgreSQL + RLS
```

dengan:

```text
lower_primary
upper_primary
```

sebagai strategi/template berbeda di atas core system yang sama.

Deployment tetap sederhana:

```text
GitHub
→ Cloudflare Pages
→ Supabase
```

Cloudflare Workers hanya ditambahkan bila ada kebutuhan server-side khusus.

Fokus utama arsitektur adalah:

- sederhana;
- aman;
- mudah dipelihara;
- mudah dipakai guru;
- ringan untuk koneksi terbatas;
- fleksibel terhadap perubahan format rapor.
