# TODO.md — Aplikasi Rapor SD Kelas 1–6

**Last Updated:** 2026-09-10
**Project:** Aplikasi Rapor SD  
**Status Legend:** `[ ]` Todo · `[/]` In Progress · `[x]` Done · `[*]` Blocked · `[-]` Cancelled

---

## Tujuan File Ini

File ini adalah **pelacak progres utama proyek** berbasis Markdown.

Fungsinya:

- menjadi task backlog lokal;
- mencatat status setiap pekerjaan;
- membantu AI/developer melanjutkan pekerjaan tanpa kehilangan konteks;
- menjadi “memori proyek” singkat;
- mencegah pekerjaan yang sama diulang;
- mencatat task yang tertunda, selesai, diblokir, atau dibatalkan;
- menjaga implementasi tetap sesuai `PRD`, `AGENTS.md`, dan `Architecture.md`.

### Aturan Penggunaan

1. Update file ini setiap kali task mulai dikerjakan atau selesai.
2. Jangan mengubah status menjadi `[x]` jika belum benar-benar selesai dan diuji.
3. Jika task terhambat keputusan atau dependency, gunakan `[*]`.
4. Jangan menghapus task lama yang sudah selesai; biarkan sebagai histori.
5. Tambahkan task baru ke prioritas yang sesuai.
6. Jika scope berubah, sesuaikan task dan catat alasan singkat.
7. AI agent wajib membaca file ini sebelum memulai pekerjaan baru.
8. Progress harus mencerminkan kondisi repository yang sebenarnya.
9. Task besar harus dipecah menjadi task kecil yang dapat diverifikasi.
10. Gunakan komentar singkat bila ada dependency atau catatan penting.

---

# 🔥 High Priority

## Dokumentasi & Requirement

- [x] Buat `prd_rapor_sd_kelas_1-6_v0.4.md`
- [x] Buat `AGENTS.md`
- [x] Buat `Architecture.md`
- [x] Bedah referensi Excel rapor kelas 1–3
- [x] Bedah referensi Excel rapor kelas 4–6
- [ ] Finalisasi perbedaan rule kelas 1–3 dan 4–6
- [x] Finalisasi field rapor terbaru yang benar-benar dipakai
  - Field MVP dikunci sesuai template A4 yang disetujui; data kesehatan tetap tidak disertakan.
- [x] Finalisasi struktur output rapor
  - Struktur sampul, identitas, hasil belajar, ringkasan, foto 3×4, dan tanda tangan didokumentasikan pada `docs/report-templates.md`.
- [ ] Finalisasi struktur leger
- [x] Finalisasi formula nilai
  - Pengetahuan dan Keterampilan masing-masing memakai rata-rata nilai CP pada skala 0–100, predikat A–D, dan deskripsi terpisah. KKM dapat berupa satu angka seluruh mapel atau angka berbeda per mapel. Predikat memakai panjang interval `ceil((100 - KKM) / 3)`.
- [x] Finalisasi aturan CP/deskripsi otomatis
  - CP bernilai tertinggi menjadi capaian sangat baik dan CP bernilai terendah menjadi bagian yang perlu ditingkatkan. Draft dapat diedit dan tidak menimpa edit manual tanpa konfirmasi.
- [x] Buat `database.md`
- [x] Buat `permissions.md`
- [x] Buat `report-templates.md`
- [x] Buat ADR untuk keputusan arsitektur utama

## Project Foundation

- [x] Tentukan frontend framework final
- [x] Tentukan UI library final
- [x] Tentukan package manager
- [x] Tentukan test runner
- [x] Tentukan PDF/print strategy final
- [x] Buat repository GitHub
- [x] Inisialisasi project frontend
- [x] Konfigurasi TypeScript
- [x] Konfigurasi linting
- [x] Konfigurasi formatting
- [x] Tambahkan `.env.example`
- [x] Tambahkan `.gitignore`
- [x] Tambahkan README awal
- [x] Pastikan `AGENTS.md` berada di root repository
- [x] Pastikan PRD dan Architecture tersedia di repository

## Supabase Foundation

- [x] Buat project Supabase
- [x] Konfigurasi environment development
- [x] Konfigurasi Supabase client
- [x] Buat auth flow
  - Service email/password, UI login responsif, lupa password mandiri, halaman pembuatan password baru dari tautan recovery, pemulihan session, logout lokal, loading, dan pesan error aman sudah tersedia.
- [x] Buat role pengguna
  - Identifier/label TypeScript dan enum database menggunakan `admin`, `homeroom_teacher`, dan `subject_teacher`.
- [/] Aktifkan Row Level Security
  - RLS aktif pada `profiles`; setiap tabel baru tetap wajib memiliki policy sendiri.
- [x] Buat migration dasar
- [ ] Buat seed development
- [x] Buat data sekolah
  - Konfigurasi satu sekolah per deployment tersedia dengan audit, migration tercatat, dan RLS Admin.
- [x] Buat tahun ajaran
  - Admin dapat menambah periode berformat `YYYY/YYYY`, melihat riwayat, dan memilih satu tahun ajaran aktif tanpa menghapus data lama.
- [x] Buat semester
  - Semester 1 dan 2 dapat ditambahkan per tahun ajaran; aktivasi semester sekaligus menyelaraskan tahun ajaran aktif secara atomik.
- [x] Test login/logout
  - Unit dan UI test lulus; login dan logout nyata terverifikasi pada preview lokal dengan Supabase cloud. Alur lupa password dan tampilan HP 360px/390px juga terverifikasi.
- [x] Test session persistence
  - Unit test lulus; sesi Admin tetap aktif setelah preview dimulai ulang dan halaman dimuat ulang.

## Security

- [/] Buat RLS untuk Admin
  - Policy Admin telah diterapkan pada `schools`, `academic_years`, dan `semesters`; tabel berikutnya tetap harus memiliki policy masing-masing.
- [/] Buat RLS untuk Wali Kelas
  - Wali kelas dapat membaca kelas dan siswa aktif serta mengelola seluruh nilai mapel, deskripsi, dan komponen wali kelas pada kelasnya. Audit menyeluruh seluruh tabel tetap dilakukan sebelum production.
- [x] Izinkan Wali Kelas menginput seluruh nilai mapel kelas sendiri
  - Tetap berlaku ketika belum ada Guru Mata Pelajaran. Guru Mata Pelajaran hanya dapat menginput nilai pada kelas, mapel, dan semester yang ditugaskan; Admin dapat mengakses seluruh modul.
- [/] Buat RLS untuk Guru Mapel
  - Akses siswa dan keanggotaan kelas sudah dibatasi ke penugasan aktif; nilai, CP, kelas, serta mapel juga memakai scope penugasan. Audit menyeluruh seluruh tabel tetap dilakukan sebelum production.
- [/] Pastikan anonymous user tidak dapat mengakses data
  - Anonymous tidak memiliki akses pada tabel internal termasuk master data dan `teacher_assignments`. Hanya nama/logo dari tabel branding terpisah yang sengaja dapat dibaca pada login; audit harus diulang untuk setiap tabel baru.
- [x] Nonaktifkan public email signup pada konfigurasi Auth cloud
- [x] Pastikan service role key tidak digunakan di frontend
- [/] Tambahkan test permission
  - Policy produksi untuk nilai dan deskripsi sudah diterapkan serta definisinya diverifikasi: Admin mengelola seluruh data, Wali Kelas mengelola seluruh nilai kelas sendiri, dan Guru Mapel hanya mengelola scope penugasan aktif. Uji login langsung sebagai Wali Kelas masih diperlukan setelah akun Wali Kelas terhubung.
- [ ] Audit seluruh query Supabase sebelum production
- [ ] Evaluasi konsolidasi policy SELECT per role pada `students` dan `class_members` setelah tersedia data penggunaan nyata
  - Advisor hanya memberi peringatan performa multiple permissive policies; tidak ditemukan akses data terbuka.

---

# 🟡 Medium Priority

## Dashboard

- [x] Buat dashboard Admin
  - Dashboard mobile-first memiliki sidebar/drawer, status akun, ringkasan tanpa data rekaan, panduan pengaturan awal, dan empty state aktivitas.
- [x] Buat dashboard Wali Kelas
  - Dashboard mobile-first menampilkan kelas sendiri, jumlah siswa aktif, jalur kerja wali kelas, serta loading, retry, dan empty state. Migration akses baca siswa kelas sendiri sudah diterapkan ke Supabase.
- [x] Buat dashboard Guru Mapel
  - Dashboard mobile-first menampilkan penugasan, jumlah kelas/mapel, periode aktif, serta navigasi menuju Input Nilai dan CP/Deskripsi berdasarkan assignment.
- [x] Tampilkan tahun ajaran aktif
- [x] Tampilkan semester aktif
- [x] Tampilkan jumlah siswa
- [x] Tampilkan jumlah kelas
- [x] Tampilkan status kelengkapan nilai
- [x] Tampilkan jumlah rapor siap cetak
- [x] Tambahkan warning data belum lengkap
  - Dashboard Admin membaca data aktif dari Supabase, memakai aturan kelengkapan yang sama dengan Monitoring, menampilkan loading/error/retry, dan menghindari permintaan berulang per kelas.
  - Lulus 205 unit/integration test, lint, format, typecheck/build, serta 5 E2E Dashboard Admin pada viewport 360px, 390px, 768px, dan 1280px.

## Data Sekolah

- [x] Buat halaman Pengaturan Sekolah
  - Form mobile-first terhubung ke Dashboard Admin dan Supabase, dengan loading, success, error aman, serta tombol simpan yang mudah dijangkau.
- [x] Nama sekolah editable
- [x] NPSN editable
- [x] Alamat editable
- [x] Desa/Kelurahan editable
- [x] Kecamatan editable
- [x] Kabupaten/Kota editable
- [x] Provinsi editable
- [x] Kode pos editable
- [x] Email editable
- [x] Kepala sekolah editable
- [x] NIP kepala sekolah editable
- [ ] Logo sekolah upload
  - Ditunda sebagai tahap Storage terpisah; `logo_url` sudah disiapkan tanpa memaksa upload pada tahap ini.
- [x] Pastikan tidak ada data sekolah yang hardcoded

## Guru

- [x] Buat halaman Data Guru
  - Daftar berupa tabel pada desktop dan kartu pada HP, dilengkapi pencarian, filter status, loading, retry, serta empty state.
- [x] Tambah guru
  - Form menyimpan nama, email, NIP/NUPTK opsional, dan peran utama tanpa membuat akun login otomatis.
- [x] Edit guru
- [x] Nonaktifkan guru
  - Data tidak dihapus dan dapat diaktifkan kembali; nonaktifkan memakai dialog konfirmasi.
- [x] Assign role
  - Peran utama dibatasi menjadi `homeroom_teacher` atau `subject_teacher`; akses aktual tetap menunggu assignment.
- [x] Assign mata pelajaran
- [x] Assign kelas
  - Halaman Penugasan Guru menghubungkan guru, mapel, kelas, tahun ajaran, dan semester dalam satu scope yang tervalidasi.
- [x] Assign wali kelas
  - Penetapan wali kelas tersedia melalui form Data Kelas; aktivasi hak akses akun menunggu tahap assignment.
- [/] Validasi permission guru
  - Penugasan hanya dikelola Admin. Wali Kelas dapat mengelola nilai seluruh mapel kelas sendiri, sedangkan Guru Mapel hanya dapat mengelola nilai kelas, mapel, dan semester dalam assignment aktif. Uji login langsung kedua role tetap diperlukan sebelum production final.

## Kelas

- [x] Buat halaman Data Kelas
  - Daftar kelas berupa kartu responsif dengan pencarian, filter periode, loading, retry, dan empty state.
- [x] Tambah kelas 1–6
- [x] Tambah rombel
- [x] Assign wali kelas
  - Wali kelas boleh ditentukan saat tambah/edit kelas atau dibiarkan kosong sampai guru tersedia.
- [x] Assign template `lower_primary`
- [x] Assign template `upper_primary`
  - Template diturunkan otomatis dan dikunci database: kelas 1–3 `lower_primary`, kelas 4–6 `upper_primary`.
- [x] Hubungkan tahun ajaran
- [x] Hubungkan semester
  - Foreign key gabungan memastikan semester selalu berasal dari tahun ajaran yang dipilih.

## Siswa

- [x] Buat halaman Data Siswa
  - Daftar responsif menampilkan identitas ringkas, kelas semester aktif, status, loading, retry, serta empty state.
- [x] Tambah siswa
- [x] Edit siswa
- [x] Nonaktifkan siswa
  - Data tidak dihapus dan dapat diaktifkan kembali.
- [x] Assign siswa ke kelas
  - Penempatan dipisahkan dalam `class_members` agar riwayat kelas per semester tetap tersimpan.
- [x] Validasi NIS
  - NIS wajib, unik, maksimal 30 karakter, dan tetap disimpan sebagai teks agar angka nol di depan tidak hilang.
- [x] Validasi NISN
  - NISN opsional sesuai edge case PRD; bila diisi wajib unik dan terdiri dari 10 angka.
- [x] Tambahkan pencarian siswa
- [x] Tambahkan filter kelas
- [x] Tambahkan foto 3×4 dan biodata keluarga siswa
  - Admin dan Wali Kelas dapat mengisi foto serta biodata keluarga; Wali Kelas hanya untuk siswa pada kelasnya.
  - Tinggi/berat badan dan kondisi kesehatan tidak dibuat sesuai keputusan terbaru.
  - Foto disimpan pada bucket privat JPG/PNG maksimal 2 MB; form responsif dan 211 unit/integration test lulus.

## Import Excel

- [x] Buat upload file Excel
  - File `.xlsx` dibaca lokal di browser, maksimal 5 MB dan 500 siswa agar tetap ringan di HP.
- [x] Parse data Excel
  - Sheet pertama digunakan; baris judul dan baris kosong ditangani sebelum mapping.
- [x] Mapping kolom
- [x] Preview data
- [x] Validasi baris
- [x] Deteksi duplicate NIS
- [x] Deteksi duplicate NISN
- [x] Validasi format tanggal
- [x] Tampilkan error per baris
- [x] Konfirmasi sebelum insert
- [x] Batch insert
  - Satu file ditujukan ke satu kelas semester aktif; siswa dan penempatan kelas disimpan atomik melalui fungsi database `SECURITY INVOKER`.
- [x] Test file Excel valid
- [x] Test file Excel rusak
- [x] Test data duplicate

## Mata Pelajaran

- [x] Buat master mata pelajaran
- [x] Mata pelajaran configurable
- [x] Tambah muatan lokal
- [x] Assign mata pelajaran ke kelas
- [x] Assign guru ke mapel
- [x] Jangan hardcode daftar mapel

## Learning Outcomes / CP

- [x] Buat master CP
- [x] Tambah CP
- [x] Edit CP
- [x] Nonaktifkan CP
- [x] Hubungkan CP ke mata pelajaran
- [x] Hubungkan CP ke kelas
- [x] Hubungkan CP ke semester
- [x] Pastikan struktur tidak hardcode KI/KD

---

# 🟢 Feature Development

## Input Nilai Kelas 1–3

- [x] Pisahkan nilai Pengetahuan dan Keterampilan per CP sesuai keputusan terbaru sekolah
- [x] Dukung Single KKM seluruh mapel atau Multi KKM per mapel
- [x] Buat halaman input nilai `lower_primary`
- [x] Tampilkan seluruh siswa dalam satu layar
- [x] Buat tabel responsif desktop
- [x] Buat tampilan mobile
- [x] Input nilai per siswa
- [x] Pilih CP
- [x] Generate deskripsi CP
- [x] Edit deskripsi manual
- [x] Simpan nilai
- [x] Tampilkan status `Menyimpan...`
- [x] Tampilkan status `Tersimpan`
- [x] Warning jika penyimpanan gagal
- [x] Validasi nilai 0–100
- [x] Test nilai kosong
- [x] Test nilai 0
- [x] Test nilai 100

## Input Nilai Kelas 4–6

- [x] Siapkan fondasi komponen Pengetahuan/Keterampilan dan konfigurasi Single/Multi KKM
- [x] Buat halaman input nilai `upper_primary`
- [x] Tampilkan seluruh siswa
- [x] Buat struktur komponen nilai
- [x] Dukungan pengetahuan bila template membutuhkan
- [x] Dukungan keterampilan bila template membutuhkan
- [x] Input nilai per CP/kompetensi
- [x] Hitung nilai akhir
- [x] Hitung predikat jika digunakan
- [x] Identifikasi capaian terbaik
- [x] Identifikasi capaian yang perlu ditingkatkan
- [x] Generate deskripsi
- [x] Edit deskripsi manual
- [x] Test workflow kelas 4
- [x] Test workflow kelas 5
- [x] Test workflow kelas 6

## Description Engine

- [x] Buat `generateReportDescription()`
- [x] Buat strongest outcome selector
- [x] Buat weakest outcome selector
- [x] Simpan generated description
- [x] Simpan final description
- [x] Jangan overwrite edit manual guru
- [x] Tambahkan aksi regenerate dengan konfirmasi
- [x] Unit test description engine

## Absensi

- [x] Buat form sakit
- [x] Buat form izin
- [x] Buat form tanpa keterangan
- [x] Hubungkan dengan siswa
- [x] Hubungkan dengan semester
- [x] Validasi nilai tidak negatif

## Ekstrakurikuler

- [x] Master ekstrakurikuler
- [x] Assign siswa
- [x] Predikat/capaian
- [x] Deskripsi
- [x] Tampil di rapor

## Prestasi

- [x] Tambah prestasi
- [x] Jenis prestasi
- [x] Tingkat prestasi
- [x] Keterangan
- [x] Tahun/tanggal
- [x] Tampil di rapor

## Catatan Wali Kelas

- [x] Buat field catatan
- [x] Tambahkan batas karakter
- [x] Preview hasil di rapor
- [x] Test teks panjang

---

# 🟦 Report & Output

## Pengaturan Rapor

- [x] Buat halaman Pengaturan Rapor untuk Admin
  - Pusatkan Single/Multi KKM per semester, KKM setiap mata pelajaran, pratinjau predikat A–D, dan informasi format cetak A4 yang sudah disetujui.
  - Jangan menambahkan pengaturan format atau aturan akademik yang belum disepakati.
  - Menu `Pengaturan Rapor` kini aktif untuk Admin dan tidak lagi berstatus `Segera`.
  - Lulus 218 unit/integration test, typecheck, lint, format, serta production build.

## Report Completeness

- [x] Buat completeness engine
- [x] Status `Belum Diisi`
- [x] Status `Sebagian`
- [x] Status `Lengkap`
- [x] Status `Siap Cetak`
- [x] Check identitas
- [x] Check nilai
- [x] Check deskripsi
- [x] Check absensi
- [x] Check ekstrakurikuler
- [x] Check prestasi
- [x] Check catatan wali kelas

## Report Preview

- [x] Buat report view model
- [x] Preview lower primary
- [x] Preview upper primary
- [x] Preview identitas sekolah
- [x] Preview identitas siswa
- [x] Preview nilai
- [x] Preview deskripsi
- [x] Preview ekskul
- [x] Preview prestasi
- [x] Preview absensi
- [x] Preview catatan wali kelas
- [x] Test nama siswa panjang
- [x] Test deskripsi panjang
- [x] Test field kosong
- [x] Terapkan tampilan rapor resmi berdasarkan referensi yang disetujui
  - Sampul memakai logo Tut Wuri Handayani, identitas sekolah, nama siswa, dan NIS/NISN.
  - Halaman identitas memuat biodata keluarga, foto atau bingkai 3×4, serta kepala sekolah.
  - Nilai Pengetahuan dan Keterampilan tampil berdampingan dengan KKM, angka, predikat, dan deskripsi terpisah.
  - Halaman akhir memuat ekstrakurikuler, saran wali kelas, prestasi, ketidakhadiran, serta tanda tangan tanpa data kesehatan.

## Print / PDF

- [x] Buat print CSS
- [x] Format A4
- [x] Page break
- [x] Test browser print
- [x] Test Chrome desktop
  - Google Chrome desktop 1280×900 lolos: urutan sampul benar, tidak ada horizontal overflow, dan media cetak tetap A4 210×297 mm.
- [x] Test browser Android
  - Simulasi Chrome Android Pixel 5 lolos: tidak ada horizontal overflow dan tabel lebar tetap berada di area gulir; smoke test HP fisik tetap masuk checklist produksi.
- [x] Finalisasi PDF engine
  - MVP memakai HTML print dan `Save as PDF` dari Chrome tanpa engine server-side atau layanan berbayar tambahan.
- [x] Print satu siswa
- [x] Batch print satu kelas
- [x] Pastikan hasil preview = hasil cetak
- [x] Render dan periksa contoh cetak lima halaman A4
  - Ukuran terverifikasi A4 portrait; nama siswa panjang, deskripsi panjang, tabel lintas halaman, kepala tabel berulang, field kosong, dan batas halaman diperiksa secara visual.

## Leger Kelas 1–3

- [x] Buat query leger lower primary
- [x] Buat view model
- [x] Buat tabel leger
- [x] Print
- [x] Export
- [x] Test semua mapel

## Leger Kelas 4–6

- [x] Buat query leger upper primary
- [x] Support komponen nilai
- [x] Support nilai akhir
- [x] Support predikat bila aktif
- [x] Support deskripsi
- [x] Print
  - Tabel seluruh mapel dicetak A4 landscape; nilai Pengetahuan dan Keterampilan tetap berada pada kolom terpisah.
- [x] Export
  - CSV kelas 4–6 memisahkan nilai, predikat, dan deskripsi setiap komponen agar mudah dibuka di Excel.
- [x] Test tabel lebar

---

# 🎨 UI/UX

## General

- [-] Buat desain Figma MVP untuk layar utama desktop dan mobile
  - Diganti dengan prototipe visual lokal setelah user menyetujui alternatif tanpa Figma karena batas Figma MCP paket Starter.
- [x] Buat prototipe visual tahap 1: Login dan dashboard role dalam versi desktop/mobile
- [x] Buat prototipe visual tahap 2: Data Siswa, Guru, Kelas, dan Mata Pelajaran
- [x] Buat prototipe visual tahap 3: Input Nilai, CP/Deskripsi, dan workflow Wali Kelas
- [x] Buat prototipe visual tahap 4: Leger dan Preview Rapor
- [x] Buat design system sederhana
- [x] Standardisasi spacing
- [x] Standardisasi typography
- [x] Standardisasi button
- [x] Standardisasi form
- [x] Standardisasi table
- [x] Standardisasi modal
- [x] Standardisasi empty state
- [x] Standardisasi toast/feedback
- [x] Penyempurnaan visual aplikasi tanpa mengubah hero dan alur
  - Outfit Variable dimuat lokal, kanvas memakai nuansa merah hangat, permukaan dan bayangan dipertegas secara halus, serta motion singkat memiliki fallback reduced-motion.
  - Hero, struktur navigasi, field, urutan kerja, dan requirement produk tidak diubah.
  - Lulus 168 unit/integration test, 65 E2E pada viewport 360px, 390px, 768px, dan 1280px, typecheck, lint, format, serta production build.
- [x] Jadikan nama sekolah sebagai identitas utama aplikasi
  - `SD Negeri Tumbang Kawei` tersimpan sebagai konfigurasi Supabase dan tampil pada login, dashboard, pengaturan, serta judul browser tanpa hardcode pada source code.
- [x] Gunakan ilustrasi sekolah pada login dan hero Dashboard Admin
- [x] Pastikan ilustrasi login tampil utuh pada HP
- [x] Terapkan identitas produk RaporKu dan logo aplikasi
  - Perbaiki seluruh tulisan antarmuka dari `RapotKu` menjadi `RaporKu`.
  - Gunakan logo master pada login, Dashboard Admin, favicon, Apple touch icon, dan manifest ikon aplikasi 192/512 piksel.
- [x] Tambahkan motion mikro pada hero Login/Dashboard dan interaksi menu
  - Karakter, daun, dan burung bergerak halus; section ringkasan overlap dengan hero; gerak scroll hanya dekoratif; menu memakai kotak interaktif dan bounce teks singkat.
  - Gambar sumber tetap sama dan hanya dimuat dari satu URL; lapisan motion bersifat dekoratif, tidak menambah informasi ganda bagi pembaca layar, serta otomatis tenang pada reduced-motion.
  - Lulus 169 unit/integration test, 6 E2E khusus Login/Dashboard pada 360px, 390px, 768px, dan 1280px, typecheck, lint, format, serta production build.
- [x] Perbaiki scroll sidebar Dashboard pada layar pendek
  - Daftar menu memiliki scroll mandiri pada desktop dan drawer HP, sementara identitas akun serta tombol Keluar tetap dapat dijangkau.
  - Lulus regression test khusus pada tinggi layar 640px dan pemeriksaan Dashboard 360px, 390px, 768px, serta 1280px.

## Mobile

- [x] Test viewport 360px
- [x] Test viewport 390px
- [x] Test viewport 768px
- [x] Hindari hover-only interaction
- [x] Pastikan tombol mudah disentuh
- [x] Hindari horizontal scroll ekstrem
- [x] Tambahkan sticky student name jika diperlukan
  - Tidak diperlukan pada pola mobile karena satu CP aktif ditampilkan untuk seluruh daftar siswa; tabel tablet memakai scroll terkontrol.
- [x] Pastikan input nilai nyaman di HP

## Accessibility

- [x] Label form lengkap
- [x] Semantic HTML
- [x] Keyboard navigation
- [x] ARIA untuk icon button
- [x] Status tidak hanya menggunakan warna
- [x] Periksa contrast

---

# ⚙️ Technical

## Code Quality

- [x] TypeScript strict
- [ ] Hindari `any`
- [ ] Business logic terpisah dari UI
- [ ] Query terpusat pada service layer
- [ ] Tidak ada file component terlalu besar
- [ ] Naming convention konsisten
- [ ] Komentar menjelaskan “why”
- [ ] Hapus `console.log` tidak perlu
- [ ] Hapus dead code
- [ ] Jangan refactor area tidak terkait

## Testing

- [x] Unit test grade calculation
- [x] Unit test predicate
- [x] Unit test CP selector
- [x] Unit test description
- [x] Unit test completeness
- [ ] Integration test student-to-report flow
- [ ] Permission/RLS test
- [ ] E2E Admin flow
- [ ] E2E Guru Mapel flow
- [ ] E2E Wali Kelas flow
- [ ] Report visual test

## Performance

- [ ] Hindari N+1 query
- [ ] Select kolom yang diperlukan
- [ ] Lazy load module besar
- [ ] Compress image
- [ ] Cache static assets
- [ ] Hindari realtime yang tidak perlu
- [ ] Test koneksi lambat
- [ ] Test halaman nilai banyak siswa

## Error Handling

- [ ] Loading state semua async action
- [ ] Success feedback
- [ ] Network error
- [ ] Permission error
- [ ] Validation error
- [ ] System error
- [ ] Jangan tampilkan raw Supabase error ke user

---

# 🚀 Deployment

## GitHub

- [x] Buat repository
  - Repository produksi baru: `kristantosaputra2-jpg/RAPOR-KU-SD-HABANGOI`; repository lama tetap tidak diubah.
- [ ] Buat branch strategy
- [ ] Gunakan Conventional Commits
- [ ] Buat PR template
- [ ] Lindungi branch utama
- [x] Tambahkan CI
  - GitHub Actions menjalankan pemeriksaan pada push ke `main` dan pull request dengan izin baca saja, cache pnpm, pembatalan proses lama, dan batas waktu 15 menit.

## CI

- [x] Install dependencies
- [x] Typecheck
- [x] Lint
- [x] Unit test
- [x] Build
- [x] Deploy
  - Production pertama berhasil dari branch `main` melalui Cloudflare Pages.

## Cloudflare

- [x] Buat Cloudflare Pages project
  - Project terpisah bernama `sdn-tbghabangoi` menggunakan paket gratis.
- [x] Hubungkan GitHub
  - Repository `kristantosaputra2-jpg/RAPOR-KU-SD-HABANGOI` terhubung ke branch produksi `main`; push berikutnya memicu build otomatis.
- [x] Setup environment variables
  - Variabel publik Supabase untuk Vite sudah tersedia pada build Production dan Preview tanpa memasukkan nilainya ke repository.
- [x] Setup domain
  - Domain gratis aktif di `https://sdn-tbghabangoi.pages.dev`; custom domain belum diperlukan.
- [x] Test production build
  - Build `pnpm build` dari commit `12bd3d2` berhasil dan deployment produksi berstatus sukses.
- [x] Test mobile production
  - Login produksi menampilkan identitas sekolah dan tombol masuk tanpa horizontal overflow pada viewport 360px dan 390px.

## Production Readiness

- [ ] Supabase production ready
- [x] Migration applied
  - Seluruh 37 migration fitur dan 1 migration pengamanan fungsi internal sudah sinkron pada project baru `pkpsxdmvtbsxdopnnsqv`.
- [/] RLS verified
  - Security Advisor tidak menemukan error maupun warning dan schema lint bersih; uji login per role pada project baru masih diperlukan.
- [/] Admin account verified
  - Pengguna `suchikristin37@gmail.com` sudah menerima undangan, berstatus confirmed, pernah sign-in, dan profilnya aktif sebagai `admin`; environment produksi sudah memakai project baru, tetapi login manual pada domain baru masih perlu diuji.
- [/] Identitas sekolah verified
  - Nama `SD Negeri Tumbang Habangoi` dan email `suchikristin37@gmail.com` sudah tersimpan pada project baru; NPSN, alamat, dan identitas kepala sekolah belum diberikan.
- [ ] Tahun ajaran verified
- [ ] Semester verified
- [ ] Teacher assignment verified
- [ ] Report preview verified
- [ ] Print verified
- [ ] Backup verified

---

# 🟣 Low Priority / Future

- [ ] PWA
- [ ] Offline queue
- [ ] Backup manual
- [ ] Restore utility
- [ ] Template manager visual
- [ ] Historical report template versioning UI
- [ ] Automated provisioning sekolah baru
- [ ] Portal orang tua
- [ ] Portal siswa
- [ ] WhatsApp integration
- [ ] Dapodik integration
- [ ] LMS
- [ ] QR attendance
- [ ] Multi-tenant SaaS
- [ ] Advanced analytics
- [ ] Native Android app

---

# 🚫 Out of Scope MVP

Task di bawah ini tidak boleh dikerjakan sebelum MVP selesai kecuali ada perubahan PRD:

- [-] Integrasi Dapodik
- [-] Portal orang tua
- [-] Portal siswa
- [-] WhatsApp otomatis
- [-] LMS
- [-] Bank soal
- [-] Absensi QR
- [-] Face recognition
- [-] Payment
- [-] General AI chatbot
- [-] Multi-school satu database
- [-] Data kesehatan
- [-] Full offline

---

# 📊 Progress Tracker

| Area                | Status      | Progress | Catatan                                                                                                                     |
| ------------------- | ----------- | -------: | --------------------------------------------------------------------------------------------------------------------------- |
| Discovery           | Done        |     100% | Referensi kelas 1 & 4 sudah dibedah                                                                                         |
| PRD                 | Done        |     100% | PRD gabungan kelas 1–6 tersedia                                                                                             |
| AGENTS              | Done        |     100% | Instruksi developer/AI tersedia                                                                                             |
| Architecture        | Done        |     100% | Arsitektur awal tersedia                                                                                                    |
| Database Design     | In Progress |      75% | Struktur 25 tabel, relasi, integritas, RLS, function, dan Storage saat ini sudah terdokumentasi; konsolidasi aturan KKM masih perlu diaudit |
| Permissions         | In Progress |      90% | Role ganda dan akses seluruh mapel Wali Kelas sudah diterapkan; uji login role serta audit menyeluruh RLS produksi masih tersisa |
| Frontend Foundation | Done        |     100% | Scaffold, quality tools, repository GitHub, dan fondasi Playwright siap                                                     |
| Supabase            | In Progress |      99% | Auth, seluruh master data, penugasan guru, master CP, audit, explicit grants, dan RLS terkait sudah tersedia                |
| Master Data         | Done        |     100% | Identitas sekolah, periode akademik, guru, kelas, siswa, mata pelajaran, penugasan, dan master CP selesai                   |
| Grade Engine        | In Progress |      95% | Input seluruh CP kelas 1–6 tersedia; Admin mengakses semua data, Wali Kelas semua mapel kelas sendiri, dan Guru Mapel hanya penugasannya |
| Report Engine       | Done        |     100% | Template resmi A4 disetujui; Chrome desktop, simulasi Android, browser print, dan Save as PDF telah diverifikasi           |
| Leger               | Done        |     100% | Leger kelas 1–6 responsif; cetak A4 landscape dan ekspor CSV tersedia untuk kedua kelompok kelas                            |
| Testing             | In Progress |      92% | 236 unit/integration test lulus; policy produksi, Chrome desktop, simulasi Android, cetak A4, dan build telah diverifikasi; smoke test login Wali Kelas tersisa |
| Cloudflare          | Done        |     100% | Pages gratis aktif, terhubung ke GitHub `main`, dan memakai konfigurasi Supabase produksi                                  |
| Production          | In Progress |      20% | Deployment awal aktif; audit RLS, periode akademik, preview rapor, cetak, dan backup masih harus diverifikasi             |

---

# 🧠 Project Memory

## Keputusan yang Sudah Final

- Satu sekolah per deployment.
- Supabase sebagai database/backend/auth.
- Cloudflare sebagai hosting.
- GitHub sebagai repository.
- Admin + Wali Kelas + Guru Mapel.
- Seorang guru dapat merangkap sebagai Wali Kelas sekaligus memiliki penugasan mata pelajaran.
- Wali Kelas dapat menginput seluruh nilai mapel di kelasnya walaupun belum ada Guru Mapel; Guru Mapel hanya dapat menginput scope penugasannya; Admin dapat mengakses seluruh modul.
- Kelas 1–3 menggunakan `lower_primary`.
- Kelas 4–6 menggunakan `upper_primary`.
- Input nilai menampilkan seluruh siswa.
- Pengetahuan dan Keterampilan dinilai per CP, lalu rata-rata, predikat, dan deskripsinya ditampilkan terpisah.
- Jumlah CP mengikuti CP aktif pada semester dan tidak dibatasi lima.
- KKM dapat memakai mode `single` untuk semua mapel atau `multi` per mapel; satu KKM yang terpilih berlaku untuk Pengetahuan dan Keterampilan.
- CP/deskripsi dibuat otomatis tetapi dapat diedit.
- Prestasi disertakan.
- Leger wajib.
- Import siswa dari Excel wajib.
- Data kesehatan tidak masuk MVP.
- Mobile-first.
- Tidak bergantung laptop Dapodik/server lokal.
- Struktur dan field template rapor A4 resmi telah disetujui serta dicatat pada `docs/report-templates.md`.
- PDF MVP memakai HTML print dan `Save as PDF` dari Chrome tanpa engine berbayar tambahan.

## Keputusan yang Masih TBD

- Schema database final.
- PWA/offline strategy.

---

# 📝 Update Log

## 2026-10-25

- [x] Verifikasi project Supabase Free baru `pkpsxdmvtbsxdopnnsqv` milik `suchikristin37@gmail.com` berstatus sehat dan masih kosong.
- [x] Hubungkan Supabase CLI lokal ke project baru tanpa menghapus atau menimpa project lama.
- [x] Terapkan 37 migration lokal ke project baru lalu verifikasi RLS dan advisor sebelum mengganti environment aplikasi.
- [x] Cabut akses `public`, `anon`, dan `authenticated` dari fungsi internal `public.rls_auto_enable()`; Security Advisor kembali bersih tanpa error atau warning.
- [x] Undang `suchikristin37@gmail.com`, aktifkan profil sebagai `admin`, dan verifikasi hasil query `role = admin`, `is_active = true`.
- [x] Simpan identitas awal `SD Negeri Tumbang Habangoi` dengan email `suchikristin37@gmail.com`; field identitas yang belum diberikan tetap kosong.
- [x] Tetapkan Auth Site URL dan satu-satunya Redirect URL ke `https://sdn-tbghabangoi.pages.dev/`; hapus redirect deployment lama `rapotku-sdtbgkawei.pages.dev` sesuai persetujuan pengguna.
- [x] Buat dan push repository publik baru `kristantosaputra2-jpg/RAPOR-KU-SD-HABANGOI` tanpa mengubah repository lama.
- [x] Deploy project Cloudflare Pages `sdn-tbghabangoi` dari branch `main` dengan konfigurasi Supabase project baru, lalu verifikasi halaman login produksi menampilkan identitas SD Negeri Tumbang Habangoi.
- [x] Tambahkan menu `Lupa password?`, pengiriman tautan recovery tanpa membuka dashboard Supabase, halaman `Buat password baru`, penanganan tautan kedaluwarsa, serta verifikasi 236 test dan UI HP 360px/390px.

## 2026-08-31

- [x] Analisis workbook kelas 1–3 selesai.
- [x] Analisis workbook kelas 4–6 selesai.
- [x] PRD gabungan kelas 1–6 dibuat.
- [x] `AGENTS.md` dibuat.
- [x] `Architecture.md` dibuat.
- [x] `TODO.md` dibuat sebagai local issue tracker dan project memory.

## 2026-09-02

- [x] Buat project Supabase Free `rapotku-sdn-tumbang-kawei` terpisah di region Singapore.
- [x] Verifikasi project `ACTIVE_HEALTHY`, database PostgreSQL 17.6 merespons, dan schema `public` masih kosong.
- [x] Hubungkan environment development lokal menggunakan publishable key; `.env.local` tetap diabaikan Git.
- [x] Buat repository GitHub private `kristantosaputra2-jpg/rapotku-sdn-tumbang-kawei`.
- [x] Tambahkan `@supabase/supabase-js` dan konfigurasi client yang dibuat secara lazy.
- [x] Gunakan publishable key untuk frontend baru dengan kompatibilitas legacy anon key.
- [x] Tambahkan validasi URL serta penolakan secret key dan service-role key di frontend.
- [x] Pusatkan identifier dan label tiga role MVP pada modul autentikasi.
- [x] Tambahkan unit test konfigurasi Supabase dan role pengguna.
- [x] Tambahkan Supabase CLI 2.116.0 dan migration dasar Auth/role yang sinkron dengan project cloud.
- [x] Buat `profiles`, tiga role MVP, trigger profil gagal-aman, dan RLS baca profil sendiri.
- [x] Verifikasi anonymous tidak dapat membaca `profiles` serta security/performance advisor tidak menemukan masalah.
- [x] Tambahkan database types dan service login, logout lokal, serta session persistence dengan 6 unit test.
- [x] Buat UI login merah-dominan untuk desktop/mobile dengan loading, error, tampil/sembunyikan kata sandi, dan tanpa public signup.
- [x] Verifikasi UI pada viewport 360px, 390px, 768px, dan 1280px tanpa horizontal overflow.
- [x] Tambahkan 7 UI/integration test Auth; total seluruh test saat ini 20 dan lulus.
- [x] Buat dan aktifkan akun Admin awal untuk Kristanto Saputra menggunakan akun Supabase Auth yang dikonfirmasi.
- [x] Nonaktifkan public signup pada Auth cloud dan verifikasi pengaturan tetap nonaktif setelah halaman dimuat ulang.
- [x] Verifikasi login dan logout nyata dengan akun Admin pada preview lokal yang terhubung ke Supabase cloud.
- [x] Verifikasi session persistence: akun Admin tetap masuk setelah server preview dimulai ulang dan halaman dimuat ulang.
- [x] Buat Dashboard Admin mobile-first dengan navigasi responsif dan empty state tanpa data rekaan.
- [x] Tambahkan konfigurasi Playwright dan verifikasi Dashboard Admin pada viewport 360px, 390px, 768px, dan 1280px tanpa horizontal overflow.
- [x] Buat migration `schools` untuk satu sekolah per deployment dengan audit perubahan dan RLS khusus Admin.
- [x] Verifikasi anonymous tidak memiliki akses ke `schools` serta Admin aktif memiliki izin baca/tambah/ubah tanpa izin hapus dari frontend.
- [x] Buat halaman Pengaturan Sekolah berisi seluruh field identitas wajib MVP selain upload logo yang ditunda sebagai tahap Storage terpisah.
- [x] Hubungkan Pengaturan Sekolah ke navigasi Dashboard Admin tanpa menambah dependency routing.
- [x] Verifikasi form Pengaturan Sekolah pada preview nyata yang sudah login tanpa mengisi atau mengarang data sekolah.
- [x] Tambahkan unit/integration dan E2E responsif; total 35 test unit/integration dan 8 test E2E lulus.
- [x] Simpan `SD Negeri Tumbang Kawei` sebagai nama sekolah awal di Supabase tanpa menanamkannya di source code.
- [x] Tampilkan nama sekolah sebagai identitas utama pada login, dashboard, halaman pengaturan, dan judul browser.
- [x] Tambahkan tabel branding publik terbatas yang hanya membuka nama/logo; tabel `schools` tetap tidak dapat dibaca anonymous.
- [x] Perbaiki hasil audit keamanan dengan mengganti security-definer view menjadi tabel branding ber-RLS dan sinkronisasi internal.
- [x] Gunakan gambar referensi sekolah sebagai ilustrasi login dan hero Dashboard Admin.
- [x] Verifikasi ilustrasi login tidak terpotong pada viewport HP 360px dan 390px.
- [x] Verifikasi 39 unit/integration test dan 10 E2E responsif lulus untuk dua tahap identitas serta visual baru.
- [x] Buat tabel `academic_years` dan `semesters` yang historical-safe, memakai audit, constraint, indeks periode aktif tunggal, dan RLS.
- [x] Tambahkan operasi database atomik untuk mengganti tahun ajaran atau semester aktif tanpa kondisi periode ganda.
- [x] Tambahkan validasi database agar tahun ajaran selalu berurutan dan semester aktif selalu berada pada tahun ajaran aktif, termasuk saat frontend dimanipulasi.
- [x] Verifikasi Admin dapat membuat serta mengaktifkan periode dalam transaksi uji, Guru Mapel ditolak RLS, anonymous tidak memiliki grant, dan seluruh data uji berhasil di-rollback.
- [x] Buat halaman Tahun Ajaran & Semester yang mobile-first dengan loading, retry, validasi, empty state, success/error feedback, dan navigasi Dashboard Admin.
- [x] Tampilkan ringkasan periode aktif pada Dashboard Admin tanpa mengarang tahun ajaran atau semester sekolah.
- [x] Verifikasi 53 unit/integration test dan 14 E2E responsif lulus setelah tahap Tahun Ajaran dan Semester.
- [x] Buat tabel `teacher_profiles` dengan audit, identitas opsional, status aktif, tautan akun Auth opsional, constraint, explicit grants, dan RLS.
- [x] Verifikasi Admin aktif dapat menambah guru, Guru Mapel ditolak, anonymous tidak memiliki akses, dan data uji keamanan dibersihkan.
- [x] Buat halaman Data Guru mobile-first dengan pencarian, filter, tambah, edit, nonaktifkan/aktifkan kembali, loading, error, success, dan empty state.
- [x] Pisahkan data guru dari pembuatan akun login; akun Auth dan password/invitasi tidak dibuat atau dikarang pada tahap ini.
- [x] Verifikasi 66 unit/integration test dan 18 E2E responsif lulus setelah tahap Data Guru.
- [x] Buat tabel `classes` yang terikat ke tahun ajaran dan semester, mendukung kelas 1–6, rombel, wali kelas opsional, audit, constraint, indeks, explicit grants, dan RLS.
- [x] Otomatiskan `lower_primary` untuk kelas 1–3 dan `upper_primary` untuk kelas 4–6 melalui kolom database yang dihasilkan otomatis.
- [x] Verifikasi Admin dapat menambah kelas, Guru Mapel ditolak, anonymous tidak memiliki akses, dan seluruh data uji di-rollback.
- [x] Buat halaman Data Kelas mobile-first dengan pencarian, filter periode, tambah/edit, assignment wali kelas, loading, error, success, dan empty state.
- [x] Verifikasi 78 unit/integration test dan 22 E2E responsif lulus setelah tahap Data Kelas.
- [x] Buat tabel `students` dan `class_members` terpisah agar identitas siswa serta riwayat kelas per semester aman dan tidak saling menimpa.
- [x] Tambahkan validasi NIS/NISN, audit, indeks, explicit grants, dan RLS Admin; anonymous tidak memperoleh akses data siswa.
- [x] Buat halaman Data Siswa mobile-first dengan pencarian, filter kelas/status, tambah/edit, penempatan kelas, nonaktifkan/aktifkan kembali, loading, error, success, dan empty state.
- [x] Verifikasi 89 unit/integration test dan 26 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Data Siswa.
- [x] Buat tabel `subjects` tanpa data mapel bawaan, dengan nama/kode configurable, penanda muatan lokal, urutan tampilan, status aktif, audit, constraint, explicit grants, dan RLS.
- [x] Buat halaman Mata Pelajaran mobile-first dengan pencarian, filter jenis/status, tambah/edit, nonaktifkan/aktifkan kembali, loading, retry, error, success, dan empty state.
- [x] Pertahankan assignment mata pelajaran ke kelas dan guru sebagai tahap berikutnya agar scope tahap ini tetap fokus.
- [x] Verifikasi 100 unit/integration test dan 30 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Mata Pelajaran.
- [x] Buat tabel `teacher_assignments` yang menghubungkan guru, kelas, mapel, tahun ajaran, dan semester dengan audit, status aktif, constraint satu guru per mapel/kelas, explicit grants, dan indeks lengkap.
- [x] Buat RLS agar hanya Admin aktif yang mengelola assignment, sedangkan guru dengan akun terhubung hanya membaca assignment, kelas, dan mapel aktif miliknya.
- [x] Verifikasi transaksi database bahwa Admin dapat membuat assignment dan Guru Mapel hanya melihat assignment, kelas, serta mapel yang ditugaskan; seluruh fixture uji di-rollback.
- [x] Buat halaman Penugasan Guru mobile-first dengan pencarian, filter kelas/status, tambah, ganti guru, nonaktifkan/aktifkan kembali, validasi prasyarat, loading, retry, error, success, dan empty state.
- [x] Verifikasi 108 unit/integration test dan 34 E2E responsif lulus pada 360px, 390px, 768px, dan 1280px setelah tahap Penugasan Guru.
- [x] Buat tabel `learning_outcomes` generik yang terhubung ke mata pelajaran, jenjang kelas 1–6, dan semester tanpa hardcode KI/KD.
- [x] Tambahkan audit, constraint, indeks, explicit grants, serta RLS agar Admin mengelola seluruh CP dan guru yang ditugaskan hanya mengelola CP relevan.
- [x] Verifikasi transaksi database bahwa guru yang ditugaskan dapat membaca dan mengubah CP sesuai scope; anonymous tidak memiliki akses dan fixture uji di-rollback.
- [x] Buat halaman CP / Deskripsi mobile-first dengan pencarian, filter, tambah, edit, aktif/nonaktif, validasi prasyarat, loading, retry, error, success, dan empty state.
- [x] Tunda generator deskripsi sampai workflow nilai dan formula penilaian disetujui agar aplikasi tidak mengarang aturan akademik.
- [x] Verifikasi 116 unit/integration test serta 38 E2E responsif lulus pada 360px, 390px, 768px, dan 1280px setelah tahap Master CP.
- [x] Tetapkan nilai akhir sebagai rata-rata seluruh nilai CP yang terisi pada skala 0–100.
- [x] Terapkan predikat A–D secara dinamis dari KKM dengan panjang interval `ceil((100 - KKM) / 3)` tanpa ambang nilai yang di-hardcode.
- [x] Buat tabel `grading_rules` untuk KKM per kelas, mapel, dan semester serta tabel `grade_entries` untuk nilai mentah per siswa dan CP.
- [x] Tambahkan constraint database agar nilai hanya 0–100 dan relasi siswa, kelas, CP, mapel, jenjang, serta semester selalu konsisten.
- [x] Tambahkan RLS awal: Admin dan guru yang ditugaskan dapat mengubah nilai; wali kelas membaca nilai kelasnya; anonymous tidak memiliki akses.
- [x] Verifikasi langsung di database bahwa guru yang ditugaskan dapat membaca KKM dan menyimpan nilai 88; seluruh fixture uji berhasil di-rollback.
- [x] Verifikasi 126 unit/integration test lulus termasuk nilai kosong, 0, 100, rata-rata, input tidak valid, dan batas predikat contoh.
- [x] Buat halaman Input Nilai kelas 1–3 yang menampilkan seluruh siswa sekaligus, memilih kelas/mapel/CP, dan menyimpan nilai secara massal.
- [x] Gunakan kartu siswa pada HP dan tabel pada desktop agar nama siswa serta kolom nilai tetap mudah dibaca tanpa horizontal scroll ekstrem.
- [x] Tampilkan rata-rata dan predikat langsung saat angka diubah, serta status `Menyimpan...`, sukses, dan error yang mudah dipahami.
- [x] Hubungkan Guru Mata Pelajaran langsung ke layar Input Nilai sesuai penugasan yang dibatasi RLS.
- [x] Verifikasi 130 unit/integration test dan 42 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap Input Nilai kelas 1–3.
- [x] Buat tabel `report_descriptions` yang menyimpan draft sistem dan deskripsi final guru secara terpisah dengan relasi, audit, indeks, explicit grants, dan RLS; foreign key memastikan CP sumber berasal dari mapel, jenjang, dan semester yang sama.
- [x] Gunakan CP dengan nilai tertinggi dan terendah untuk membuat draft: “Menunjukkan capaian sangat baik dalam [CP tertinggi] dan perlu meningkatkan [CP terendah].”
- [x] Pertahankan deskripsi final hasil edit guru; pembuatan ulang draft yang berbeda memerlukan konfirmasi eksplisit.
- [x] Sediakan editor deskripsi per siswa dalam modal desktop atau drawer HP dari halaman Input Nilai.
- [x] Verifikasi 136 unit/integration test dan 42 E2E responsif pada 360px, 390px, 768px, dan 1280px setelah tahap deskripsi CP editable.
- [x] Finalisasi keputusan bahwa seluruh kelas 1–6 menilai Pengetahuan dan Keterampilan per CP dengan rata-rata, predikat, dan deskripsi terpisah.
- [x] Finalisasi mode `single` untuk satu KKM seluruh mapel atau `multi` untuk KKM per mapel; KKM yang sama digunakan oleh kedua komponen.
- [x] Tambahkan `assessment_components`, `grading_settings`, dan `subject_kkm_rules` sebagai fondasi configurable dengan RLS dan explicit grants; anonymous tidak memiliki akses.
- [x] Tambahkan resolver KKM dan kalkulasi hasil per komponen serta verifikasi 141 unit/integration test lulus.
- [x] Kaitkan setiap `grade_entries` dan `report_descriptions` ke `assessment_component_id` dengan unique constraint per komponen.
- [x] Ubah Input Nilai menjadi matriks seluruh CP aktif kelas 1–6 dengan tab Pengetahuan/Keterampilan, kartu HP, dan nama siswa sticky pada desktop.
- [x] Tampilkan rata-rata, predikat, dan deskripsi terpisah untuk setiap komponen serta pilihan Single/Multi KKM bagi Admin.
- [x] Verifikasi 141 unit/integration test dan 42 E2E responsif lulus pada 360px, 390px, 768px, dan 1280px setelah pemisahan komponen nilai.
- [x] Buat Dashboard Wali Kelas dengan navigasi responsif menuju kelengkapan, absensi, ekstrakurikuler, prestasi, catatan, leger, dan preview rapor.
- [x] Terapkan RLS baca siswa aktif hanya untuk kelas yang menjadi tanggung jawab Wali Kelas dan selaraskan riwayat migration Supabase tanpa mengubah schema atau data lama.
- [x] Verifikasi Dashboard Wali Kelas dengan 187 unit/integration test dan 5 E2E khusus pada 360px, 390px, 768px, serta 1280px.
- [x] Buat Dashboard Guru Mata Pelajaran berbasis penugasan aktif dengan ringkasan kelas/mapel dan navigasi ke Input Nilai serta CP/Deskripsi.
- [x] Terapkan dan verifikasi RLS agar Guru Mata Pelajaran hanya membaca siswa serta keanggotaan kelas yang ditugaskan; data uji permission berhasil di-rollback tanpa residu.
- [x] Verifikasi 193 unit/integration test dan seluruh 97 E2E responsif lulus setelah tahap Dashboard Guru Mata Pelajaran.
- [x] Buat Import Excel siswa dengan upload `.xlsx`, mapping kolom, validasi per baris, preview responsif, dan konfirmasi sebelum simpan.
- [x] Deteksi NIS/NISN ganda di file maupun database, tanggal lahir dan jenis kelamin tidak valid, kolom wajib kosong, serta kandidat siswa yang sama.
- [x] Terapkan batch import atomik melalui fungsi database `SECURITY INVOKER`; anonymous tidak dapat mengeksekusi dan seluruh fixture transaksi berhasil di-rollback tanpa residu.
- [x] Verifikasi 203 unit/integration test, production build, serta tampilan Data Siswa dan Import tanpa horizontal overflow pada 360px, 390px, 768px, dan 1280px.
- [x] Tambahkan CI GitHub gratis untuk instalasi terkunci, typecheck, lint, format, 205 unit/integration test, dan production build pada setiap push ke `main` serta pull request.
- [x] Deploy Cloudflare Pages gratis di `rapotku-sdtbgkawei.pages.dev`, hubungkan repository RaporKu branch `main`, pasang konfigurasi Supabase build-time, dan verifikasi login responsif pada 360px serta 390px.
- [x] Tambahkan foto siswa berbingkai 3×4 dan biodata ayah, ibu, serta wali pada Data Siswa tanpa menambahkan tinggi/berat atau kondisi kesehatan.
- [x] Pisahkan biodata keluarga dari identitas inti agar Wali Kelas hanya dapat mengisi biodata siswa di kelasnya, sementara Admin tetap mengelola data inti siswa.
- [x] Simpan foto pada bucket Supabase privat `student-photos` dengan batas JPG/PNG 2 MB, RLS, dan URL sementara; anonymous tidak memiliki akses tabel.

## 2026-09-11

- [x] Atur jarak sampul final: judul–logo 6 baris (28,8 mm), logo–identitas siswa 4 baris (19,2 mm), identitas sekolah–kementerian 2 baris (9,6 mm), kementerian–batas bawah 2 baris (9,6 mm), dan ruang fleksibel hanya setelah identitas siswa; cetak A4, test, lint, typecheck, format, dan build lulus.
- [x] Rapikan sampul: logo diperkecil menjadi 36 mm dan tepat di tengah horizontal, jarak atas/bawah sama-sama 10 mm, serta jarak identitas sekolah ke kementerian 8 mm; cetak tetap muat A4 tanpa overflow.
- [x] Susun ulang sampul sesuai denah pengguna menjadi judul, logo, identitas siswa, identitas sekolah, lalu kementerian; perbesar logo Tut Wuri dua kali menjadi 72 mm dan verifikasi seluruh isi tetap muat pada A4 tanpa overflow.
- [x] Ganti aset Tut Wuri Handayani dengan logo resmi yang diunggah pengguna, bersihkan latar kotak, dan tampilkan tanpa pemotongan atau filter warna; 226 test, lint, typecheck, format, dan build lulus.
- [x] Ubah preview dan cetak rapor menjadi format resmi A4 berdasarkan contoh sekolah tanpa menyalin data siswa dari gambar referensi.
- [x] Gunakan logo Tut Wuri Handayani yang disediakan pengguna pada sampul dan kepala halaman rapor.
- [x] Hubungkan biodata keluarga, foto siswa 3×4, wali kelas, nilai Pengetahuan/Keterampilan, ekstrakurikuler, prestasi, ketidakhadiran, dan catatan ke template cetak.
- [x] Pertahankan keputusan MVP untuk tidak menampilkan tinggi/berat badan maupun kondisi kesehatan.
- [x] Verifikasi PDF contoh lima halaman berukuran A4, seluruh 220 unit/integration test, lint, typecheck, format, dan production build.
- [x] Koreksi halaman sampul dan identitas: lambang Tut Wuri berada di tengah, judul lengkap menjadi headline utama, serta foto 3×4 dipindah ke bawah berdampingan dengan tanda tangan kepala sekolah agar dapat terkena satu stempel.
- [x] Tukar urutan sampul sesuai koreksi pengguna: judul lengkap berada di atas dan lambang Tut Wuri tepat di tengah di bawah judul.
- [x] Kunci struktur dan field rapor A4 yang telah disetujui ke `docs/report-templates.md` serta sinkronkan catatan arsitektur.
- [x] Verifikasi template pada Google Chrome desktop dan simulasi Chrome Android Pixel 5; tetapkan HTML print/Save as PDF sebagai engine gratis MVP.
- [x] Dokumentasikan 25 tabel database yang telah diterapkan beserta relasi, constraint, function, RLS, Storage foto siswa, dan alur data rapor pada `docs/database.md`; tidak ada schema atau data produksi yang diubah.
- [x] Dokumentasikan izin Admin, Wali Kelas, Guru Mata Pelajaran, dan anonymous pada 25 tabel, function khusus, serta Storage foto di `docs/permissions.md`; catat audit role ganda dan akses nama mapel pada preview tanpa mengubah policy produksi.
- [x] Finalisasi hak akses nilai: guru boleh merangkap Wali Kelas dan Guru Mapel; Wali Kelas dapat menginput seluruh nilai mapel kelasnya walaupun tanpa Guru Mapel, Guru Mapel hanya scope penugasannya, dan Admin seluruh modul.
- [x] Tambahkan menu Input Nilai pada Dashboard Wali Kelas serta filter kelas dan mata pelajaran sesuai role tanpa mengubah workflow input seluruh siswa sekaligus.
- [x] Terapkan delapan policy RLS gabungan untuk mata pelajaran, CP, KKM, nilai, dan deskripsi; policy tambahan dikonsolidasikan agar tidak menambah peringatan multiple permissive policy.
- [x] Verifikasi definisi policy produksi, security/performance advisor, 226 unit/integration test, typecheck, lint, format, dan production build. Uji login nyata sebagai Wali Kelas menunggu akun role tersebut terhubung.

---

# Instruksi untuk AI Agent

Sebelum memulai task:

1. Baca `TODO.md`.
2. Baca `AGENTS.md`.
3. Baca PRD terbaru.
4. Baca `Architecture.md` jika perubahan menyentuh struktur sistem.
5. Pilih task dengan prioritas tertinggi yang belum selesai.
6. Ubah status task menjadi `[/]` saat mulai.
7. Jangan mengerjakan task lain yang tidak terkait tanpa alasan.
8. Jalankan test yang relevan.
9. Setelah selesai, ubah menjadi `[x]`.
10. Tambahkan task baru jika ditemukan requirement teknis baru.
11. Jangan menghapus histori pekerjaan.
12. Jangan menandai task selesai hanya karena kode sudah ditulis; harus diuji.

---

> **Prinsip utama:** `TODO.md` harus selalu mencerminkan keadaan repository yang sebenarnya. Jika status di file berbeda dengan kondisi kode, perbaiki file ini.
