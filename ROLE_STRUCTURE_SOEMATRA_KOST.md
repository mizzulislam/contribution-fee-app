# Role Structure – Soematra Kost

Dokumen ini menjadi acuan untuk Agent AI dalam memahami struktur role, akses halaman, dan batasan kewenangan pada aplikasi **Soematra Kost**.

---

## 1. Ringkasan Role

| Role | Fokus Utama | Level Akses |
|---|---|---|
| **Super Admin** | Mengelola sistem secara menyeluruh, konfigurasi aplikasi, data master, user, keamanan, dan audit sistem. | Full access seluruh sistem. |
| **Admin / Bendahara** | Mengelola operasional kos, iuran, pembayaran, pengeluaran, dana talangan, galon, jadwal piket, dan laporan keuangan. | Akses penuh pada modul operasional dan keuangan kos. |
| **User / Penghuni Kos** | Melihat tagihan, melakukan konfirmasi pembayaran, menerima notifikasi, melihat laporan kas, dan menjalankan jadwal piket. | Akses terbatas pada data pribadi dan informasi bersama yang relevan. |

---

## 2. Super Admin

### Deskripsi Role

**Super Admin** adalah role tertinggi dalam sistem. Role ini bertanggung jawab atas konfigurasi aplikasi, pengelolaan user, role permission, data master, audit log, backup, dan pengaturan sistem secara menyeluruh.

### Halaman yang Harus Ada

| Halaman | Fungsi Utama | Prioritas |
|---|---|---|
| **Dashboard Super Admin** | Menampilkan ringkasan seluruh data sistem, jumlah pengguna, jumlah kos/unit, status transaksi, aktivitas terbaru, dan notifikasi sistem. | High |
| **Manajemen Kos / Unit Kos** | Mengelola data kos, nama kos, alamat, jumlah kamar, informasi penghuni, dan status operasional kos. | High |
| **Manajemen Pengguna** | Menambah, mengubah, menonaktifkan, atau menghapus akun pengguna. | High |
| **Role & Permission** | Mengatur hak akses setiap role seperti Super Admin, Admin/Bendahara, Koordinator, dan User/Penghuni. | High |
| **Data Master Kategori** | Mengelola kategori iuran, kategori pengeluaran, metode pembayaran, status transaksi, dan jenis notifikasi. | Medium |
| **Audit Log Sistem** | Melihat riwayat aktivitas pengguna, perubahan data penting, koreksi transaksi, login, dan aktivitas sensitif lainnya. | Medium |
| **Pengaturan Notifikasi Global** | Mengatur template reminder, channel notifikasi, jadwal pengiriman, dan aturan notifikasi umum. | Medium |
| **Backup & Restore Data** | Mengelola pencadangan dan pemulihan data. | Low |
| **System Settings** | Mengatur konfigurasi aplikasi, identitas sistem, preferensi keamanan, dan parameter global. | Medium |

### Hak Akses Utama

- Dapat mengakses seluruh halaman dan modul.
- Dapat membuat, mengubah, dan menonaktifkan user.
- Dapat mengatur role dan permission.
- Dapat melihat audit log sistem.
- Dapat mengatur data master dan konfigurasi sistem.
- Dapat melakukan koreksi data jika diperlukan.

### Batasan

- Tidak boleh menghapus data transaksi penting secara permanen tanpa mekanisme audit log.
- Perubahan role, permission, dan data keuangan harus tercatat dalam log aktivitas.
- Akses Super Admin harus dilindungi dengan autentikasi yang aman.

---

## 3. Admin / Bendahara

### Deskripsi Role

**Admin / Bendahara** adalah role operasional utama yang bertanggung jawab atas pengelolaan iuran, pembayaran, pengeluaran, dana talangan, laporan keuangan, pembelian galon, tracker galon, reminder, dan jadwal piket pembelian galon.

### Halaman yang Harus Ada

| Halaman | Fungsi Utama | Prioritas |
|---|---|---|
| **Dashboard Bendahara** | Menampilkan saldo kas, total iuran masuk, total pengeluaran, dana talangan, penghuni belum bayar, status galon, dan jadwal piket terdekat. | High |
| **Data Penghuni** | Mengelola data penghuni aktif, nomor kamar, kontak, status tinggal, dan status pembayaran. | High |
| **Iuran Kos** | Membuat iuran baru berdasarkan periode, jenis iuran, nominal, jatuh tempo, dan daftar penghuni yang dikenakan tagihan. | High |
| **Tagihan & Pembayaran** | Melihat seluruh tagihan penghuni, status lunas/belum lunas, pembayaran pending, dan riwayat pembayaran. | High |
| **Verifikasi Pembayaran** | Memeriksa bukti pembayaran dari penghuni, menyetujui, menolak, atau meminta revisi pembayaran. | High |
| **Pengeluaran Operasional** | Mencatat pengeluaran seperti galon, gas, kebersihan, perlengkapan kos, dan kebutuhan bersama lainnya. | High |
| **Dana Talangan** | Mencatat dana pribadi bendahara yang digunakan terlebih dahulu, status penggantian, dan riwayat talangan. | High |
| **Kas & Mutasi Saldo** | Melihat arus kas masuk dan keluar, saldo awal, saldo akhir, serta mutasi kas per periode. | High |
| **Laporan Keuangan** | Membuat dan melihat laporan pemasukan, pengeluaran, saldo kas, piutang iuran, dan dana talangan. | High |
| **Tracker Galon** | Mencatat pembelian galon, jumlah galon, harga, vendor, tanggal pembelian, dan estimasi tanggal habis. | High |
| **Prediksi Kebutuhan Galon** | Menampilkan estimasi kebutuhan galon berdasarkan histori pembelian, jumlah penghuni, dan pola konsumsi. | Medium |
| **Jadwal Piket Galon** | Membuat dan mengatur rotasi jadwal piket pembelian galon antar penghuni. | High |
| **Vendor Galon** | Mengelola data toko galon, kontak, harga, alamat, dan riwayat pembelian. | Medium |
| **Reminder & Notifikasi** | Mengatur pengingat pembayaran, pengingat jatuh tempo, reminder piket, dan notifikasi galon hampir habis. | Medium |
| **Koreksi Data** | Mengajukan atau melakukan koreksi transaksi apabila ada kesalahan input. | Medium |
| **Profil & Pengaturan Akun** | Mengelola informasi akun bendahara, password, dan preferensi notifikasi. | Low |

### Hak Akses Utama

- Dapat mengelola data penghuni dalam lingkup kos.
- Dapat membuat dan mengelola iuran.
- Dapat memverifikasi pembayaran penghuni.
- Dapat mencatat pengeluaran operasional.
- Dapat mencatat dan memantau dana talangan.
- Dapat melihat dan menghasilkan laporan keuangan.
- Dapat mencatat pembelian galon dan mengelola tracker galon.
- Dapat membuat jadwal piket pembelian galon.
- Dapat mengatur reminder pembayaran dan reminder piket.

### Batasan

- Tidak dapat mengubah konfigurasi global sistem kecuali diberikan izin oleh Super Admin.
- Tidak dapat menghapus data transaksi penting tanpa catatan audit.
- Tidak dapat mengubah role Super Admin.
- Koreksi transaksi harus tercatat dengan alasan perubahan.

---

## 4. User / Penghuni Kos

### Deskripsi Role

**User / Penghuni Kos** adalah pengguna yang tinggal di kos dan menggunakan sistem untuk melihat tagihan, melakukan pembayaran, menerima notifikasi, memantau informasi kas bersama, melihat informasi galon, dan menjalankan jadwal piket pembelian galon.

### Halaman yang Harus Ada

| Halaman | Fungsi Utama | Prioritas |
|---|---|---|
| **Dashboard Penghuni** | Menampilkan ringkasan tagihan pribadi, status pembayaran, jadwal piket terdekat, notifikasi terbaru, dan informasi galon. | High |
| **Tagihan Saya** | Melihat daftar iuran yang harus dibayar, nominal, periode, tanggal jatuh tempo, dan status pembayaran. | High |
| **Konfirmasi Pembayaran** | Mengunggah bukti pembayaran atau mengisi data pembayaran untuk diverifikasi bendahara. | High |
| **Riwayat Pembayaran** | Melihat pembayaran yang sudah dilakukan, status verifikasi, nominal, periode, dan catatan dari bendahara. | High |
| **Laporan Kas Kos** | Melihat ringkasan keuangan bersama seperti total pemasukan, pengeluaran, saldo kas, dan dana talangan sesuai batas transparansi yang ditentukan. | Medium |
| **Informasi Galon** | Melihat status pembelian galon terakhir, estimasi galon habis, dan kebutuhan galon berikutnya. | Medium |
| **Jadwal Piket Saya** | Melihat jadwal piket pembelian galon pribadi dan jadwal rotasi penghuni lain jika dibuka untuk semua. | High |
| **Konfirmasi Piket Galon** | Mengonfirmasi bahwa tugas pembelian galon telah dilakukan, termasuk mengisi jumlah galon, biaya, atau bukti pembelian jika diperlukan. | High |
| **Notifikasi** | Melihat pengingat pembayaran, status verifikasi pembayaran, reminder piket, perubahan jadwal, dan informasi operasional kos. | High |
| **Pengumuman Kos** | Melihat informasi umum dari bendahara atau koordinator seperti perubahan iuran, kebutuhan mendadak, atau informasi operasional. | Medium |
| **Profil Saya** | Mengelola data pribadi dasar, kontak, password, dan preferensi notifikasi. | Low |

### Hak Akses Utama

- Dapat melihat tagihan pribadi.
- Dapat mengonfirmasi pembayaran.
- Dapat melihat status verifikasi pembayaran.
- Dapat melihat riwayat pembayaran pribadi.
- Dapat melihat laporan kas kos dalam batas transparansi yang diizinkan.
- Dapat melihat jadwal piket pribadi.
- Dapat mengonfirmasi pelaksanaan piket galon.
- Dapat menerima dan membaca notifikasi operasional kos.
- Dapat memperbarui profil pribadi.

### Batasan

- Tidak dapat membuat atau mengubah iuran kos.
- Tidak dapat memverifikasi pembayaran.
- Tidak dapat mengubah saldo kas atau laporan keuangan.
- Tidak dapat mengubah data penghuni lain.
- Tidak dapat mengatur role dan permission.
- Tidak dapat melihat data sensitif pengguna lain kecuali informasi bersama yang memang dibuka untuk transparansi.

---

## 5. Matriks Akses Halaman

| Halaman / Modul | Super Admin | Admin / Bendahara | User / Penghuni |
|---|---:|---:|---:|
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

## 6. Prioritas Implementasi MVP

Untuk tahap awal, Agent AI disarankan memprioritaskan halaman berikut agar aplikasi dapat berjalan secara end-to-end:

### Super Admin MVP

1. Dashboard Super Admin
2. Manajemen Pengguna
3. Role & Permission
4. Manajemen Kos / Unit Kos
5. Audit Log Sistem

### Admin / Bendahara MVP

1. Dashboard Bendahara
2. Data Penghuni
3. Iuran Kos
4. Tagihan & Pembayaran
5. Verifikasi Pembayaran
6. Pengeluaran Operasional
7. Dana Talangan
8. Kas & Mutasi Saldo
9. Laporan Keuangan
10. Tracker Galon
11. Jadwal Piket Galon
12. Reminder & Notifikasi

### User / Penghuni MVP

1. Dashboard Penghuni
2. Tagihan Saya
3. Konfirmasi Pembayaran
4. Riwayat Pembayaran
5. Laporan Kas Kos
6. Informasi Galon
7. Jadwal Piket Saya
8. Konfirmasi Piket Galon
9. Notifikasi
10. Profil Saya

---

## 7. Catatan Implementasi untuk Agent AI

- Terapkan **role-based access control** secara konsisten di seluruh halaman.
- Setiap halaman harus memiliki validasi akses berdasarkan role pengguna.
- Sidebar, navbar, dan dashboard harus berbeda sesuai role.
- Jangan menampilkan menu yang tidak boleh diakses oleh role tertentu.
- Super Admin memiliki akses tertinggi, tetapi aktivitas penting tetap harus tercatat di audit log.
- Admin/Bendahara berfokus pada operasional keuangan dan kebutuhan kos.
- User/Penghuni hanya melihat dan mengelola data yang relevan dengan dirinya atau informasi bersama yang memang dibuka untuk transparansi.
- Modul keuangan harus menjaga akurasi saldo, pembayaran terverifikasi, pengeluaran, dan dana talangan.
- Modul galon harus mendukung pencatatan pembelian, prediksi kebutuhan, dan jadwal piket.
- Seluruh perubahan data penting harus memiliki timestamp, user pembuat/perubah, dan status perubahan.

---

## 8. Rekomendasi Struktur Navigasi

### Super Admin Navigation

```text
- Dashboard
- Manajemen Kos
- Manajemen Pengguna
- Role & Permission
- Data Master
- Audit Log
- Pengaturan Notifikasi
- Backup & Restore
- System Settings
- Profil
```

### Admin / Bendahara Navigation

```text
- Dashboard
- Data Penghuni
- Iuran Kos
- Tagihan & Pembayaran
- Verifikasi Pembayaran
- Pengeluaran Operasional
- Dana Talangan
- Kas & Mutasi Saldo
- Laporan Keuangan
- Tracker Galon
- Prediksi Galon
- Jadwal Piket Galon
- Vendor Galon
- Reminder & Notifikasi
- Koreksi Data
- Profil
```

### User / Penghuni Navigation

```text
- Dashboard
- Tagihan Saya
- Konfirmasi Pembayaran
- Riwayat Pembayaran
- Laporan Kas Kos
- Informasi Galon
- Jadwal Piket Saya
- Konfirmasi Piket Galon
- Notifikasi
- Pengumuman Kos
- Profil Saya
```

---

## 9. Acceptance Criteria Umum

Sistem dianggap memenuhi struktur role apabila:

- Setiap role memiliki dashboard dan menu yang sesuai.
- User tidak dapat mengakses halaman yang bukan kewenangannya.
- Admin/Bendahara dapat mengelola operasional kos secara end-to-end.
- User/Penghuni dapat melihat tagihan, membayar, menerima notifikasi, dan menjalankan piket.
- Super Admin dapat mengelola user, role, sistem, audit, dan konfigurasi utama.
- Semua perubahan data penting tersimpan dalam audit log.
- Tidak ada halaman penting yang hanya berupa placeholder.
