# CHECKPOINT AUDIT SOEMATRA KOST

## 1. Executive Summary
Sistem Soematra Kost saat ini telah bertransisi dari fase prototipe *half-built* (yang sebelumnya direncanakan menggunakan Supabase) ke sistem yang terintegrasi dengan **Google Sheets (Google Apps Script Web App API)** sebagai backend utamanya. Desain UI/UX secara visual sangat premium dan konsisten dengan tema hijau-putih modern yang ditetapkan dalam `DESIGN.md`. Namun, dari segi fungsionalitas dan runtime, sistem saat ini memiliki **beberapa bug logika kritis**, pelanggaran aturan React Hooks (*conditional hooks*), serta integrasi data antar-role yang tidak sinkron (terutama antara Pembayaran, Tagihan, Pengeluaran, dan Akuntansi). Sistem ini belum siap untuk produksi dan memerlukan perbaikan bertahap yang difokuskan pada pemulihan bug fatal dan sinkronisasi alur data.

## 2. Latest Commit Audited
- **Commit:** `af28cc1` - *syncronize some feature and page*

## 3. Current System Overview
Sistem ini dirancang untuk mengelola kos / iuran warga berbasis peran (*role-based*):
1. **Super Admin:** Mengelola pengguna, hak akses (simulasi), data master kategori, audit log, serta backup/restore data.
2. **Admin / Bendahara (Bendahara Kos):** Mengelola operasional iuran, mencatat pengeluaran, verifikasi pembayaran warga, dan memantau stok air galon serta piket.
3. **User / Penghuni (Warga Kos):** Melihat tagihan pribadi, melakukan konfirmasi pembayaran, melihat kas kos transparan, memantau air galon, dan menjalankan tugas piket.

Aplikasi terhubung ke Google Sheets menggunakan API Web App Apps Script untuk mutasi data secara langsung. Namun, autentikasi dan manajemen sesi masih berupa tiruan (*mock*) yang disimpan di `localStorage`.

## 4. Tech Stack Detected
- **Frontend Core:** React 19.2.6, Vite 8.0.12, TypeScript ~6.0.2
- **Routing:** React Router DOM 7.16.0
- **Styling:** Tailwind CSS 3.4.19, PostCSS 8.5.15, Autoprefixer 10.5.0
- **State Management:** Zustand 5.0.14
- **Form Handling:** React Hook Form 7.77.0, Zod 4.4.3
- **Icons & Visuals:** Lucide React 1.17.0
- **Database/Backend:** Google Sheets API via Google Apps Script (GAS) Web App
- **Accounting Engine:** Custom Double-Entry Engine di sisi frontend (`src/lib/accounting`)

---

## 5. Build & Runtime Audit

Kami menjalankan pemeriksaan linting (`npm run lint`) dan build (`npm run build`). Hasilnya menunjukkan kegagalan total pada build dan **199 masalah** di linting.

### Temuan Build
- **Command:** `npm run build`
- **Hasil:** FAILED (Exit Code 1)
- **Error Utama:**
  ```text
  tsconfig.app.json(20,5): error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0. Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
  ```
- **Rekomendasi Fix:** Ubah `"ignoreDeprecations": "5.0"` menjadi `"ignoreDeprecations": "6.0"` di [tsconfig.app.json](file:///d:/Soematra%20Kost/tsconfig.app.json#L17) untuk membungkam peringatan depresiasi TypeScript, atau hapus properti `baseUrl` jika tidak lagi diperlukan.

### Temuan Linting
- **Command:** `npm run lint`
- **Hasil:** FAILED (193 error, 6 warning)
- **Kategori Masalah:**

| Jenis Masalah | Keterangan | Lokasi File Utama | Rekomendasi Fix |
|---|---|---|---|
| **Conditional Hook Call** <br>*(Critical)* | Hook `useSidebarStore` dipanggil setelah conditional return `if (!profile)`. Ini melanggar aturan utama React Hooks dan memicu error runtime saat refresh/logout. | [DashboardLayout.tsx](file:///d:/Soematra%20Kost/src/components/layouts/DashboardLayout.tsx#L30-L34) | Pindahkan pemanggilan hook `useSidebarStore()` ke atas baris 30 sebelum pemeriksaan `if (!profile)`. |
| **Variable Accessed Before Declared** <br>*(High)* | Fungsi fetching (seperti `fetchDashboardData`, `fetchUsers`) dipanggil di dalam `useEffect` sebelum dideklarasikan secara leksikal (karena didefinisikan di bawah menggunakan `const`). | `Dashboard.tsx`, `ManajemenWarga.tsx`, `MasterData.tsx`, `Verification.tsx`, dll. | Pindahkan deklarasi fungsi fetching ke bagian atas sebelum blok `useEffect`, atau ubah menjadi bentuk deklarasi fungsi `async function name() {}` yang mendukung hoisting. |
| **SetState in Effect** <br>*(Medium)* | Memanggil `setState` secara sinkron langsung di dalam tubuh `useEffect` (memicu rendering bertingkat). | `ProfileSettings.tsx`, `SidebarProfile.tsx`, `ManajemenWarga.tsx` | Hindari pemanggilan `setState` langsung; gunakan inisialisasi state default atau kondisikan state dengan benar. |
| **Unused Imports & Variables** <br>*(Low)* | Import yang tidak terpakai (seperti ikon-ikon Lucide di Sidebar) dan variabel error catch yang tidak diproses. | `Sidebar.tsx`, `App.tsx`, `SystemSettings.tsx` | Bersihkan import dan variabel yang tidak digunakan untuk merapikan kode. |

---

## 6. Role-Based Access Audit

| Role | Expected Access | Actual Access | Issue | Severity | Recommendation |
|---|---|---|---|---|---|
| **Super Admin** | Dashboard global, warga, roles, data master, audit logs, backup/restore, system settings. | Semua halaman dapat diakses. | Menu `System Settings` (`/dashboard/settings`) tidak muncul di bilah sisi (sidebar) Super Admin. | Medium | Tambahkan menu rute `/dashboard/settings` ke dalam array navigasi `superAdminNav` di [Sidebar.tsx](file:///d:/Soematra%20Kost/src/components/layouts/Sidebar.tsx). |
| **Admin / Bendahara** | Kelola tagihan, laporan akuntansi, piket, dan sistem galon. | Halaman operasional dan akuntansi dapat diakses. | - | Low | - |
| **User / Penghuni** | Tagihan pribadi, konfirmasi pembayaran, kas bersama, info galon, kalender piket. | Hanya halaman pribadi dan transparansi kas kos. | - | Low | - |

> [!WARNING]
> **Keamanan Autentikasi Frontend-Only (Critical):**
> Sesi login disimpan di `localStorage` sebagai objek JSON mentah. Pengguna biasa dapat membuka Browser Inspector, mengubah properti `role` pada key `soematra_session` menjadi `'super admin'`, lalu mendapatkan akses penuh ke seluruh rute admin. Ini dikarenakan otentikasi nyata Supabase tidak diimplementasikan dan GAS API tidak mewajibkan Session/Token validation.

---

## 7. Cross-Role Integration Audit

Isu integrasi antar-role adalah kelemahan terbesar sistem saat ini karena fitur-fitur baru dibangun secara terisolasi.

| Flow | Status | Problem | Impact | Fix Recommendation |
|---|---|---|---|---|
| **Persetujuan Pembayaran & Status Tagihan** | **Broken** | Saat Admin menyetujui pembayaran di halaman Verifikasi, status pembayaran di sheet `Payments` diubah menjadi `Lunas`. Namun, status tagihan di sheet `Bills` **tidak ikut diubah** ke `paid`. | Warga akan terus melihat tagihannya sebagai "Belum Bayar" di list tagihan pribadi meskipun telah disetujui Admin. Saldo kas dashboard juga tidak ter-update. | Di file [Verification.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/finance/Verification.tsx#L69), saat menyetujui pembayaran, lakukan update juga ke sheet `Bills` untuk ID tagihan terkait (`billId`) menjadi `paid`. |
| **Pencatatan Pengeluaran & Jurnal Akuntansi** | **Broken** | Saat Admin mencatat pengeluaran di halaman Pengeluaran, data hanya masuk ke sheet `Expenses`. **Tidak ada entri jurnal yang dibuat otomatis** ke sheet `JournalEntries`. | Jurnal akuntansi dan laporan keuangan (Neraca & Laba Rugi) menjadi tidak akurat karena transaksi kas keluar tidak tercatat di pembukuan ganda. | Di file [Expenses.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/finance/Expenses.tsx), saat berhasil menyimpan pengeluaran, buat entri jurnal secara otomatis dengan memanggil `spreadsheetApi.post('JournalEntries', ...)` menggunakan Akun Kas (Kredit) dan Akun Beban terkait (Debit). |
| **Kalkulasi Stok Galon di Halaman Galon** | **Broken** | Stok air galon dihitung dari: `Jumlah Pembelian (dari Jurnal Akuntansi)` dikurangi `Jumlah Pemakaian (dari sheet Gallons)`. Namun, halaman `GallonsInfo.tsx` dan `GallonTracker.tsx` **tidak melakukan fetch** data `JournalEntries`. | Stok galon di halaman Tracker/Info akan langsung pecah (menjadi negatif atau 0) begitu halaman direfresh karena data transaksi akuntansi bernilai kosong di memori. | Fetch data `JournalEntries` dan `MasterData` di [GallonsInfo.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/gallons/GallonsInfo.tsx) & [GallonTracker.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/gallons/GallonTracker.tsx) sebelum menghitung stok air galon. |
| **Tombol Pembayaran Warga** | **Broken** | Tombol "Bayar Sekarang" pada daftar tagihan warga tidak memiliki event handler `onClick`. | Warga tidak dapat beralih ke halaman konfirmasi bayar saat mengeklik tombol tersebut. | Tambahkan handler pada tombol di [ResidentBillsList.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/bills/ResidentBillsList.tsx#L99) untuk mengarahkan ke tab `'confirm'` di `UserBillingDashboard` dengan membawa parameter ID tagihan. |
| **Form Konfirmasi Bayar** | **Partial** | Pilihan tagihan yang dapat dikonfirmasi oleh warga di-hardcode secara statis di dalam kode, tidak mengambil dari sheet `Bills` milik warga tersebut. | Warga tidak dapat memilih tagihan riil mereka saat mengonfirmasi transfer pembayaran. | Ganti opsi statis di [PaymentConfirm.tsx](file:///d:/Soematra%20Kost/src/pages/dashboard/bills/PaymentConfirm.tsx#L85-L88) dengan melakukan fetch data `Bills` (yang berstatus `unpaid`) milik warga yang sedang aktif. |

---

## 8. UI/UX Design Audit

| Page/Component | UI/UX Issue | Severity | Recommendation |
|---|---|---|---|
| **Dashboard** | Tautan tombol "Bayar Sekarang" mengarah ke `/dashboard/bills`, memicu redirect tambahan ke `/dashboard/billing-user`. | Low | Ubah langsung rute tujuan tautan menjadi `/dashboard/billing-user`. |
| **UserBillingDashboard** | Tab navigasi tidak tersinkronisasi dengan URL parameters (`useSearchParams`). | Medium | Implementasikan sinkronisasi parameter tab seperti yang dilakukan di `BillingDashboard.tsx`. |
| **Verification** | Preview Bukti Transfer (struk) menggunakan gambar placeholder statis. | Low | Jika produksi, sediakan penampil gambar yang mengambil URL bukti bayar riil. |
| **RolesPermissions** | Tombol simpan perubahan hak akses hanya menampilkan toast pura-pura tanpa menyimpan data. | Medium | Simpan pengaturan hak akses ke sheet `Settings` atau master role jika ingin fungsional, atau beri tanda "Simulasi" dengan jelas. |

---

## 9. Responsiveness Audit

| Viewport | Page | Problem | Severity | Fix |
|---|---|---|---|---|
| **Mobile (<640px)** | Halaman Akuntansi & Laporan (`TrialBalanceView`, `GeneralLedgerView`) | Tabel pembukuan ganda melebar dan memicu scrollbar horizontal ganda yang merusak layout utama. | Medium | Bungkus seluruh tabel akuntansi dengan elemen `<div className="overflow-x-auto">` yang bersih. |
| **Mobile (<640px)** | `ResidentBillsList` | Kolom aksi memakan terlalu banyak ruang di layar sempit. | Low | Perkecil ukuran padding tabel di viewport mobile menggunakan media query Tailwind (`sm:px-6 px-3`). |

---

## 10. Redundant Pages & Missing Pages

| Page/File/Feature | Status | Reason | Recommended Action |
|---|---|---|---|
| `/dashboard/settings` | **Add to Sidebar** | Halaman Pengaturan Sistem Super Admin ada di rute proyek tetapi tidak memiliki menu akses di sidebar. | Tambahkan rute ini ke navigasi sidebar Super Admin. |
| `pages/dashboard/bills/BillsPayments.tsx` | **Remove** | File sisa yang sudah tidak digunakan lagi pasca konsolidasi (digantikan oleh `UserBillingDashboard`). | Hapus file tersebut jika masih ada di folder build yang tidak terpakai. |

---

## 11. Security Audit

| Finding | Severity | Risk | File/Location | Recommended Fix |
|---|---|---|---|---|
| **Bypass Otentikasi Role** | **Critical** | Pengguna biasa bisa mengubah role-nya sendiri di `localStorage` (`soematra_session`) menjadi `super admin` untuk membobol seluruh halaman admin. | [useAuth.ts](file:///d:/Soematra%20Kost/src/hooks/useAuth.ts) | Integrasikan otentikasi di level server, atau minimal tambahkan enkripsi sederhana / signature hash pada local session agar tidak bisa diubah sembarangan di sisi frontend. |
| **Eksposur API Google Sheets Publik** | **High** | API endpoint Apps Script bersifat publik (`/exec`) tanpa perlindungan API Key atau token otorisasi. Siapa pun yang mengetahui URL dapat mengirim POST/GET request untuk mengubah/menghapus seluruh database kos. | [spreadsheet.ts](file:///d:/Soematra%20Kost/src/lib/spreadsheet.ts) | Tambahkan validasi header sederhana (misal token khusus `X-Soematra-Token`) di Google Apps Script dan request header frontend untuk mencegah request gelap dari luar aplikasi. |

---

## 12. Database & Data Model Audit

Database menggunakan **Google Sheets** dengan tab target:
- `Users` (Profil & Akun Pengguna)
- `Gallons` & `GallonContainers` (Manajemen Air Galon & Wadah)
- `Payments` (Konfirmasi Transfer Pembayaran)
- `Bills` (Tagihan Warga)
- `Expenses` (Pengeluaran Operasional)
- `JournalEntries` & `MasterData` (Data Transaksi & Akun Akuntansi)
- `Schedules` (Jadwal Piket Galon)
- `Settings` & `NotificationSettings` (Konfigurasi Sistem)

### Masalah Model Data:
1. **Tidak Ada Integritas Referensial:** Menghapus warga di sheet `Users` tidak menghapus tagihan tertunda milik warga tersebut di `Bills`, memicu error data yatim (*orphan data*).
2. **Ketergantungan Struktur Kolom:** Nama kolom di Sheets harus persis sama dengan kunci properti objek JavaScript di frontend. Jika admin mengubah nama kolom di Google Sheets secara manual, aplikasi akan crash.

---

## 13. Functionality Audit

| Feature | Role | Status | Problem | Recommended Fix |
|---|---|---|---|---|
| **Login** | Semua | **Working (Mock)** | Masih menggunakan localStorage mock. | Gunakan session token valid jika ingin aman. |
| **Pusat Pembayaran (Warga)** | Warga | **Broken** | Tombol "Bayar Sekarang" macet & Pilihan tagihan di konfirmasi bayar di-hardcode. | Hubungkan tombol ke tab form dan muat daftar tagihan warga secara dinamis. |
| **Verifikasi Pembayaran** | Admin | **Broken** | Menyetujui pembayaran tidak mengubah status tagihan warga di sheet `Bills`. | Tambahkan update ke sheet `Bills` secara paralel saat menyetujui transaksi. |
| **Sistem Galon** | Admin / Warga | **Broken** | Stok galon menjadi negatif / nol saat halaman direfresh langsung. | Lakukan fetch data `JournalEntries` di dalam inisialisasi stok galon. |
| **Pengeluaran Operasional** | Admin | **Broken** | Mencatat pengeluaran tidak membuat entri jurnal akuntansi. | Buat transaksi jurnal otomatis ke `JournalEntries` saat pengeluaran dibuat. |
| **Backup & Restore** | Super Admin | **Working** | Berjalan dengan baik mengekspor/mengimpor database JSON. | - |

---

## 14. Code Quality Audit

- **TypeScript Type Safety (High):** Terlalu banyak penggunaan tipe `any` di file besar seperti `ContributionsList.tsx`, `GallonTracker.tsx`, dan `Expenses.tsx`. Ini menghilangkan manfaat validasi tipe TypeScript.
- **Hook Rules (Critical):** Pelanggaran *conditional hook* di `DashboardLayout.tsx`.
- **Hoisting Violations (Medium):** Pemanggilan fungsi fetching sebelum dideklarasikan di tubuh komponen.

---

## 15. Copywriting & Information Clarity Audit

- **Istilah Status:** Beberapa status iuran menggunakan bahasa Inggris (`paid`, `unpaid`, `rejected`) di database, namun di UI diterjemahkan ke bahasa Indonesia (`Lunas`, `Belum Bayar`, `Ditolak`). Hal ini bisa membingungkan pengembang baru.
- **Rekomendasi:** Tentukan bahasa standar untuk status di database (disarankan konsisten menggunakan lowercase string seperti `paid`, `unpaid`, `pending_verification`, `rejected`).

---

## 16. Accessibility Audit
- **Touch Target (Low):** Di mobile viewport, beberapa tombol aksi (seperti ikon edit/hapus di list wadah galon) memiliki ukuran click target kurang dari `44px x 44px`. Sangat disarankan menambahkan padding ekstra.

---

## 17. Performance Audit
- **Data Fetching Lambat (High):** Google Apps Script terkenal lambat merespons request HTTP (rata-rata latency `1.5s - 3s`). Karena aplikasi memanggil banyak `spreadsheetApi.get()` secara berurutan, halaman terasa lambat dimuat.
- **Rekomendasi:** Gunakan teknik caching di memori (seperti React Query / SWR) atau lakukan fetch secara paralel dengan `Promise.all()` pada inisialisasi awal aplikasi.

---

## 18. Documentation Audit
- Dokumentasi setup di `README.md` tidak mencantumkan instruksi deployment Google Apps Script (GAS) dan struktur kolom sheet yang wajib dibuat di Google Sheets agar API tidak error.
- **Rekomendasi:** Tambahkan panduan menyalin template Google Sheets dan memublikasikan kode Apps Script ke dalam `README.md`.

---

## 19. Critical Findings (Harus Segera Diperbaiki)
1. **Conditional Hook di `DashboardLayout.tsx` (Runtime Crash Risk):** Hook `useSidebarStore` dipanggil secara bersyarat.
2. **Isu Pembayaran Tidak Sinkron (`Verification.tsx`):** Menyetujui transfer tidak mengubah status tagihan warga.
3. **Stok Galon Rusak saat Refresh Halaman (`GallonTracker.tsx` & `GallonsInfo.tsx`):** Data akuntansi tidak di-fetch di awal untuk menghitung stok.
4. **Tombol "Bayar Sekarang" & Pilihan Tagihan Warga Macet/Dummy (`ResidentBillsList.tsx` & `PaymentConfirm.tsx`):** Flow warga membayar iuran terputus.
5. **Vite Build Error:** tsconfig.app.json memicu error TS5101 menghalangi proses deploy.

---

## 20. Prioritized Roadmap

### Phase 1: Critical Build & Runtime Fix (Segera)
- Perbaiki TS5101 di `tsconfig.app.json`.
- Perbaiki conditional hook di `DashboardLayout.tsx`.
- Pindahkan deklarasi fungsi di seluruh halaman agar mematuhi aturan hoisting ESLint.

### Phase 2: Security & Role Access Fix
- Tambahkan menu rute `/dashboard/settings` ke sidebar Super Admin.
- Tambahkan validasi header token sederhana di Google Apps Script dan request frontend.

### Phase 3: Cross-Role Integration Fix
- Sinkronisasikan status verifikasi pembayaran agar mengubah status tagihan di sheet `Bills`.
- Fetch `JournalEntries` di halaman galon untuk memulihkan akurasi stok galon saat refresh.
- Hubungkan pencatatan pengeluaran operasional agar mencatat entri jurnal akuntansi secara otomatis.

### Phase 4: UI/UX & Responsiveness Cleanup
- Hubungkan tombol "Bayar Sekarang" dengan tab konfirmasi pembayaran dan muat tagihan dinamis.
- Bungkus semua tabel akuntansi dengan overflow pembungkus di layar mobile.

### Phase 5: Code Quality & Documentation
- Ganti penggunaan type `any` dengan interface yang sesuai.
- Lengkap panduan instalasi Apps Script di `README.md`.

---

## 21. Final Recommendation
Sistem ini membutuhkan **Refactor Sedang (Fokus pada Integrasi dan Perbaikan Bug)**. 
Tidak perlu mengubah total arsitektur visual atau database Google Sheets saat ini. UI/UX visual sudah sangat premium, namun logika integrasi data antar-fitur wajib diperbaiki agar status keuangan, stok galon, tagihan, dan pembayaran tidak terputus di tengah jalan.
