# Permission dan RLS RaporKu

**Status:** Dokumentasi izin yang telah diterapkan  
**Terakhir diperbarui:** 11 September 2026  
**Sumber produk:** `prd.md`, `AGENTS.md`, dan `Architecture.md`  
**Sumber teknis:** `supabase/migrations/`

## 1. Tujuan

Dokumen ini menjelaskan hak akses RaporKu yang benar-benar telah diterapkan. PRD tetap menjadi acuan kebutuhan produk, sedangkan migration SQL menjadi acuan perilaku keamanan database saat ini.

Deployment MVP hanya melayani satu sekolah. Izin tetap dibatasi berdasarkan role, status akun, kelas, mata pelajaran, semester, dan penugasan.

## 2. Prinsip Keamanan

- Supabase Auth memastikan identitas pengguna.
- `profiles.role` menyimpan role utama: `admin`, `homeroom_teacher`, atau `subject_teacher`.
- `profiles.is_active` harus bernilai aktif agar pengguna memperoleh akses aplikasi.
- `teacher_profiles.user_id` menghubungkan akun Auth dengan profil guru.
- `teacher_assignments` menjadi sumber izin Guru Mata Pelajaran.
- `classes.homeroom_teacher_id` menjadi sumber tanggung jawab Wali Kelas.
- Row Level Security (RLS) menjadi pengaman utama walaupun frontend dimanipulasi.
- Menu yang disembunyikan atau tombol yang dinonaktifkan hanya membantu UX dan bukan pengganti RLS.
- Grant menentukan operasi yang boleh diminta kepada Data API; RLS menentukan baris mana yang boleh diakses.
- Frontend hanya boleh memakai publishable key. Secret key dan service-role key tidak boleh berada di browser atau repository.
- Data otorisasi tidak boleh dipercaya dari metadata yang dapat diubah pengguna.

## 3. Syarat Akses Dasar

Pengguna internal harus memenuhi seluruh syarat berikut:

1. berhasil login melalui Supabase Auth;
2. memiliki baris `profiles` dengan ID yang sama dengan `auth.uid()`;
3. profil berstatus aktif;
4. untuk akses guru, akun terhubung ke `teacher_profiles.user_id` yang aktif;
5. untuk Guru Mata Pelajaran, terdapat `teacher_assignments` aktif yang cocok;
6. untuk Wali Kelas, guru ditetapkan pada `classes.homeroom_teacher_id` untuk kelas dan semester terkait.

Role saja tidak cukup untuk membuka data kelas atau mata pelajaran.

## 4. Ringkasan Role

### 4.1 Admin

Admin aktif mengelola konfigurasi dan data sekolah, termasuk periode akademik, guru, kelas, siswa, mata pelajaran, penugasan, CP, KKM, nilai, biodata, dan isi rapor.

Beberapa tabel sengaja tidak menyediakan operasi hapus. Data dinonaktifkan atau dipertahankan agar riwayat akademik tidak hilang.

### 4.2 Wali Kelas

Wali Kelas aktif hanya bekerja pada kelas yang menjadi tanggung jawabnya. Wali Kelas dapat:

- membaca siswa dan keanggotaan kelas sendiri;
- membaca dan menginput nilai seluruh mata pelajaran kelas sendiri, termasuk ketika belum ada Guru Mata Pelajaran;
- membuat dan mengedit deskripsi nilai kelas sendiri;
- mengelola biodata keluarga dan foto siswa kelas sendiri;
- mengelola absensi, ekstrakurikuler siswa, prestasi, catatan wali kelas, serta konfirmasi kelengkapan kelas sendiri;
- membentuk preview, cetak rapor, dan leger dari data yang boleh dibaca.

Seorang guru boleh menjadi Wali Kelas sekaligus menerima assignment mata pelajaran. Hak Wali Kelas berlaku untuk seluruh mapel di kelasnya, sedangkan assignment membatasi pekerjaan Guru Mata Pelajaran di kelas lain.

### 4.3 Guru Mata Pelajaran

Guru Mata Pelajaran aktif hanya bekerja pada kombinasi kelas, mata pelajaran, dan semester yang memiliki penugasan aktif. Guru dapat:

- membaca kelas, mata pelajaran, siswa, dan keanggotaan yang ditugaskan;
- membaca dan mengelola CP yang cocok dengan mapel, tingkat kelas, dan semester penugasannya;
- membaca, menambah, mengubah, dan menghapus nilai pada scope penugasannya;
- membaca, menambah, dan mengubah deskripsi rapor pada scope penugasannya;
- membaca konfigurasi komponen dan KKM yang diperlukan untuk perhitungan.

Guru tidak dapat mengubah nilai atau deskripsi mata pelajaran guru lain.

### 4.4 Anonymous

Pengguna yang belum login hanya dapat membaca `public_school_identity` untuk menampilkan nama dan logo sekolah pada halaman login.

Anonymous tidak boleh membaca data sekolah internal, akun, guru, siswa, kelas, nilai, rapor, atau foto siswa.

## 5. Matriks Izin Tabel

Keterangan: `R` membaca, `C` menambah, `U` mengubah, `D` menghapus, dan `—` tidak diizinkan. Tulisan dalam kurung menunjukkan pembatas baris.

| Data                                    | Admin              | Wali Kelas                    | Guru Mapel                                                | Anonymous |
| --------------------------------------- | ------------------ | ----------------------------- | --------------------------------------------------------- | --------- |
| `profiles`                              | R (profil sendiri) | R (profil sendiri)            | R (profil sendiri)                                        | —         |
| `public_school_identity`                | R                  | R                             | R                                                         | R         |
| `schools`                               | R/C/U              | R                             | R                                                         | —         |
| `academic_years`, `semesters`           | R/C/U              | R                             | R                                                         | —         |
| `teacher_profiles`                      | R/C/U              | R                             | R                                                         | —         |
| `classes`                               | R/C/U              | R (kelas sendiri)             | R (kelas ditugaskan)                                      | —         |
| `students`                              | R/C/U              | R (kelas sendiri)             | R (kelas ditugaskan, siswa aktif)                         | —         |
| `class_members`                         | R/C/U/D            | R (kelas sendiri)             | R (kelas ditugaskan)                                      | —         |
| `student_year_end_actions`              | R/C melalui fungsi | —                             | —                                                         | —         |
| `student_biodata`                       | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |
| `subjects`                              | R/C/U              | R (mapel aktif)               | R (mapel ditugaskan dan aktif)                            | —         |
| `student_religion_subject_overrides`    | R/C/U/D            | R/C/U/D (kelas sendiri)       | R (kelas/mapel ditugaskan)                                | —         |
| `teacher_assignments`                   | R/C/U              | R (milik akun yang terhubung) | R (milik akun yang terhubung)                             | —         |
| `learning_outcomes`                     | R/C/U              | R (CP aktif sesuai kelas)     | R/C/U (scope penugasan; hanya CP aktif yang dapat dibaca) | —         |
| `assessment_components`                 | R/C/U              | R (komponen aktif)            | R (komponen aktif)                                        | —         |
| `assessment_items`, `assessment_scores` | R/C/U              | R/C/U (kelas sendiri)         | R/C/U (scope penugasan)                                   | —         |
| `grading_settings`, `subject_kkm_rules` | R/C/U              | R                             | R                                                         | —         |
| `grading_rules`                         | R/C/U              | R (kelas sendiri)             | R (scope penugasan)                                       | —         |
| `grade_entries`                         | R/C/U/D            | R/C/U/D (kelas sendiri)       | R/C/U/D (scope penugasan)                                 | —         |
| `report_descriptions`                   | R/C/U              | R/C/U (kelas sendiri)         | R/C/U (scope penugasan)                                   | —         |
| `attendance`                            | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |
| `extracurriculars`                      | R/C/U              | R                             | R                                                         | —         |
| `student_extracurriculars`              | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |
| `achievements`                          | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |
| `homeroom_notes`                        | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |
| `report_completion_confirmations`       | R/C/U              | R/C/U (kelas sendiri)         | —                                                         | —         |

Matriks ini mencatat policy efektif dari migration saat ini. Hak produk yang belum memiliki policy tidak boleh dianggap sudah aman hanya karena menunya tersedia.

Kenaikan kelas dan kelulusan hanya dapat diproses Admin aktif melalui fungsi database atomik. Wali Kelas dan Guru Mata Pelajaran tidak dapat membuat atau mengubah catatan akhir tahun.

Untuk mapel dengan `subjects.religion_scope`, izin kelas dan penugasan tetap berlaku seperti tabel di atas. Admin atau Wali Kelas dapat memilih satu mapel agama pengganti per siswa dan semester; Guru Mata Pelajaran hanya dapat membacanya. Validasi database membatasi nilai dan deskripsi ke mapel agama efektif tersebut, atau ke agama biodata jika tidak ada pengganti. Mapel dengan nilai `null` tetap berlaku bagi seluruh siswa.

### Catatan Implementasi yang Perlu Diaudit

- Guru boleh merangkap sebagai Wali Kelas dan Guru Mata Pelajaran. Role menentukan dashboard utama, sedangkan kepemilikan kelas dan assignment menentukan scope data aktual.
- Policy tambahan Wali Kelas membuka mapel aktif dan CP aktif yang cocok dengan jenjang serta semester kelasnya, lalu membatasi penulisan nilai dan deskripsi berdasarkan `classes.homeroom_teacher_id`.
- `grading_rules` adalah struktur KKM lama yang masih hidup berdampingan dengan `grading_settings` dan `subject_kkm_rules`. Policy lama tidak boleh dihapus sebelum migrasi data historis dan pemakaian service selesai diaudit.

## 6. Pembatas Scope Guru Mata Pelajaran

Penugasan menghubungkan:

```text
akun Auth
→ teacher_profiles.user_id
→ teacher_assignments.teacher_id
→ class_id + subject_id + academic_year_id + semester_id
```

Nilai dan deskripsi hanya lolos apabila `class_id`, `subject_id`, dan `semester_id` cocok dengan penugasan aktif. CP juga harus cocok dengan mata pelajaran, tingkat kelas, dan semester penugasan.

Penugasan yang dinonaktifkan menghentikan akses scope tersebut tanpa menghapus data historis.

## 7. Pembatas Scope Wali Kelas

Tanggung jawab Wali Kelas ditentukan melalui:

```text
akun Auth
→ teacher_profiles.user_id
→ classes.homeroom_teacher_id
→ class_members
→ siswa dan data rapor kelas tersebut
```

Pemeriksaan kelas selalu mempertimbangkan semester yang sesuai. Mengubah label role tanpa menautkan guru ke kelas tidak memberikan akses ke siswa.

## 8. Operasi Khusus

### Aktivasi Tahun Ajaran dan Semester

Function `set_active_academic_year` dan `set_active_semester` menggunakan hak pemanggil (`SECURITY INVOKER`). Hanya Admin aktif yang lolos pemeriksaan policy dan validasi di dalam function.

### Import Siswa

Function `import_students_to_class`:

- hanya dapat dipanggil pengguna terautentikasi;
- memeriksa bahwa pemanggil adalah Admin aktif;
- memvalidasi kecocokan kelas dan semester;
- memasukkan siswa dan keanggotaan kelas secara atomik;
- menolak batch kosong atau lebih dari 500 siswa.

### Sinkronisasi Branding Login

Sinkronisasi internal dari `schools` ke `public_school_identity` dijalankan oleh function pada schema `private`. Hak eksekusinya tidak diberikan kepada `public`, `anon`, atau `authenticated`.

## 9. Foto Siswa

Bucket `student-photos` bersifat privat. Aturan saat ini:

- hanya menerima JPG atau PNG maksimal 2 MB;
- nama objek harus berbentuk `<student_id>/photo`;
- Admin aktif dapat membaca, mengunggah, dan mengganti foto seluruh siswa;
- Wali Kelas dapat membaca, mengunggah, dan mengganti foto siswa kelas sendiri;
- Guru Mata Pelajaran dan anonymous tidak memiliki akses;
- tidak ada izin hapus dari aplikasi.

Penggantian foto memerlukan izin baca, tambah, dan ubah; ketiganya telah disediakan oleh policy Storage.

## 10. Aturan Audit dan Kepemilikan

- Penambahan data yang diaudit harus mengisi `created_by` dan `updated_by` dengan `auth.uid()`.
- Perubahan data harus mengisi `updated_by` dengan `auth.uid()`.
- Policy UPDATE menggunakan pemeriksaan baris sebelum dan sesudah perubahan.
- Scope kepemilikan nilai dan rapor tidak boleh dipindahkan melalui update biasa.
- Password, access token, secret key, dan data pribadi lengkap tidak boleh dicatat pada log.
- Menonaktifkan akun, guru, assignment, CP, atau master data lebih aman daripada menghapus riwayat.

## 11. Perilaku Aplikasi Saat Ditolak

Frontend harus menampilkan pesan sederhana, misalnya:

```text
Anda tidak memiliki izin untuk mengubah data ini.
```

Jangan menampilkan error teknis mentah. Tombol simpan harus memiliki status memproses, berhasil, dan gagal. Aplikasi tidak boleh mencoba mengatasi penolakan dengan service-role key atau memindahkan keputusan izin ke local storage.

## 12. Pemeriksaan Sebelum Produksi

- Pastikan RLS aktif pada seluruh tabel aplikasi di schema `public`.
- Bandingkan policy lokal dengan policy project Supabase produksi.
- Pastikan `anon` hanya dapat memilih `public_school_identity`.
- Uji akun nonaktif tidak memperoleh data internal.
- Uji Guru Mata Pelajaran tidak dapat membaca atau mengubah kelas/mapel di luar assignment.
- Uji Wali Kelas dapat mengubah seluruh nilai kelas sendiri tetapi tidak dapat membuka atau mengubah kelas lain.
- Uji guru yang merangkap Wali Kelas dan Guru Mapel memperoleh gabungan scope yang tepat tanpa membuka kelas lain.
- Uji preview Wali Kelas dapat membaca nama seluruh mapel yang tampil pada rapor.
- Uji Admin dapat menjalankan alur setup dan import siswa.
- Uji perubahan foto dengan akun Admin dan Wali Kelas serta penolakan untuk Guru Mapel.
- Uji operasi UPDATE mempunyai akses SELECT yang sesuai.
- Jalankan security advisor dan performance advisor Supabase.
- Pastikan publishable key saja yang tersedia di frontend.

Audit produksi tersebut tetap menjadi pekerjaan terpisah. Dokumen ini tidak menyatakan audit produksi selesai dan tidak memberikan izin untuk mengubah policy tanpa tahap yang sesuai.
