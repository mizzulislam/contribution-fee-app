# Roles and Permissions Guide (RBAC & RLS)

Dokumen ini menjelaskan model otorisasi pengguna, pembatasan akses berdasarkan peran (Role-Based Access Control / RBAC), penyaringan baris data (Row-Level Security / RLS) di sisi backend Google Sheets, serta penegakan audit logging mutasi data pada sistem Soematra Kost.

---

## 1. Ringkasan Peran Pengguna (User Roles)

Sistem memiliki tiga level peran pengguna dengan hak akses yang tersegregasi secara ketat:

1. **Super Admin (Pemilik Kos):**
   * Mengakses seluruh halaman dan modul.
   * Membuat, mengubah, dan menonaktifkan pengguna.
   * Mengatur role, permission, data master (COA), audit log sistem, serta operasi pemulihan data (backup & restore).

2. **Admin / Bendahara:**
   * Mengelola operasional kos, iuran (Billing), verifikasi bukti pembayaran transfer (Payments), pengeluaran (Expenses), dana talangan, galon, jadwal piket, dan laporan keuangan.
   * Tidak dapat mengubah konfigurasi global sistem kecuali diberi izin khusus, tidak dapat menghapus transaksi penting tanpa jejak audit, dan tidak dapat mengubah peran Super Admin.

3. **User / Penghuni Kos (Warga):**
   * Mengakses dashboard pribadi, melihat daftar tagihan aktif miliknya, melakukan unggah konfirmasi pembayaran beserta gambar bukti bayar.
   * Memantau tugas piket pribadi, mengelola botol/wadah air galon miliknya sendiri, dan melihat laporan kas bersama sesuai transparansi.

---

## 2. Matriks Akses Fitur (Permission Matrix)

Tabel berikut menunjukkan hak akses operasi (Create, Read, Update, Delete) per entitas data:

| Entitas Lembar Kerja | Operasi | Super Admin | Admin / Bendahara | User / Warga | Catatan Keamanan |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Users** | CRUD | Ya | Tidak | Tidak | Pendaftaran & perubahan profil warga hanya dilakukan oleh Super Admin. Warga hanya dapat mengubah sandi profil mereka sendiri. |
| **Bills** | CRUD | Ya | Ya | Hanya Baca | Pembuatan & penghapusan tagihan hanya wewenang Bendahara/Super Admin. Warga hanya melihat tagihan atas nama mereka. |
| **Payments** | CRUD | Ya | Ya | RU | Warga mengunggah pembayaran (Create) dan membatalkan (Delete jika status pending). Bendahara memverifikasi (Update status). |
| **Expenses** | CRUD | Ya | Ya | Tidak | Pencatatan biaya hanya dilakukan oleh bendahara/pemilik kos. |
| **JournalEntries** | CRUD | Ya | Tidak | Tidak | Entri jurnal dihasilkan otomatis oleh sistem melalui transaksi, atau diinput manual oleh Super Admin. Warga/Admin tidak bisa edit/hapus. |
| **MasterData (COA)** | CRUD | Ya | Tidak | Tidak | Pengaturan nomor rekening dan akun akuntansi dikunci di tingkat pemilik kos (Super Admin). |
| **Gallons** | CRUD | Ya | Ya | Hanya Baca | Riwayat konsumsi dibaca semua pihak, penginputan/penghapusan oleh Bendahara. |
| **GallonContainers** | CRUD | Ya | Ya | CRUD | Setiap warga dapat mengelola wadah air minum miliknya sendiri. |
| **Backup / Restore** | Operasi | Ya | Tidak | Tidak | Pemulihan basis data dari berkas JSON eksternal hanya boleh dijalankan oleh Super Admin. |

---

## 3. Matriks Akses Halaman (Page Navigation Matrix)

Akses halaman diatur secara ketat berdasarkan navigasi berikut:

| Halaman / Modul | Super Admin | Admin / Bendahara | User / Penghuni |
| :--- | :---: | :---: | :---: |
| Dashboard Super Admin | ✅ | ❌ | ❌ |
| Dashboard Bendahara | ✅ | ✅ | ❌ |
| Dashboard Penghuni | ✅ | ✅ | ✅ |
| Manajemen Kos / Unit Kos | ✅ | ❌ | ❌ |
| Manajemen Pengguna | ✅ | ❌ | ❌ |
| Role & Permission | ✅ | ❌ | ❌ |
| Data Master Kategori | ✅ | ❌ | ❌ |
| Data Penghuni | ✅ | ✅ | ❌ |
| Iuran Kos | ✅ | ✅ | ❌ |
| Tagihan & Pembayaran | ✅ | ✅ | ❌ |
| Tagihan Saya | ✅ | ✅ | ✅ |
| Konfirmasi Pembayaran | ✅ | ✅ | ✅ |
| Verifikasi Pembayaran | ✅ | ✅ | ❌ |
| Riwayat Pembayaran | ✅ | ✅ | ✅ |
| Pengeluaran Operasional | ✅ | ✅ | ❌ |
| Dana Talangan | ✅ | ✅ | ❌ |
| Kas & Mutasi Saldo | ✅ | ✅ | ❌ |
| Laporan Keuangan | ✅ | ✅ | ❌ |
| Laporan Kas Kos | ✅ | ✅ | ✅ |
| Tracker Galon | ✅ | ✅ | ❌ |
| Informasi Galon | ✅ | ✅ | ✅ |
| Prediksi Kebutuhan Galon | ✅ | ✅ | ❌ |
| Jadwal Piket Galon | ✅ | ✅ | ❌ |
| Jadwal Piket Saya | ✅ | ✅ | ✅ |
| Konfirmasi Piket Galon | ✅ | ✅ | ✅ |
| Vendor Galon | ✅ | ✅ | ❌ |
| Reminder & Notifikasi | ✅ | ✅ | ❌ |
| Notifikasi | ✅ | ✅ | ✅ |
| Pengumuman Kos | ✅ | ✅ | ✅ |
| Audit Log Sistem | ✅ | ❌ | ❌ |
| Koreksi Data | ✅ | ✅ | ❌ |
| Backup & Restore Data | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ |
| Profil & Pengaturan Akun | ✅ | ✅ | ✅ |

---

## 4. Keamanan Tingkat Klien (Client-Side Guards)

### 4.1 Session & Signature Verification
* Saat login sukses, informasi profil pengguna beserta **Session Signature** aman disimpan di dalam `sessionStorage` (atau `localStorage` untuk persistent login).
* Hooks `useAuth.ts` mendekode session signature ini untuk memverifikasi keaslian sesi pengguna dan mencegah pemalsuan identitas peran secara lokal.
* Variabel `activeRole` digunakan untuk memfasilitasi penyamaran peran sementara bagi Super Admin jika ingin menguji visual halaman warga, namun hak akses API backend tetap diverifikasi secara aktual di sisi server.

### 4.2 Protected Routes & Layout Guards
* Komponen `ProtectedRoute` membungkus rute dashboard dengan membandingkan daftar peran yang diizinkan (`allowedRoles`) terhadap profil pengguna aktif.
* Jika rute diakses langsung via pengetikan URL browser oleh pengguna tidak sah, React Router akan otomatis mengalihkan pengguna ke halaman `/unauthorized` atau kembali ke `/login`.

---

## 5. Keamanan Tingkat Server (Server-Side Enforcement)

Backend Google Apps Script (`google-apps-script.js`) menerapkan kontrol akses data absolut pada tingkat server:

### 5.1 Token API & Domain Verification
* Setiap request yang masuk ke API Google Apps Script wajib membawa parameter `token` atau header `X-Soematra-Token` yang dicocokkan dengan rahasia sistem di spreadsheet. Permintaan tanpa token API yang cocok ditolak secara langsung (HTTP `401 Unauthorized`).

### 5.2 Row-Level Security (RLS) di Apps Script
* Ketika klien dengan peran `user` mengirimkan request GET untuk mengambil data tagihan (`Bills`) atau pembayaran (`Payments`), server Apps Script memfilter data baris berdasarkan parameter `userEmail` yang terikat pada akun login pengguna.
* Server hanya mengembalikan baris yang memiliki kecocokan `resident_email === userEmail` atau `createdBy === userId`. Ini menjamin warga **tidak akan pernah bisa melihat** data keuangan warga kos lainnya.

### 5.3 Pencegahan Manipulasi Data Sensitif
* Server membatasi aksi write/update berdasarkan peran pengguna. Jika `userRole` adalah `user`, server akan menolak request update status pembayaran pada sheet `Payments` atau nominal pada sheet `Bills`.

---

## 6. Audit Logging (Jejak Audit)

* Setiap operasi perubahan data (`POST`, `PUT`, `DELETE`, `RESTORE`) yang berhasil lolos validasi server akan direkam secara otomatis ke dalam sheet `AuditLogs`.
* Log audit mencatat:
  - **Waktu:** Waktu UTC server.
  - **Pengguna:** Email pelaku aksi.
  - **Aksi:** Jenis operasi dan nama sheet (misal: `PUT_PAYMENT_VERIFIED`).
  - **Alamat IP:** Alamat IP client yang mengirim request.
* Jejak audit ini bersifat *append-only* (hanya bisa ditambah) dan tidak dapat dihapus melalui antarmuka frontend biasa untuk menjamin integritas forensik keuangan kos.
