# PRD — Aplikasi Rapor SD Kelas 1–6

**Versi:** 0.4  
**Status:** Requirement Utama Gabungan Kelas 1–3 dan 4–6  
**Tahap:** Belum Coding

---

# 1. Ringkasan Produk

Aplikasi web rapor SD untuk kelas 1–6 yang dirancang sebagai alternatif workflow rapor berbasis Excel atau sistem yang bergantung pada perangkat/server lokal.

Aplikasi dibuat untuk satu sekolah per deployment, dengan kemampuan konfigurasi identitas sekolah sehingga source code yang sama dapat digunakan kembali untuk sekolah lain dengan repository, database, domain, dan deployment yang berbeda.

Sekolah awal:

**SD Negeri Tumbang Kawei**

Identitas seperti NPSN, alamat, kepala sekolah, kecamatan, kabupaten, dan data lainnya dapat diisi kemudian melalui halaman Pengaturan Sekolah.

---

# 2. Tujuan Produk

Produk bertujuan membuat proses pengisian rapor:

- lebih sederhana;
- bisa dilakukan dari mana saja;
- dapat digunakan dari HP;
- tidak bergantung pada laptop Dapodik/server lokal;
- lebih ramah bagi guru dengan keterampilan IT terbatas;
- tidak menggunakan workflow Excel yang kompleks;
- lebih mudah beradaptasi jika format rapor berubah.

Prinsip utama:

> Input sekali, digunakan di seluruh sistem.

> Kompleksitas pengolahan nilai dilakukan sistem, bukan dibebankan kepada guru.

---

# 3. Model Deployment

Setiap sekolah memiliki:

- 1 repository GitHub
- 1 project Supabase
- 1 database sendiri
- 1 deployment Cloudflare
- 1 domain/subdomain sendiri

Jika sekolah lain memesan aplikasi:

- source code dasar dapat digunakan kembali;
- repository berbeda;
- database berbeda;
- konfigurasi sekolah berbeda;
- domain berbeda.

Model ini dipilih agar:

- data sekolah tidak tercampur;
- keamanan lebih mudah;
- maintenance lebih sederhana;
- deployment lebih fleksibel.

---

# 4. Stack Teknologi

## Backend dan Database

- Supabase PostgreSQL
- Supabase Authentication
- Supabase Row Level Security
- Supabase Storage jika diperlukan

## Hosting

- Cloudflare Pages
- Cloudflare Workers hanya jika diperlukan

## Repository

- GitHub

## Development

- VS Code
- Codex
- ChatGPT Work

---

# 5. Masalah yang Ingin Diselesaikan

## 5.1 Ketergantungan terhadap Dapodik/server lokal

Sistem rapor resmi atau aplikasi tertentu sering membutuhkan koneksi dengan perangkat yang digunakan sebagai server lokal.

Guru menjadi tidak fleksibel dalam bekerja.

## 5.2 Sulit digunakan dari luar sekolah

Guru membutuhkan aplikasi yang dapat digunakan dari:

- sekolah;
- rumah;
- perjalanan;
- HP;
- laptop lain.

## 5.3 Kurang ramah untuk sekolah pedalaman

Sekolah di wilayah pedalaman membutuhkan sistem yang:

- tidak memerlukan konfigurasi jaringan rumit;
- tidak membutuhkan server lokal;
- ringan;
- mudah dipahami;
- dapat digunakan melalui internet biasa.

## 5.4 Workflow Excel terlalu kompleks

Workbook referensi memiliki banyak:

- sheet;
- formula;
- referensi antar-sheet;
- tabel;
- konfigurasi.

Pengguna aplikasi baru tidak perlu melihat struktur tersebut.

## 5.5 Risiko formula rusak

Workbook referensi menunjukkan error seperti:

- `#DIV/0!`
- `#REF!`
- `#NAME?`

Aplikasi web harus menggantinya dengan:

- validasi;
- status data belum lengkap;
- pesan error sederhana;
- perhitungan aman.

---

# 6. Target Pengguna

## 6.1 Admin Sekolah

Hak utama:

- mengatur identitas sekolah;
- membuat akun;
- mengatur role;
- mengatur tahun ajaran;
- semester;
- kelas;
- guru;
- siswa;
- mata pelajaran;
- penugasan guru;
- wali kelas;
- import data siswa;
- konfigurasi rapor;
- memantau kelengkapan.

## 6.2 Wali Kelas

Hak utama:

- melihat siswa kelas sendiri;
- melihat dan menginput nilai seluruh mapel di kelas sendiri, termasuk ketika belum ada Guru Mata Pelajaran;
- menghasilkan dan mengedit deskripsi nilai kelas sendiri;
- mengisi absensi;
- mengisi ekstrakurikuler;
- mengisi prestasi;
- mengisi catatan wali kelas;
- memeriksa kelengkapan;
- preview rapor;
- cetak rapor;
- cetak leger.

## 6.3 Guru Mata Pelajaran

Hak utama:

- melihat kelas yang ditugaskan;
- melihat seluruh siswa;
- mengisi nilai;
- memilih atau mengelola CP/kompetensi;
- menghasilkan deskripsi otomatis;
- mengedit deskripsi;
- menyimpan nilai.

Tidak boleh mengubah nilai mapel lain.

Seorang guru SD boleh menjadi Wali Kelas sekaligus menerima penugasan mata pelajaran. Sebagai Wali Kelas, guru dapat menginput seluruh nilai pada kelas yang menjadi tanggung jawabnya. Sebagai Guru Mata Pelajaran, akses di kelas lain tetap hanya untuk mapel yang ditugaskan.

---

# 7. Kelompok Template Rapor

Aplikasi menggunakan dua kelompok utama.

## 7.1 Lower Primary

Untuk:

- Kelas 1
- Kelas 2
- Kelas 3

Kode konseptual:

`lower_primary`

## 7.2 Upper Primary

Untuk:

- Kelas 4
- Kelas 5
- Kelas 6

Kode konseptual:

`upper_primary`

Kedua kelompok menggunakan data sekolah, guru, siswa, autentikasi, dan infrastruktur yang sama.

Perbedaannya berada pada:

- aturan penilaian;
- komponen nilai;
- struktur capaian;
- algoritma deskripsi;
- template rapor;
- struktur leger.

---

# 8. Pengaturan Sekolah

Field awal:

- nama sekolah;
- NPSN;
- alamat;
- desa/kelurahan;
- kecamatan;
- kabupaten/kota;
- provinsi;
- kode pos;
- email;
- nama kepala sekolah;
- NIP kepala sekolah;
- logo bila diperlukan.

Semua dapat diedit tanpa mengubah source code.

---

# 9. Tahun Ajaran dan Semester

Contoh:

- 2026/2027
- Semester 1
- Semester 2

Sistem harus mengetahui periode aktif.

Data rapor harus terikat pada:

- tahun ajaran;
- semester;
- kelas;
- siswa.

---

# 10. Data Guru

Minimal:

- nama;
- NIP/NUPTK bila ada;
- email/login;
- role;
- mata pelajaran;
- kelas yang diampu;
- status wali kelas.

---

# 11. Data Kelas

Mendukung kelas 1–6.

Field:

- tingkat kelas;
- nama rombel;
- wali kelas;
- tahun ajaran;
- semester;
- template group.

Contoh:

- Kelas 1 → `lower_primary`
- Kelas 4 → `upper_primary`

---

# 12. Data Siswa

Minimal:

- nama lengkap;
- NIS;
- NISN;
- jenis kelamin;
- tempat lahir;
- tanggal lahir;
- agama;
- alamat;
- nama ayah;
- nama ibu;
- wali bila ada.

Field hanya ditambah jika benar-benar dibutuhkan output rapor.

## 12.1 Naik Kelas dan Lulus

Setelah Semester 2 berakhir, Admin dapat:

- menaikkan siswa kelas 1–5 ke kelas tujuan pada Semester 1 tahun ajaran berikutnya tanpa menginput ulang identitas;
- meluluskan siswa kelas 6 sehingga siswa keluar dari daftar aktif;
- memproses siswa terpilih setelah melihat kelas asal dan kelas tujuan;
- mempertahankan seluruh nilai, rapor, dan riwayat kelas lama.

Siswa lulus tidak dihapus permanen dari database.

---

# 13. Import Siswa dari Excel

Admin dapat mengimpor siswa.

Workflow:

`Data Siswa → Import Excel → Upload → Mapping Kolom → Preview → Validasi → Simpan`

Validasi:

- NIS ganda;
- NISN ganda;
- data kosong;
- format tanggal;
- mapping kolom.

---

# 14. Mata Pelajaran

Daftar mapel harus configurable.

Mapel agama secara default mengikuti agama pada biodata siswa. Admin atau Wali Kelas dapat memilih satu mapel agama pengganti untuk seorang siswa pada semester tertentu tanpa mengubah biodata agamanya. CP, nilai, deskripsi, kelengkapan, leger, dan rapor siswa harus mengikuti mapel agama yang dipilih tersebut.

Contoh kandidat:

- Pendidikan Agama
- Pendidikan Pancasila
- Bahasa Indonesia
- Matematika
- IPAS bila digunakan
- Seni
- PJOK
- Muatan Lokal

Nama mapel tidak boleh sepenuhnya hardcoded.

---

# 15. Capaian Pembelajaran / Kompetensi

Sistem tidak boleh terikat secara permanen pada istilah KI/KD K13.

Gunakan konsep generik:

`learning_outcomes`

Satu learning outcome dapat memiliki:

- kode;
- judul;
- deskripsi;
- mata pelajaran;
- tingkat kelas;
- semester;
- status aktif.

Dengan demikian sistem lebih mudah menyesuaikan perubahan kurikulum.

---

# 16. Input Nilai Umum

Guru mengisi nilai melalui halaman aplikasi.

Bukan spreadsheet Excel.

Tetapi daftar seluruh siswa tetap terlihat dalam satu layar.

Workflow umum:

`Dashboard → Kelas → Mapel → Daftar Siswa → Isi Nilai → Generate Deskripsi → Edit → Simpan`

Penilaian semester dibagi menjadi:

- **Formatif**: penilaian harian, latihan, tugas, dan penilaian proses lain;
- **Sumatif**: Penilaian Tengah Semester dan Penilaian Akhir Semester.

Setiap penilaian tetap terkait dengan TP/CP serta komponen Pengetahuan atau Keterampilan. Nilai akhir CP dihitung setelah Formatif, PTS, dan PAS tersedia:

`rata-rata Formatif × 40% + rata-rata PTS/PAS × 60%`

PTS dan PAS berbobot sama di dalam rata-rata Sumatif. Formatif dapat memiliki lebih dari satu catatan nilai; PTS dan PAS masing-masing satu per CP dan komponen.

Pada desktop dapat menggunakan tabel.

Pada HP:

- tabel dibuat responsif;
- detail bisa dibuka drawer/modal;
- tombol simpan mudah disentuh.

---

# 17. Sistem Penilaian Kelas 1–3

Kelas 1–3 menggunakan workflow lebih sederhana.

Fokus pada:

- nilai mapel;
- capaian pembelajaran;
- deskripsi capaian;
- status kelengkapan.

Tampilan kandidat:

| No  | Siswa | Nilai | CP  | Deskripsi | Status |
| --- | ----- | ----: | --- | --------- | ------ |

Deskripsi dibuat otomatis tetapi dapat diedit guru.

Keputusan terbaru sekolah pada 3 September 2026:

- setiap CP aktif memiliki nilai Pengetahuan dan nilai Keterampilan;
- jumlah kolom mengikuti jumlah CP aktif dan tidak dibatasi lima;
- rata-rata, predikat, dan deskripsi Pengetahuan dihitung serta ditampilkan terpisah dari Keterampilan;
- kedua bagian memakai KKM yang sama untuk mata pelajaran tersebut.

Sekolah memilih salah satu konfigurasi KKM per semester:

- `single`: satu KKM berlaku untuk semua mata pelajaran;
- `multi`: setiap mata pelajaran memiliki KKM sendiri.

---

# 18. Sistem Penilaian Kelas 4–6

Kelas 4–6 membutuhkan struktur yang lebih kompleks berdasarkan hasil bedah workbook referensi.

Workbook lama memperlihatkan pemisahan:

- Pengetahuan
- Keterampilan
- Nilai
- Predikat
- Deskripsi

Sistem baru tidak harus meniru istilah lama secara permanen, tetapi perlu mampu mendukung struktur tersebut bila template membutuhkan.

## 18.1 Struktur Kandidat

Tab atau section:

- Pengetahuan
- Keterampilan
- Deskripsi

atau model generik:

- Komponen Penilaian A
- Komponen Penilaian B
- Hasil Akhir

## 18.2 Detail Kompetensi

Workbook kelas 4 menyimpan nilai sampai tingkat KD/kompetensi.

Aplikasi baru harus mampu menangani nilai per learning outcome bila dibutuhkan.

Contoh:

| Siswa | CP/KD 1 | CP/KD 2 | CP/KD 3 | Nilai Akhir | Predikat |
| ----- | ------: | ------: | ------: | ----------: | -------- |

## 18.3 Pengolahan Nilai

Sistem menghitung otomatis:

- nilai akhir;
- predikat;
- capaian terbaik;
- capaian yang perlu ditingkatkan;
- kandidat deskripsi.

Pemisahan Pengetahuan dan Keterampilan, perhitungan rata-rata, predikat, serta deskripsi mengikuti keputusan yang sama dengan kelas 1–3. Jumlah CP tidak dibatasi lima dan mengikuti CP yang diaktifkan untuk semester tersebut.

---

# 19. Deskripsi CP Otomatis

Deskripsi otomatis termasuk fitur inti.

Prinsip:

- sistem menghasilkan draft;
- guru dapat mengedit;
- guru tetap menentukan hasil final.

Konsep sederhana:

`Capaian terbaik + capaian yang perlu ditingkatkan → deskripsi otomatis`

Sistem tidak boleh menyimpan hasil otomatis sebagai final tanpa kontrol guru.

---

# 20. Penilaian Sikap

Workbook referensi K13 memiliki:

- spiritual;
- sosial.

Fitur ini tidak langsung dianggap wajib.

Status:

**configurable**

Jika template rapor yang digunakan membutuhkan sikap, modul dapat diaktifkan.

Jika tidak, modul dapat dinonaktifkan.

---

# 21. Absensi

Wali kelas mengisi:

- sakit;
- izin;
- tanpa keterangan.

---

# 22. Ekstrakurikuler

Field kandidat:

- nama kegiatan;
- predikat/capaian;
- deskripsi.

---

# 23. Prestasi

Prestasi tetap dimasukkan.

Field kandidat:

- jenis prestasi;
- tingkat;
- keterangan;
- tanggal/tahun bila diperlukan.

---

# 24. Catatan Wali Kelas

Wali kelas memiliki field catatan bebas.

Perlu batas karakter yang wajar agar layout cetak tidak rusak.

---

# 25. Data Kesehatan

Tidak termasuk MVP.

Tidak perlu:

- tinggi badan;
- berat badan;
- kondisi gigi;
- penglihatan;
- pendengaran.

Dapat ditambahkan kemudian bila format rapor mewajibkan.

---

# 26. Review Kelengkapan

Status per siswa:

- Belum Diisi
- Sebagian
- Lengkap
- Siap Cetak

Checklist kandidat:

- identitas;
- semua mapel;
- CP/deskripsi;
- absensi;
- ekstrakurikuler;
- prestasi;
- catatan wali kelas.

---

# 27. Preview Rapor

Wali kelas dapat:

- memilih siswa;
- melihat preview;
- memeriksa data;
- melihat nilai;
- memeriksa deskripsi;
- melihat halaman akhir.

Preview harus mendekati hasil cetak sebenarnya.

---

# 28. Output Rapor

Aplikasi memisahkan:

1. data;
2. aturan nilai;
3. template output.

Dengan demikian format baru dapat dibuat tanpa mengganti seluruh aplikasi.

## Kandidat halaman output

### Halaman Sampul

- logo;
- nama sekolah;
- nama siswa;
- NIS/NISN;
- identitas sekolah.

### Halaman Identitas

- data siswa;
- orang tua/wali;
- kepala sekolah;
- foto bila diperlukan.

### Halaman Hasil Belajar

- siswa;
- kelas;
- semester;
- tahun ajaran;
- mapel;
- nilai;
- predikat bila digunakan;
- CP/deskripsi;
- ekstrakurikuler;
- prestasi;
- absensi;
- catatan;
- tanda tangan.

---

# 29. Leger

Leger wajib ada.

## Kelas 1–3

Struktur lebih sederhana.

Kandidat:

- siswa;
- nilai mapel;
- status;
- ringkasan capaian.

## Kelas 4–6

Lebih kompleks.

Dapat mencakup:

- siswa;
- semua mapel;
- nilai per komponen;
- nilai akhir;
- predikat;
- deskripsi;
- sikap bila aktif.

Leger merupakan output otomatis.

Guru tidak mengisi leger secara manual.

Fitur:

- pilih kelas;
- pilih semester;
- lihat tabel;
- print;
- export;
- PDF bila diperlukan.

---

# 30. Modul APIK dari Workbook Lama

Workbook kelas 4 memiliki modul `APIK`.

Fungsi dasarnya adalah pengolahan nilai/kompetensi.

Keputusan:

**Tidak dibuat sebagai menu khusus.**

Fungsi tersebut dipindahkan menjadi business logic aplikasi di belakang layar.

Guru hanya melihat input yang relevan.

---

# 31. Role dan Permission

## Admin

Boleh mengelola:

- sekolah;
- guru;
- siswa;
- kelas;
- mapel;
- penugasan;
- import;
- konfigurasi;
- laporan.

## Wali Kelas

Boleh:

- kelas sendiri;
- siswa kelas sendiri;
- komponen wali kelas;
- melihat dan menginput nilai seluruh mapel kelas sendiri;
- menghasilkan dan mengedit deskripsi nilai kelas sendiri;
- preview;
- rapor;
- leger.

## Guru Mapel

Boleh:

- mapel sendiri;
- kelas yang ditugaskan;
- nilai;
- learning outcome;
- deskripsi.

Tidak boleh mengedit mapel guru lain.

---

# 32. Prinsip Mobile-First

Aplikasi harus nyaman digunakan melalui HP.

Target:

- browser mobile;
- tidak perlu instalasi;
- form sederhana;
- tombol besar;
- tabel responsif;
- loading ringan;
- minim animasi;
- hemat bandwidth.

---

# 33. Kondisi Koneksi

Offline penuh belum MVP.

Tetapi sistem harus:

- menunjukkan status koneksi;
- tidak menampilkan error teknis;
- menyimpan data cepat;
- mencegah kehilangan input sebisa mungkin;
- memberi warning bila penyimpanan gagal.

PWA/offline dapat menjadi versi berikutnya.

---

# 34. Keamanan

Minimal:

- Supabase Auth;
- Row Level Security;
- role-based access;
- sekolah menggunakan database terpisah;
- user hanya dapat membaca/mengedit data sesuai hak;
- password tidak disimpan manual.

---

# 35. Audit Trail Minimal

Simpan:

- siapa mengubah nilai;
- kapan diubah;
- siapa mengubah deskripsi;
- waktu update terakhir.

Tidak perlu audit kompleks pada MVP.

---

# 36. Struktur Data Awal

Belum final.

Kandidat:

- schools
- users
- teacher_profiles
- academic_years
- semesters
- classes
- class_members
- students
- subjects
- teacher_assignments
- learning_outcomes
- assessment_components
- grade_entries
- report_descriptions
- attitude_entries
- attendance
- extracurriculars
- student_extracurriculars
- achievements
- homeroom_notes
- report_status
- report_templates

Schema final dibuat setelah seluruh alur kelas 1–6 selesai dibedah.

---

# 37. Prinsip Database

Data tidak boleh menggantung pada template cetak.

Pisahkan:

## Master Data

- sekolah
- pengguna
- guru
- siswa
- kelas
- mapel

## Academic Data

- learning outcome
- assessment component
- nilai
- deskripsi
- absensi
- ekstrakurikuler
- prestasi

## Output Configuration

- template kelas 1–3
- template kelas 4–6
- aturan predikat
- aturan deskripsi
- layout

---

# 38. Prioritas MVP

## P0

Wajib:

- login;
- role;
- data sekolah;
- tahun ajaran;
- semester;
- guru;
- kelas 1–6;
- siswa;
- import Excel;
- mapel;
- penugasan;
- input nilai seluruh siswa;
- learning outcome;
- deskripsi otomatis editable;
- absensi;
- ekstrakurikuler;
- prestasi;
- catatan wali kelas;
- review kelengkapan;
- preview;
- PDF/cetak;
- leger;
- dukungan template kelas 1–3;
- dukungan template kelas 4–6.

## P1

Setelah stabil:

- export Excel lengkap;
- batch print;
- PWA;
- backup tambahan;
- template manager lanjutan.

## P2

Future:

- Dapodik integration;
- portal orang tua;
- portal siswa;
- WhatsApp;
- LMS;
- bank soal;
- QR;
- aplikasi native;
- multi-school SaaS.

---

# 39. User Flow

## Admin

`Login → Setup Sekolah → Tahun Ajaran → Guru → Kelas → Siswa → Mapel → Penugasan`

## Guru Kelas 1–3

`Login → Kelas → Mapel → Daftar Siswa → Input Nilai → Generate Deskripsi → Edit → Simpan`

## Guru Kelas 4–6

`Login → Kelas → Mapel → Pilih Komponen/CP → Input Seluruh Siswa → Sistem Hitung → Generate Deskripsi → Edit → Simpan`

## Wali Kelas

`Login → Kelas Saya → Input Nilai → Pantau Kelengkapan → Absensi/Ekskul/Prestasi/Catatan → Preview → Cetak`

---

# 40. Definition of Done MVP

MVP dianggap selesai bila:

1. Admin dapat mengubah identitas sekolah tanpa source code.
2. Admin dapat membuat kelas 1–6.
3. Admin dapat import siswa Excel.
4. Admin dapat mengatur guru dan penugasan.
5. Guru hanya melihat mapel/kelas yang ditugaskan.
6. Guru dapat mengisi nilai seluruh siswa dalam satu layar.
7. Kelas 1–3 memiliki workflow penilaian yang sederhana.
8. Kelas 4–6 dapat menggunakan komponen penilaian yang lebih rinci.
9. Sistem mendukung learning outcome/CP.
10. Sistem dapat menghasilkan deskripsi otomatis.
11. Deskripsi dapat diedit guru.
12. Wali kelas dapat mengisi absensi.
13. Wali kelas dapat mengisi ekstrakurikuler.
14. Wali kelas dapat mengisi prestasi.
15. Wali kelas dapat menulis catatan.
16. Sistem dapat memeriksa kelengkapan rapor.
17. Sistem dapat preview rapor.
18. Sistem dapat mencetak/PDF.
19. Sistem dapat menghasilkan leger kelas 1–3.
20. Sistem dapat menghasilkan leger kelas 4–6.
21. Aplikasi dapat digunakan dari HP.
22. Tidak membutuhkan laptop Dapodik/server lokal.
23. Data tersimpan pada Supabase sekolah.
24. Format kelas 1–3 dan 4–6 dapat dikelola sebagai template berbeda.

---

# 41. Di Luar Scope MVP

Belum dibuat:

- integrasi Dapodik;
- sinkronisasi Kemendikbud;
- aplikasi Android native;
- portal orang tua;
- portal siswa;
- WhatsApp otomatis;
- LMS;
- bank soal;
- absensi QR;
- face recognition;
- pembayaran;
- AI chatbot umum;
- SaaS multi-sekolah satu database;
- buku induk lengkap;
- data kesehatan;
- offline penuh.

---

# 42. Tahap Berikutnya

Belum coding.

Tahap berikutnya:

1. Bedah detail input nilai kelas 1–3.
2. Bedah detail input nilai kelas 4–6.
3. Bedah mekanisme CP/deskripsi kedua kelompok.
4. Bedah RAPORT.
5. Bedah DATA RAPORT.
6. Bedah DES RAPORT.
7. Bedah LEGER.
8. Petakan field final.
9. Update PRD.
10. Susun database schema.
11. Susun role permission matrix.
12. Susun user flow final.
13. Susun technical specification.
14. Baru mulai implementasi.

---

# 43. Status Proyek

**PRD gabungan kelas 1–6:** Draft utama selesai.

**Sudah dianalisis:**

- Referensi workbook kelas 1
- Referensi workbook kelas 4
- Perbedaan struktur kelas 1–3 dan 4–6
- Role
- Workflow
- Kandidat MVP
- Output dasar
- Leger
- Deployment

**Belum dilakukan:**

- coding;
- Supabase setup;
- GitHub setup;
- Cloudflare setup;
- database schema final;
- UI final;
- deployment.
