# AUDIT PLAN SOEMATRA KOST — CHECKPOINT C6BA09F

## 1. Identitas Audit

**Repository:** `https://github.com/mizzulislam/contribution-fee-app.git`  
**Branch baseline:** `main`  
**Commit baseline:** `c6ba09f`  
**Commit message:** `add some library of accounting cycle and repair messy design of UI`  
**Tanggal commit:** 17 Juni 2026  
**Project:** Soematra Kost / Contribution Fee App  
**Tujuan audit:** melakukan checkpoint audit menyeluruh terhadap keamanan, UI/UX, fungsionalitas, integrasi antar-role, library siklus akuntansi, struktur folder, performa, aksesibilitas, dokumentasi, dan kesiapan sistem menuju production-ready.

---

## 2. Konteks Sistem

Soematra Kost adalah aplikasi manajemen kos berbasis role yang mencakup:

1. pengelolaan penghuni;
2. pengelolaan kamar;
3. iuran/tagihan penghuni;
4. pembayaran dan upload bukti pembayaran;
5. validasi pembayaran oleh admin/bendahara;
6. dashboard berbasis role;
7. galon tracker;
8. laporan operasional;
9. library siklus akuntansi;
10. potensi integrasi data antar modul.

Role utama:

1. **Super Admin**
2. **Admin / Bendahara**
3. **User / Penghuni Kos**

Audit ini harus melihat sistem sebagai satu kesatuan, bukan hanya memeriksa halaman secara terpisah.

---

## 3. Prinsip Audit

Agent AI wajib mengikuti prinsip berikut:

1. Audit dulu, jangan langsung redesign total.
2. Jangan langsung menghapus halaman atau file.
3. Jangan langsung mengubah schema database tanpa migration plan.
4. Jangan membuat fitur baru sebelum audit selesai.
5. Jangan mengganti arsitektur besar tanpa alasan yang terdokumentasi.
6. Semua temuan harus menyebut file/lokasi jika memungkinkan.
7. Gunakan severity: `Critical`, `High`, `Medium`, `Low`.
8. Prioritaskan keamanan, build stability, role access, dan integrasi data.
9. Fokus pada kondisi aktual repository, bukan asumsi dari versi lama.
10. Hasil audit harus actionable, teknis, dan dapat langsung digunakan untuk tahap perbaikan.

---

## 4. Baseline Audit

### Tujuan

Memastikan agent memahami kondisi repository terbaru berdasarkan commit `c6ba09f`.

### Area yang Harus Dicek

1. Latest commit di branch `main`.
2. `package.json`.
3. `README.md`.
4. `DESIGN.md`.
5. `ROLE_STRUCTURE_SOEMATRA_KOST.md`.
6. `AUDIT_REPORT_SOEMATRA_KOST.md` jika tersedia.
7. Struktur folder `src`.
8. Semua route.
9. Semua page.
10. Semua layout.
11. Semua component.
12. Semua hook.
13. Semua context/provider.
14. Semua utility/helper.
15. Semua service/API layer.
16. Semua type/interface.
17. Semua file data/mock.
18. Semua file database/Supabase/migration jika ada.
19. File tambahan seperti `sheet_audit.json`, `test.js`, file `.cjs`, atau file eksperimen lain.

### Output Baseline

```md
## Baseline System Snapshot

| Item | Result |
|---|---|
| Latest commit audited | |
| Tech stack detected | |
| Major modules detected | |
| Role system detected | |
| Accounting cycle library detected | |
| Existing documentation | |
| Suspicious / temporary files | |
| Notes from repository structure | |
```

---

## 5. Build, Lint, and Runtime Audit

### Tujuan

Memastikan aplikasi bisa dibangun, dijalankan, dan tidak memiliki error dasar.

### Command yang Harus Dijalankan

```bash
npm install
npm run lint
npm run build
npm run dev
```

Jika tersedia:

```bash
npm test
```

### Hal yang Harus Dicatat

1. TypeScript error.
2. ESLint warning/error.
3. Vite build error.
4. Broken import.
5. Broken route.
6. Missing component.
7. Dependency conflict.
8. Runtime error.
9. Console error.
10. Warning yang berpotensi menjadi bug.

### Output

```md
| Command | Result | Error/Warning | File/Location | Severity | Recommendation |
|---|---|---|---|---|---|
```

**Catatan:** build failure harus dikategorikan sebagai `Critical`.

---

## 6. Audit Struktur Folder dan File

### Tujuan

Memastikan struktur project scalable, mudah dirawat, dan tidak bercampur antara UI, business logic, data, dan integrasi.

### Area Audit

1. Struktur folder `src`.
2. Pemisahan `pages`, `components`, `layouts`, `hooks`, `lib`, `services`, `utils`, `types`, `data`, dan `contexts`.
3. Penempatan library siklus akuntansi.
4. Pemisahan UI dan business logic.
5. Duplikasi komponen.
6. File lama yang tidak dipakai.
7. File mock/dummy yang masih tercampur dengan production logic.
8. File sementara/eksperimen yang ikut masuk repository.
9. Konsistensi naming file dan folder.
10. Komponen yang terlalu besar.
11. Route lama yang masih hidup.
12. Helper/util yang terlalu spesifik untuk satu halaman tetapi diletakkan global.

### Output

```md
| Area/File/Folder | Current Condition | Problem | Severity | Recommended Action |
|---|---|---|---|---|
```

### Rekomendasi Struktur Ideal

Jika struktur saat ini perlu dirapikan, agent harus memberikan rekomendasi struktur seperti:

```txt
src/
  app/
    routes/
    providers/
  components/
    ui/
    layout/
    shared/
    domain/
  features/
    auth/
    dashboard/
    residents/
    rooms/
    billing/
    payments/
    gallon-tracker/
    accounting/
    reports/
    settings/
  lib/
    accounting/
    validation/
    constants/
  services/
    supabase/
    payments/
    accounting/
  hooks/
  types/
  utils/
  data/
  styles/
```

---

## 7. Security Audit

### Tujuan

Memastikan sistem aman dari kebocoran akses, manipulasi data, dan eksposur data sensitif.

### A. Authentication

Periksa:

1. Login.
2. Logout.
3. Session handling.
4. Session persistence.
5. Protected route.
6. Redirect setelah login/logout.
7. Handling invalid session.
8. Unauthorized page/fallback.
9. Penyimpanan data user.
10. Potensi manipulasi session dari browser.

Risiko yang harus dicari:

1. Halaman internal bisa dibuka tanpa login.
2. Session tidak dibersihkan saat logout.
3. Role hanya disimpan di localStorage tanpa validasi.
4. User bisa mengubah role dari devtools.
5. Redirect role tidak konsisten.

### B. Authorization / RBAC

Periksa:

1. Super Admin hanya untuk fitur global.
2. Admin/Bendahara hanya untuk fitur operasional kos.
3. User/Penghuni hanya untuk data pribadi.
4. User tidak bisa membuka route admin dari URL langsung.
5. Admin tidak bisa membuka route super admin.
6. Role guard diterapkan di semua route.
7. Menu sidebar sesuai role.
8. Data access sesuai role, bukan hanya tampilan menu.

### C. Supabase / Backend / Data Access

Jika menggunakan Supabase/backend, audit:

1. RLS aktif atau belum.
2. Policy `select`, `insert`, `update`, `delete`.
3. User hanya membaca data miliknya.
4. Admin hanya membaca data sesuai otoritas.
5. User tidak bisa mengubah status pembayaran sendiri.
6. User tidak bisa mengubah nominal tagihan.
7. Service role key tidak terekspos di frontend.
8. Environment variable aman.
9. Query database tidak terlalu terbuka.
10. Validasi tidak hanya dilakukan di frontend.

### D. File Upload Security

Jika ada upload bukti pembayaran, audit:

1. Validasi tipe file.
2. Validasi ukuran file.
3. Storage path aman.
4. User tidak bisa overwrite file user lain.
5. Bukti pembayaran tidak bisa diakses sembarang user.
6. Admin hanya bisa melihat bukti pembayaran yang relevan.
7. File upload tidak membuka celah path traversal.

### E. Data Manipulation

Cek apakah user bisa:

1. Mengubah status pembayaran sendiri.
2. Menghapus tagihan.
3. Mengubah nominal tagihan.
4. Membuat dirinya lunas tanpa validasi admin.
5. Membuat jurnal akuntansi sendiri.
6. Mengubah jurnal penutup.
7. Mengubah role sendiri.
8. Melihat data penghuni lain.
9. Mengubah data kamar.
10. Menghapus data penting tanpa audit trail.

### Output

```md
| Finding | Area | Severity | Risk | File/Location | Recommended Fix |
|---|---|---|---|---|---|
```

---

## 8. Role-Based Access Audit

### Tujuan

Memastikan setiap role hanya memiliki akses sesuai kebutuhan dan seluruh menu/route konsisten.

### Super Admin

Expected access:

1. Dashboard global.
2. Manajemen admin/bendahara.
3. Manajemen penghuni.
4. Manajemen kamar.
5. Manajemen iuran/tagihan.
6. Laporan global.
7. Galon tracker jika relevan.
8. Accounting cycle library.
9. Pengaturan sistem.
10. Audit log jika ada.

### Admin / Bendahara

Expected access:

1. Dashboard operasional.
2. Manajemen penghuni.
3. Manajemen kamar.
4. Manajemen tagihan.
5. Validasi pembayaran.
6. Laporan pembayaran.
7. Galon tracker.
8. Accounting module jika memang diperbolehkan.
9. Notifikasi/pengumuman jika ada.

### User / Penghuni

Expected access:

1. Dashboard pribadi.
2. Tagihan sendiri.
3. Pembayaran sendiri.
4. Upload bukti pembayaran sendiri.
5. Status validasi pembayaran sendiri.
6. Riwayat pembayaran sendiri.
7. Informasi kamar sendiri.
8. Galon tracker jika relevan.
9. Profil pribadi.

### Output

```md
| Role | Expected Access | Actual Access | Issue | Severity | Recommendation |
|---|---|---|---|---|---|
```

---

## 9. Cross-Role Integration Audit

### Tujuan

Memastikan modul antar-role saling tersambung secara data dan workflow.

### Flow Wajib Diuji

#### 9.1 Flow Penghuni Membayar Iuran

Expected flow:

1. User melihat tagihan.
2. User upload bukti bayar.
3. Status berubah menjadi `Menunggu Validasi`.
4. Admin/Bendahara melihat pembayaran masuk.
5. Admin/Bendahara menerima atau menolak pembayaran.
6. User melihat status terbaru.
7. Laporan pembayaran ikut berubah.
8. Dashboard ikut berubah.
9. Jurnal accounting terbentuk jika sudah terintegrasi.

#### 9.2 Flow Admin Membuat Tagihan

Expected flow:

1. Admin membuat tagihan.
2. Tagihan muncul ke user yang tepat.
3. Nominal benar.
4. Deadline benar.
5. Status default benar.
6. Dashboard membaca data tagihan yang sama.
7. Laporan ikut berubah.
8. Accounting membaca piutang/pendapatan jika sudah terhubung.

#### 9.3 Flow Kamar dan Penghuni

Expected flow:

1. Penghuni terhubung dengan kamar.
2. Status kamar berubah ketika dihuni/kosong.
3. Pindah kamar tidak membuat data ganda.
4. Riwayat penghuni tidak hilang jika diperlukan.
5. Dashboard kamar sesuai dengan data detail.

#### 9.4 Flow Galon Tracker

Expected flow:

1. Pencatatan galon tersimpan.
2. Data galon sama antar role.
3. Stok/riwayat/logika biaya benar.
4. Jika terintegrasi dengan accounting, galon masuk ke beban/persediaan/kas.
5. Tidak ada angka dummy yang bertabrakan dengan data aktual.

#### 9.5 Flow Dashboard

Expected flow:

1. Angka dashboard sama dengan halaman detail.
2. Tidak ada dummy data tanpa label.
3. Summary tagihan sama dengan data pembayaran.
4. Summary kamar sama dengan data manajemen kamar.
5. Summary accounting sama dengan ledger/laporan.

### Output

```md
| Flow | Status: Working/Partial/Broken/Dummy | Problem | Impact | Fix Recommendation |
|---|---|---|---|---|
```

---

## 10. UI/UX Design Consistency Audit

### Tujuan

Memastikan desain sistem konsisten, modern, tidak berantakan, informatif, dan nyaman digunakan semua role.

### Area Audit

1. Konsistensi warna hijau-putih sesuai `DESIGN.md`.
2. Typography.
3. Spacing.
4. Button style.
5. Card dashboard.
6. Table.
7. Form.
8. Modal/dialog.
9. Sidebar.
10. Topbar/navbar.
11. Badge status.
12. Empty state.
13. Loading state.
14. Error state.
15. Toast/notification.
16. Filter/search.
17. Pagination.
18. Icon.
19. Active menu state.
20. Hierarchy informasi.
21. CTA.
22. Copywriting UI.

### Bug Desain yang Harus Dicari

1. Layout berantakan.
2. Text overflow.
3. Table melebar di mobile.
4. Sidebar menimpa konten.
5. Card tidak sejajar.
6. Button terlalu kecil.
7. Modal terpotong.
8. Warna status tidak jelas.
9. Halaman kosong tanpa instruksi.
10. Double scrollbar.
11. Spacing tidak konsisten.
12. Kontras rendah.
13. Label form tidak jelas.
14. CTA membingungkan.
15. Informasi penting terlalu tersembunyi.

### Output per Component

```md
| Component | Expected Standard | Current Issue | Severity | Fix Recommendation |
|---|---|---|---|---|
```

### Output per Page

```md
| Page | Role | UI/UX Issue | Severity | Recommendation |
|---|---|---|---|---|
```

---

## 11. Responsiveness Audit

### Tujuan

Memastikan aplikasi nyaman digunakan di mobile, tablet, laptop, dan desktop.

### Viewport Minimal

1. 360px.
2. 390px.
3. 430px.
4. 768px.
5. 1024px.
6. 1366px.
7. 1440px.

### Halaman Wajib Diuji

1. Login.
2. Dashboard Super Admin.
3. Dashboard Admin/Bendahara.
4. Dashboard User/Penghuni.
5. Pembayaran/tagihan.
6. Validasi pembayaran.
7. Manajemen penghuni.
8. Manajemen kamar.
9. Galon tracker.
10. Accounting cycle library.
11. Laporan.
12. Profil/settings.

### Masalah yang Harus Dicari

1. Sidebar menimpa konten.
2. Table overflow.
3. Card grid pecah.
4. Button terlalu kecil.
5. Form terlalu sempit.
6. Modal tidak muat.
7. Chart/tabel accounting tidak terbaca.
8. Double scrollbar.
9. Header sticky mengganggu.
10. Action button di table tidak terlihat.

### Output

```md
| Viewport | Page | Problem | Severity | Fix |
|---|---|---|---|---|
```

---

## 12. Accounting Cycle Library Audit

### Tujuan

Memastikan library siklus akuntansi benar secara konsep, logic, integrasi, dan UI.

### 12.1 Scope Siklus Akuntansi yang Wajib Dicek

#### 1. Identifikasi Transaksi

Harus mampu mengidentifikasi transaksi dari:

1. iuran/tagihan;
2. pembayaran penghuni;
3. galon;
4. pengeluaran kos;
5. koreksi;
6. penyesuaian;
7. refund jika ada;
8. transaksi manual jika tersedia.

#### 2. Chart of Accounts / Daftar Akun

Minimal mendukung:

1. Kas/Bank.
2. Piutang Iuran.
3. Pendapatan Iuran.
4. Pendapatan Lain-lain.
5. Beban Listrik.
6. Beban Air.
7. Beban Internet.
8. Beban Galon.
9. Beban Perawatan.
10. Persediaan Galon jika menggunakan pendekatan persediaan.
11. Utang.
12. Modal/Ekuitas Pemilik.
13. Prive jika relevan.
14. Ikhtisar Laba Rugi.

#### 3. Jurnal Umum

Wajib mendukung:

1. tanggal;
2. nomor referensi;
3. deskripsi;
4. akun debit;
5. akun kredit;
6. nominal;
7. sumber transaksi;
8. status posting;
9. validasi debit = kredit.

#### 4. Buku Besar

Wajib mendukung:

1. posting dari jurnal;
2. saldo per akun;
3. mutasi debit/kredit;
4. filter periode;
5. link dari jurnal ke ledger;
6. normal balance akun.

#### 5. Neraca Saldo

Wajib mendukung:

1. saldo debit/kredit;
2. total debit = total kredit;
3. deteksi imbalance;
4. filter periode.

#### 6. Jurnal Penyesuaian

Minimal mempertimbangkan:

1. piutang belum tertagih;
2. beban akrual;
3. pendapatan diterima di muka;
4. penyusutan aset jika ada;
5. koreksi kesalahan;
6. beban yang belum dicatat.

#### 7. Neraca Saldo Setelah Penyesuaian

Wajib mendukung:

1. saldo dari neraca saldo awal;
2. efek jurnal penyesuaian;
3. validasi balance.

#### 8. Laporan Keuangan

Minimal mendukung:

1. laporan laba rugi;
2. laporan posisi keuangan sederhana;
3. arus kas sederhana jika tersedia;
4. perubahan ekuitas jika relevan.

#### 9. Jurnal Penutup

Wajib mendukung:

1. tutup pendapatan ke ikhtisar laba rugi;
2. tutup beban ke ikhtisar laba rugi;
3. tutup laba/rugi ke modal;
4. tutup prive jika ada;
5. akun nominal menjadi nol.

#### 10. Neraca Saldo Setelah Penutupan

Wajib mendukung:

1. hanya akun riil yang tersisa;
2. akun nominal nol;
3. total debit = total kredit.

#### 11. Jurnal Pembalik

Jika tersedia, wajib memastikan:

1. hanya membalik jurnal penyesuaian tertentu;
2. tidak membalik semua jurnal sembarangan;
3. mendukung transaksi accrual;
4. punya referensi ke adjustment awal.

### 12.2 Audit Logic Debit-Kredit

Validasi aturan dasar:

1. Aset bertambah di debit.
2. Beban bertambah di debit.
3. Pendapatan bertambah di kredit.
4. Kewajiban bertambah di kredit.
5. Ekuitas bertambah di kredit.
6. Setiap jurnal harus balance.
7. Normal balance akun harus benar.
8. Closing entry tidak boleh memengaruhi akun riil secara salah.

Expected journal examples:

```txt
Saat tagihan iuran dibuat:
Dr Piutang Iuran
   Cr Pendapatan Iuran / Pendapatan Diterima Dimuka
```

```txt
Saat pembayaran divalidasi:
Dr Kas/Bank
   Cr Piutang Iuran
```

```txt
Saat beli galon:
Dr Beban Galon / Persediaan Galon
   Cr Kas/Bank
```

```txt
Saat jurnal penutup:
Dr Pendapatan
   Cr Ikhtisar Laba Rugi

Dr Ikhtisar Laba Rugi
   Cr Beban

Dr/Cr Ikhtisar Laba Rugi
   Cr/Dr Modal
```

### 12.3 Audit Integrasi Accounting dengan Modul Kos

```md
| Source Module | Expected Accounting Impact | Actual Integration | Status | Fix |
|---|---|---|---|---|
| Tagihan | Piutang/Pendapatan | | | |
| Pembayaran valid | Kas/Piutang | | | |
| Galon | Beban/Persediaan/Kas | | | |
| Pengeluaran | Beban/Kas | | | |
| Koreksi | Jurnal Koreksi | | | |
| Refund | Pembalik/koreksi kas-piutang | | | |
```

### 12.4 Anti-Dummy Audit

Pastikan:

1. Accounting page tidak hanya menampilkan mock data.
2. Jika masih mock, harus diberi label jelas.
3. Jika data aktual belum terhubung, buat roadmap integrasi.
4. Angka accounting tidak boleh berbeda dari laporan pembayaran.
5. Journal generation tidak boleh hanya statis.
6. Closing entries harus dihitung dari data aktual periode terkait.

### Output Accounting Audit

```md
| Accounting Stage | Status: Available/Partial/Missing/Dummy | Logic Issue | Integration Issue | Recommendation |
|---|---|---|---|---|
| Transaction Identification | | | | |
| Chart of Accounts | | | | |
| General Journal | | | | |
| Ledger | | | | |
| Trial Balance | | | | |
| Adjusting Entries | | | | |
| Adjusted Trial Balance | | | | |
| Financial Statements | | | | |
| Closing Entries | | | | |
| Post-Closing Trial Balance | | | | |
| Reversing Entries | | | | |
```

---

## 13. Functionality Audit

### Tujuan

Memastikan seluruh fitur benar-benar berjalan, bukan hanya tampilan.

### Fitur yang Wajib Dicek

1. Login.
2. Register jika tersedia.
3. Logout.
4. Dashboard tiap role.
5. Manajemen penghuni.
6. Manajemen kamar.
7. Tagihan/iuran.
8. Pembayaran.
9. Upload bukti pembayaran.
10. Validasi pembayaran.
11. Laporan pembayaran.
12. Galon tracker.
13. Accounting cycle.
14. Profil.
15. Settings.
16. Notifikasi jika ada.
17. Export/import jika ada.
18. Filter/search/pagination.

### Status Fitur

Gunakan status:

1. `Working`
2. `Partial`
3. `Broken`
4. `Missing`
5. `Dummy Only`

### Output

```md
| Feature | Role | Status | Problem | Recommendation |
|---|---|---|---|---|
```

---

## 14. Redundancy Audit

### Tujuan

Mengidentifikasi halaman, fitur, route, dan component yang tumpang tindih atau tidak diperlukan.

### Hal yang Harus Dicari

1. Halaman dengan fungsi sama.
2. Menu yang tumpang tindih.
3. Route lama yang tidak dipakai.
4. Component lama yang sudah diganti.
5. File mock yang masih aktif.
6. Data dummy yang masuk production.
7. Accounting page lama dan baru yang sama-sama hidup.
8. Laporan ganda.
9. Dashboard ganda tanpa alasan.
10. Settings/profil duplikatif.
11. Fitur yang seharusnya digabung.

### Output

```md
| Page/Route/File/Feature | Status: Keep/Merge/Remove/Rename/Refactor/Add | Reason | Recommended Action |
|---|---|---|---|
```

---

## 15. Database and Data Model Audit

### Tujuan

Memastikan struktur data mendukung kebutuhan sistem kos dan siklus akuntansi.

### Entity yang Harus Dicek

Jika ada database/Supabase, audit entity berikut:

1. profiles;
2. roles;
3. rooms;
4. residents;
5. bills;
6. payments;
7. payment_proofs;
8. gallon_transactions;
9. chart_of_accounts;
10. journal_entries;
11. journal_lines;
12. ledger_entries;
13. adjustments;
14. closing_entries;
15. reversing_entries;
16. notifications;
17. audit_logs;
18. settings.

### Hal yang Harus Dicek

1. Primary key.
2. Foreign key.
3. `created_at`.
4. `updated_at`.
5. Status enum.
6. Role enum.
7. Amount numeric.
8. Currency handling.
9. Period/month/year.
10. Soft delete.
11. Audit trail.
12. Data ownership.
13. RLS policy.
14. Relasi antar entity.
15. Redundansi field.
16. Normalisasi data.

### Output

```md
| Entity/Table | Problem | Impact | Severity | Recommendation |
|---|---|---|---|---|
```

---

## 16. Code Quality Audit

### Tujuan

Memastikan kode mudah dirawat, aman, dan tidak penuh technical debt.

### Area Audit

1. TypeScript type safety.
2. Penggunaan `any`.
3. Unused import.
4. Unused state.
5. Duplicate logic.
6. Component terlalu besar.
7. Business logic di komponen UI.
8. Repeated Tailwind class.
9. Hardcoded role.
10. Hardcoded status.
11. Hardcoded currency.
12. Hardcoded mock data.
13. Magic numbers.
14. Console log.
15. Commented old code.
16. Inconsistent naming.
17. Missing error boundary.
18. Missing loading state.
19. Missing error handling.
20. Tidak ada separation of concerns.

### Output

```md
| Code Issue | File/Location | Severity | Recommendation |
|---|---|---|---|
```

---

## 17. Copywriting and Information Clarity Audit

### Tujuan

Memastikan aplikasi informatif untuk pengguna non-teknis seperti pemilik kos, bendahara, dan penghuni.

### Area Audit

1. Label menu.
2. Judul halaman.
3. Subtitle/deskripsi halaman.
4. CTA.
5. Pesan error.
6. Pesan sukses.
7. Empty state.
8. Status pembayaran.
9. Instruksi upload bukti.
10. Istilah accounting.
11. Tooltip/helper text.
12. Badge status.

### Output

```md
| Location | Current Text | Problem | Suggested Text |
|---|---|---|---|
```

---

## 18. Accessibility Audit

### Tujuan

Memastikan sistem tetap dapat digunakan dengan baik oleh pengguna dengan kebutuhan aksesibilitas dasar.

### Area Audit

1. Kontras warna.
2. Label form.
3. Focus state.
4. Keyboard navigation.
5. Clickable area.
6. Alt text.
7. ARIA label jika diperlukan.
8. Ukuran font.
9. Icon yang berdiri sendiri tanpa label.
10. Error message yang dapat dipahami.

### Output

```md
| Page/Component | Accessibility Issue | Severity | Recommendation |
|---|---|---|---|
```

---

## 19. Performance Audit

### Tujuan

Memastikan sistem ringan, responsif, dan tidak melakukan proses berulang yang tidak perlu.

### Area Audit

1. Unnecessary re-render.
2. Repeated data fetching.
3. Bundle size.
4. Heavy library imports.
5. Table tanpa pagination.
6. Asset/image belum optimal.
7. Missing loading/skeleton state.
8. State global berlebihan.
9. Memoization jika perlu.
10. Data processing berat di render.

### Output

```md
| Performance Issue | Impact | Recommendation |
|---|---|---|
```

---

## 20. Testing and Quality Gate Audit

### Tujuan

Memastikan sistem punya dasar quality gate sebelum production.

### Test yang Perlu Dicek

1. Unit test accounting logic.
2. Unit test role guard.
3. Unit test status pembayaran.
4. Unit test debit-kredit balance.
5. Integration test flow pembayaran.
6. Integration test jurnal otomatis.
7. Smoke test semua route.
8. Responsive manual test.
9. Build test.
10. Lint test.

### Prioritas Testing Tertinggi

1. Accounting debit/kredit balance.
2. Journal generation from payment.
3. Role route guard.
4. Payment validation.
5. Dashboard data consistency.

### Output

```md
| Test Area | Current Status | Missing Test | Recommendation |
|---|---|---|---|
```

---

## 21. Documentation Audit

### Tujuan

Memastikan dokumentasi sesuai kondisi sistem terbaru.

### Dokumen yang Harus Dicek

1. `README.md`.
2. `DESIGN.md`.
3. `ROLE_STRUCTURE_SOEMATRA_KOST.md`.
4. `AUDIT_REPORT_SOEMATRA_KOST.md`.
5. Dokumentasi sidebar animation jika ada.
6. Dokumentasi setup.
7. Dokumentasi environment variable.
8. Dokumentasi deployment.
9. Dokumentasi role.
10. Dokumentasi accounting cycle.
11. Dokumentasi testing.

### Output

```md
| Document | Problem | Recommended Update |
|---|---|---|
```

---

## 22. Output Wajib dari Agent AI

Agent AI wajib membuat file baru:

```txt
CHECKPOINT_AUDIT_C6BA09F_SOEMATRA_KOST.md
```

Struktur file wajib:

```md
# CHECKPOINT AUDIT C6BA09F SOEMATRA KOST

## 1. Executive Summary
## 2. Latest Commit Audited
## 3. Current System Architecture
## 4. Tech Stack Detected
## 5. Build, Lint, and Runtime Audit
## 6. Folder and File Structure Audit
## 7. Security Audit
## 8. Role-Based Access Audit
## 9. Cross-Role Integration Audit
## 10. UI/UX Design Consistency Audit
## 11. Responsiveness Audit
## 12. Accounting Cycle Library Audit
## 13. Functionality Audit
## 14. Redundancy Audit
## 15. Database and Data Model Audit
## 16. Code Quality Audit
## 17. Copywriting and Information Clarity Audit
## 18. Accessibility Audit
## 19. Performance Audit
## 20. Testing and Quality Gate Audit
## 21. Documentation Audit
## 22. Critical Findings
## 23. Prioritized Roadmap
## 24. Final Recommendation
```

---

## 23. Prioritized Roadmap Format

Roadmap wajib dibagi menjadi:

### Phase 1: Critical Build, Runtime, and Security Fixes

Fokus:

1. Build error.
2. Runtime error.
3. Broken route.
4. Critical security issue.
5. Exposed secret.
6. Unauthorized access fatal.

### Phase 2: Role-Based Access and Data Protection

Fokus:

1. Route guard semua role.
2. Data isolation antar user.
3. Admin vs Super Admin boundary.
4. Payment manipulation prevention.
5. Accounting journal manipulation prevention.

### Phase 3: Cross-Role Integration Stabilization

Fokus:

1. Flow tagihan.
2. Flow pembayaran.
3. Flow validasi.
4. Dashboard consistency.
5. Report consistency.

### Phase 4: Accounting Cycle Logic and Integration Fixes

Fokus:

1. Chart of accounts.
2. Journal generation.
3. Ledger posting.
4. Trial balance.
5. Adjustment.
6. Financial statements.
7. Closing entries.
8. Reversing entries.
9. Integration with billing/payment/galon.

### Phase 5: UI/UX Consistency and Responsiveness Cleanup

Fokus:

1. Design consistency.
2. Mobile layout.
3. Table responsiveness.
4. Form consistency.
5. Empty/loading/error state.
6. Sidebar behavior.

### Phase 6: Redundancy Cleanup and Structure Refactor

Fokus:

1. Dead code.
2. Duplicate pages.
3. Duplicate components.
4. Folder restructuring.
5. Separation of UI and business logic.

### Phase 7: Testing, Documentation, and Production Readiness

Fokus:

1. Unit test.
2. Integration test.
3. Smoke test.
4. README update.
5. Accounting documentation.
6. Deployment notes.
7. Production checklist.

---

## 24. Ringkasan Chat yang Harus Diberikan Agent Setelah Audit

Setelah file audit dibuat, agent wajib menampilkan ringkasan di chat:

1. Kondisi umum sistem.
2. 10 temuan paling kritis.
3. Masalah keamanan terbesar.
4. Masalah UI/UX terbesar.
5. Masalah accounting cycle terbesar.
6. Masalah integrasi antar role.
7. Halaman/fitur redundan.
8. Rekomendasi phase perbaikan pertama.

---

# PROMPT KONTEKSTUAL UNTUK AGENT AI ANTIGRAVITY IDE

Gunakan prompt berikut untuk menjalankan audit langsung di Antigravity IDE.

```md
Saya ingin Anda melakukan AUDIT CHECKPOINT MENYELURUH terhadap repository Soematra Kost berdasarkan push terbaru.

Repository:
https://github.com/mizzulislam/contribution-fee-app.git

Commit terakhir yang wajib dijadikan baseline audit:
c6ba09f - "add some library of accounting cycle and repair messy design of UI"

Konteks sistem:
Soematra Kost adalah aplikasi manajemen kos berbasis role yang mencakup pengelolaan penghuni, kamar, iuran/tagihan, pembayaran, validasi pembayaran, galon tracker, dashboard, laporan, dan library siklus akuntansi.

Role utama:
1. Super Admin
2. Admin / Bendahara
3. User / Penghuni Kos

Tujuan audit:
Audit sistem ini secara menyeluruh untuk memastikan:
- sistem aman;
- semua role memiliki akses yang benar;
- tidak ada kebocoran akses antar role;
- UI/UX konsisten dan tidak berantakan;
- sistem responsif;
- tidak ada halaman/fitur redundan;
- semua fitur utama berjalan;
- modul antar role saling terintegrasi;
- library siklus akuntansi benar secara konsep dan logic;
- struktur folder/file scalable;
- tidak ada bug build, runtime, desain, logic, maupun integrasi;
- sistem bisa diarahkan menuju production-ready.

PENTING:
Jangan langsung melakukan redesign total.
Jangan langsung menghapus halaman.
Jangan langsung mengubah schema database.
Jangan membuat fitur baru sebelum audit selesai.
Jangan mengganti arsitektur besar tanpa alasan yang terdokumentasi.
Audit dulu, tulis laporan lengkap, lalu rekomendasikan roadmap perbaikan.

==================================================
1. BASELINE AUDIT
==================================================

Pastikan branch main berada di commit c6ba09f.
Baca dan pahami:
- package.json;
- README.md;
- DESIGN.md;
- ROLE_STRUCTURE_SOEMATRA_KOST.md;
- AUDIT_REPORT_SOEMATRA_KOST.md jika ada;
- seluruh struktur src;
- seluruh route, page, layout, component, hook, context/provider, lib, util, service, type, dan data;
- seluruh file database/Supabase/migration jika ada;
- file sementara/eksperimen seperti sheet_audit.json, test.js, script .cjs, dan file lain yang mencurigakan.

Output baseline:
| Item | Result |
|---|---|
| Latest commit audited | |
| Tech stack detected | |
| Major modules detected | |
| Role system detected | |
| Accounting cycle library detected | |
| Existing documentation | |
| Suspicious / temporary files | |

==================================================
2. BUILD, LINT, AND RUNTIME AUDIT
==================================================

Jalankan:
npm install
npm run lint
npm run build
npm run dev

Jika tersedia:
npm test

Catat semua TypeScript error, ESLint error, Vite build error, broken import, broken route, dependency conflict, runtime error, dan console error.

Buat tabel:
| Command | Result | Error/Warning | File/Location | Severity | Recommendation |
|---|---|---|---|---|---|

Build failure harus dikategorikan sebagai Critical.

==================================================
3. FOLDER AND FILE STRUCTURE AUDIT
==================================================

Audit struktur folder dan file.

Periksa:
- apakah pages, components, layouts, hooks, lib, services, utils, types, data, dan contexts dipisahkan dengan benar;
- apakah accounting cycle library ditempatkan secara tepat;
- apakah business logic bercampur dengan UI;
- apakah ada file duplikat;
- apakah ada dead code;
- apakah ada file mock/dummy yang masuk production;
- apakah ada temporary file;
- apakah naming file konsisten;
- apakah component terlalu besar;
- apakah struktur mendukung pengembangan jangka panjang.

Buat tabel:
| Area/File/Folder | Current Condition | Problem | Severity | Recommended Action |
|---|---|---|---|---|

Jika perlu, rekomendasikan struktur folder final yang lebih ideal.

==================================================
4. SECURITY AUDIT
==================================================

Audit keamanan secara serius.

Periksa:
A. Authentication
- login;
- logout;
- session handling;
- session persistence;
- redirect;
- protected route;
- unauthorized fallback.

B. Authorization / RBAC
- Super Admin hanya untuk fitur global;
- Admin/Bendahara hanya untuk fitur operasional kos;
- User/Penghuni hanya untuk data pribadi;
- user tidak bisa membuka route admin dari URL;
- admin tidak bisa membuka route super admin;
- role tidak mudah dimanipulasi dari frontend;
- route guard berjalan di semua halaman.

C. Data Access
Jika menggunakan Supabase/backend:
- RLS aktif atau belum;
- policy select/insert/update/delete;
- user hanya membaca data miliknya;
- admin hanya membaca data sesuai haknya;
- user tidak bisa mengubah status pembayaran;
- user tidak bisa mengubah nominal tagihan;
- service role key tidak terekspos;
- environment variables aman.

D. File Upload
Jika ada upload bukti pembayaran:
- validasi tipe file;
- validasi ukuran file;
- storage path aman;
- user tidak bisa overwrite file user lain;
- akses bukti pembayaran tidak terbuka sembarangan.

E. Data Manipulation
Cek apakah user bisa:
- mengubah status pembayaran sendiri;
- menghapus tagihan;
- mengubah nominal;
- membuat jurnal sendiri;
- mengubah closing entry;
- mengubah role;
- melihat data penghuni lain.

Buat tabel:
| Finding | Area | Severity: Critical/High/Medium/Low | Risk | File/Location | Recommended Fix |
|---|---|---|---|---|---|

==================================================
5. ROLE-BASED ACCESS AUDIT
==================================================

Audit akses semua role.

Super Admin expected access:
- dashboard global;
- manajemen admin/bendahara;
- manajemen penghuni;
- manajemen kamar;
- manajemen iuran/tagihan;
- laporan global;
- galon tracker jika relevan;
- accounting cycle;
- pengaturan sistem;
- audit log jika ada.

Admin/Bendahara expected access:
- dashboard operasional;
- manajemen penghuni;
- manajemen kamar;
- manajemen tagihan;
- validasi pembayaran;
- laporan pembayaran;
- galon tracker;
- accounting module jika diperbolehkan;
- notifikasi/pengumuman jika ada.

User/Penghuni expected access:
- dashboard pribadi;
- tagihan sendiri;
- pembayaran sendiri;
- upload bukti pembayaran sendiri;
- status pembayaran sendiri;
- riwayat pembayaran sendiri;
- informasi kamar sendiri;
- galon tracker jika relevan;
- profil pribadi.

Buat tabel:
| Role | Expected Access | Actual Access | Issue | Severity | Recommendation |
|---|---|---|---|---|---|

==================================================
6. CROSS-ROLE INTEGRATION AUDIT
==================================================

Audit integrasi antar role.

Flow wajib:
1. Penghuni membayar iuran:
- user melihat tagihan;
- user upload bukti bayar;
- status menjadi Menunggu Validasi;
- admin melihat pembayaran;
- admin menerima/menolak;
- user melihat status terbaru;
- laporan berubah;
- dashboard berubah;
- accounting journal terbentuk jika sudah terintegrasi.

2. Admin membuat tagihan:
- admin membuat tagihan;
- tagihan muncul ke user yang tepat;
- nominal/deadline/status benar;
- dashboard dan laporan berubah;
- accounting membaca piutang/pendapatan jika sudah terhubung.

3. Kamar dan penghuni:
- penghuni terhubung ke kamar;
- status kamar benar;
- pindah kamar tidak membuat data kacau.

4. Galon tracker:
- pencatatan galon tersimpan;
- data sama antar role;
- stok/riwayat/logika biaya benar;
- jika terhubung accounting, transaksi galon masuk ke jurnal/beban/persediaan.

5. Dashboard:
- angka dashboard sama dengan data detail;
- tidak ada dummy data yang bertentangan dengan data nyata.

Buat tabel:
| Flow | Status: Working/Partial/Broken/Dummy | Problem | Impact | Fix Recommendation |
|---|---|---|---|---|

==================================================
7. UI/UX DESIGN CONSISTENCY AUDIT
==================================================

Audit seluruh halaman dan komponen.

Periksa:
- konsistensi warna hijau-putih sesuai DESIGN.md;
- typography;
- spacing;
- button;
- card;
- table;
- form;
- modal;
- sidebar;
- topbar;
- badge status;
- empty state;
- loading state;
- error state;
- toast/notification;
- filter/search;
- pagination;
- icon;
- active menu state;
- hierarchy informasi;
- CTA;
- copywriting UI.

Cari bug desain:
- layout berantakan;
- text overflow;
- table melebar;
- sidebar menimpa konten;
- card tidak sejajar;
- button terlalu kecil;
- modal terpotong;
- warna tidak konsisten;
- status tidak jelas;
- halaman kosong tanpa instruksi;
- double scrollbar;
- spacing tidak konsisten;
- kontras rendah.

Buat tabel:
| Page/Component | UI/UX Issue | Severity | Recommended Fix |
|---|---|---|---|

==================================================
8. RESPONSIVENESS AUDIT
==================================================

Uji minimal di viewport:
- 360px;
- 390px;
- 430px;
- 768px;
- 1024px;
- 1366px;
- 1440px.

Halaman wajib:
- login;
- dashboard semua role;
- pembayaran;
- validasi pembayaran;
- manajemen penghuni;
- manajemen kamar;
- galon tracker;
- accounting cycle library;
- laporan;
- profil/settings.

Buat tabel:
| Viewport | Page | Problem | Severity | Fix |
|---|---|---|---|---|

==================================================
9. ACCOUNTING CYCLE LIBRARY AUDIT
==================================================

Audit penuh library siklus akuntansi.

Pastikan sistem mencakup:
1. Identifikasi transaksi:
- iuran;
- pembayaran;
- galon;
- pengeluaran kos;
- koreksi;
- penyesuaian;
- refund jika ada;
- transaksi manual jika tersedia.

2. Chart of Accounts:
- kas/bank;
- piutang iuran;
- pendapatan iuran;
- pendapatan lain-lain;
- beban listrik;
- beban air;
- beban internet;
- beban galon;
- beban perawatan;
- persediaan galon jika relevan;
- utang;
- modal/ekuitas;
- prive jika relevan;
- ikhtisar laba rugi.

3. Jurnal Umum:
- debit/kredit balance;
- tanggal;
- akun;
- deskripsi;
- referensi;
- sumber transaksi;
- status posting.

4. Buku Besar:
- posting dari jurnal;
- saldo per akun;
- mutasi debit/kredit;
- filter periode;
- normal balance.

5. Neraca Saldo:
- total debit = total kredit;
- deteksi imbalance;
- filter periode.

6. Jurnal Penyesuaian:
- piutang belum tertagih;
- beban akrual;
- pendapatan diterima di muka;
- koreksi;
- penyusutan jika ada aset.

7. Neraca Saldo Setelah Penyesuaian:
- menggabungkan saldo awal dan adjustment;
- balance.

8. Laporan Keuangan:
- laba rugi;
- posisi keuangan sederhana;
- arus kas sederhana jika tersedia;
- perubahan ekuitas jika relevan.

9. Jurnal Penutup:
- tutup pendapatan;
- tutup beban;
- tutup laba/rugi ke modal;
- tutup prive jika ada;
- akun nominal nol.

10. Neraca Saldo Setelah Penutupan:
- hanya akun riil yang tersisa;
- akun nominal nol;
- total debit = total kredit.

11. Jurnal Pembalik:
- hanya membalik adjustment tertentu;
- tidak membalik semua jurnal;
- punya referensi ke adjustment awal.

Validasi logic debit/kredit:
- aset bertambah di debit;
- beban bertambah di debit;
- pendapatan bertambah di kredit;
- kewajiban bertambah di kredit;
- ekuitas bertambah di kredit;
- setiap jurnal harus balance.

Expected journal:
Saat tagihan iuran dibuat:
Dr Piutang Iuran
Cr Pendapatan Iuran / Pendapatan Diterima Dimuka

Saat pembayaran divalidasi:
Dr Kas/Bank
Cr Piutang Iuran

Saat beli galon:
Dr Beban Galon / Persediaan Galon
Cr Kas/Bank

Saat jurnal penutup:
Dr Pendapatan
Cr Ikhtisar Laba Rugi

Dr Ikhtisar Laba Rugi
Cr Beban

Dr/Cr Ikhtisar Laba Rugi
Cr/Dr Modal

Audit integrasi accounting:
| Source Module | Expected Accounting Impact | Actual Integration | Status | Fix |
|---|---|---|---|---|
| Tagihan | Piutang/Pendapatan | | | |
| Pembayaran valid | Kas/Piutang | | | |
| Galon | Beban/Persediaan/Kas | | | |
| Pengeluaran | Beban/Kas | | | |
| Koreksi | Jurnal Koreksi | | | |
| Refund | Pembalik/koreksi kas-piutang | | | |

Buat tabel utama:
| Accounting Stage | Status: Available/Partial/Missing/Dummy | Logic Issue | Integration Issue | Recommendation |
|---|---|---|---|---|

==================================================
10. FUNCTIONALITY AUDIT
==================================================

Audit fitur:
- login;
- register jika ada;
- logout;
- dashboard tiap role;
- manajemen penghuni;
- manajemen kamar;
- tagihan/iuran;
- pembayaran;
- upload bukti;
- validasi pembayaran;
- laporan;
- galon tracker;
- accounting cycle;
- profil;
- settings;
- notification jika ada;
- filter/search/pagination.

Gunakan status:
Working / Partial / Broken / Missing / Dummy Only.

Buat tabel:
| Feature | Role | Status | Problem | Recommendation |
|---|---|---|---|---|

==================================================
11. REDUNDANCY AUDIT
==================================================

Cari:
- halaman yang tumpang tindih;
- menu yang sama fungsi;
- route lama;
- komponen lama;
- file mock;
- data dummy;
- accounting page lama vs baru;
- laporan ganda;
- dashboard ganda tanpa alasan;
- fitur yang seharusnya digabung.

Jangan hapus langsung.

Buat tabel:
| Page/Route/File/Feature | Status: Keep/Merge/Remove/Rename/Refactor/Add | Reason | Recommended Action |
|---|---|---|---|

==================================================
12. DATABASE AND DATA MODEL AUDIT
==================================================

Jika ada database/Supabase, audit entity:
- profiles;
- roles;
- rooms;
- residents;
- bills;
- payments;
- payment_proofs;
- gallon_transactions;
- chart_of_accounts;
- journal_entries;
- journal_lines;
- ledger_entries;
- adjustments;
- closing_entries;
- reversing_entries;
- notifications;
- audit_logs;
- settings.

Periksa primary key, foreign key, created_at, updated_at, status enum, role enum, amount numeric, currency, period, soft delete, audit trail, data ownership, RLS, dan relasi antar entity.

Buat tabel:
| Entity/Table | Problem | Impact | Severity | Recommendation |
|---|---|---|---|---|

==================================================
13. CODE QUALITY AUDIT
==================================================

Periksa:
- TypeScript type safety;
- penggunaan any;
- duplicate logic;
- unused import;
- unused state;
- hardcoded data;
- hardcoded role;
- hardcoded status;
- hardcoded currency;
- console.log;
- commented old code;
- magic numbers;
- inconsistent naming;
- business logic di UI;
- repeated Tailwind class;
- missing loading/error handling;
- missing error boundary.

Buat tabel:
| Code Issue | File/Location | Severity | Recommendation |
|---|---|---|---|

==================================================
14. COPYWRITING AND INFORMATION CLARITY AUDIT
==================================================

Audit label menu, judul halaman, subtitle, CTA, pesan error, pesan sukses, empty state, status pembayaran, instruksi upload bukti, istilah accounting, tooltip/helper text.

Pastikan mudah dipahami oleh pemilik kos, bendahara, dan penghuni kos.

Buat tabel:
| Location | Current Text | Problem | Suggested Text |
|---|---|---|---|

==================================================
15. ACCESSIBILITY AUDIT
==================================================

Periksa kontras warna, label form, focus state, keyboard navigation, clickable area, alt text, aria-label, ukuran font, dan icon yang berdiri sendiri tanpa label.

Buat tabel:
| Page/Component | Accessibility Issue | Severity | Recommendation |
|---|---|---|---|

==================================================
16. PERFORMANCE AUDIT
==================================================

Periksa unnecessary re-render, repeated data fetching, bundle size, heavy library imports, table tanpa pagination, asset/image belum optimal, missing loading/skeleton state, state global berlebihan, dan data processing berat di render.

Buat tabel:
| Performance Issue | Impact | Recommendation |
|---|---|---|

==================================================
17. TESTING AND QUALITY GATE AUDIT
==================================================

Cek apakah tersedia unit/integration/smoke test.

Prioritas testing:
1. accounting debit/kredit balance;
2. journal generation from payment;
3. role route guard;
4. payment validation;
5. dashboard data consistency.

Buat tabel:
| Test Area | Current Status | Missing Test | Recommendation |
|---|---|---|---|

==================================================
18. DOCUMENTATION AUDIT
==================================================

Audit README.md, DESIGN.md, ROLE_STRUCTURE_SOEMATRA_KOST.md, AUDIT_REPORT_SOEMATRA_KOST.md, dokumentasi setup, env, deployment, role, accounting cycle, dan testing.

Buat tabel:
| Document | Problem | Recommended Update |
|---|---|---|

==================================================
OUTPUT WAJIB
==================================================

Buat file baru:
CHECKPOINT_AUDIT_C6BA09F_SOEMATRA_KOST.md

Struktur file:
# CHECKPOINT AUDIT C6BA09F SOEMATRA KOST

## 1. Executive Summary
## 2. Latest Commit Audited
## 3. Current System Architecture
## 4. Tech Stack Detected
## 5. Build, Lint, and Runtime Audit
## 6. Folder and File Structure Audit
## 7. Security Audit
## 8. Role-Based Access Audit
## 9. Cross-Role Integration Audit
## 10. UI/UX Design Consistency Audit
## 11. Responsiveness Audit
## 12. Accounting Cycle Library Audit
## 13. Functionality Audit
## 14. Redundancy Audit
## 15. Database and Data Model Audit
## 16. Code Quality Audit
## 17. Copywriting and Information Clarity Audit
## 18. Accessibility Audit
## 19. Performance Audit
## 20. Testing and Quality Gate Audit
## 21. Documentation Audit
## 22. Critical Findings
## 23. Prioritized Roadmap
## 24. Final Recommendation

Roadmap wajib dibagi:
- Phase 1: Critical Build, Runtime, and Security Fixes
- Phase 2: Role-Based Access and Data Protection
- Phase 3: Cross-Role Integration Stabilization
- Phase 4: Accounting Cycle Logic and Integration Fixes
- Phase 5: UI/UX Consistency and Responsiveness Cleanup
- Phase 6: Redundancy Cleanup and Structure Refactor
- Phase 7: Testing, Documentation, and Production Readiness

Setelah file audit dibuat, tampilkan ringkasan di chat:
1. kondisi umum sistem;
2. 10 temuan paling kritis;
3. masalah keamanan terbesar;
4. masalah UI/UX terbesar;
5. masalah accounting cycle terbesar;
6. masalah integrasi antar role;
7. halaman/fitur redundan;
8. rekomendasi phase perbaikan pertama.

Aturan akhir:
- Jangan langsung redesign total.
- Jangan langsung hapus file/halaman.
- Jangan langsung ubah database schema.
- Jangan menambah fitur baru sebelum audit selesai.
- Semua temuan harus menyebut file/lokasi jika memungkinkan.
- Gunakan severity Critical, High, Medium, Low.
- Fokus pada kondisi aktual repository, bukan asumsi.
- Gunakan bahasa Indonesia yang jelas, teknis, dan dapat langsung dieksekusi.
```

---

# PROMPT LANJUTAN SETELAH AUDIT SELESAI

Gunakan prompt ini setelah Agent AI selesai membuat file audit.

```md
Berdasarkan CHECKPOINT_AUDIT_C6BA09F_SOEMATRA_KOST.md, jalankan hanya Phase 1 dan Phase 2 terlebih dahulu.

Prioritas:
1. Perbaiki error build, lint, runtime, dan broken route.
2. Perbaiki celah security Critical dan High.
3. Perbaiki role-based access agar setiap role hanya bisa membuka halaman dan data yang sesuai.
4. Pastikan user tidak bisa mengakses data penghuni lain.
5. Pastikan user tidak bisa memanipulasi status pembayaran, nominal tagihan, role, atau jurnal akuntansi.
6. Pastikan admin tidak bisa mengakses fitur khusus Super Admin.
7. Pastikan environment variable dan secret aman.
8. Pastikan flow pembayaran dan validasi aman dari manipulasi frontend.

Jangan melakukan redesign besar.
Jangan refactor struktur folder besar-besaran dulu.
Jangan menambah fitur baru.
Jangan mengubah schema database besar tanpa migration plan.
Jangan menghapus halaman kecuali benar-benar dead code dan sudah tercatat di audit.

Setelah selesai, buat ringkasan:
- file yang diubah;
- masalah yang diperbaiki;
- alasan perubahan;
- cara testing;
- sisa masalah untuk Phase 3 dan Phase 4.
```
