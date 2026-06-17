# Rencana Perbaikan Struktur Folder, Penamaan File, dan Konsolidasi Dokumentasi Soematra Kost

**Repository:** `mizzulislam/contribution-fee-app`  
**Baseline commit:** `7d03430` — `run audit plan that have 7 phase upgrade`  
**Tanggal baseline:** 17 Juni 2026  
**Tujuan utama:** merapikan struktur folder, file, penamaan, dan dokumentasi agar sistem Soematra Kost mudah dibaca, mudah dikembangkan, dan lebih siap untuk pengembangan lanjutan.

---

## 1. Latar Belakang

Sistem Soematra Kost sudah berkembang dari MVP menjadi aplikasi manajemen kos/iuran berbasis role dengan beberapa modul penting seperti:

- autentikasi dan role-based access,
- dashboard per role,
- manajemen penghuni,
- manajemen kamar,
- tagihan/iuran,
- pembayaran dan validasi pembayaran,
- galon tracker,
- laporan,
- library siklus akuntansi,
- integrasi Google Sheets melalui Google Apps Script Web App,
- dokumentasi teknis dan desain.

Setelah beberapa fase audit dan perbaikan, langkah berikutnya adalah melakukan **structure refactor** dan **documentation consolidation** agar codebase lebih mudah dilanjutkan oleh pengembang lain.

---

## 2. Prinsip Utama Refactor

Refactor ini harus dilakukan dengan prinsip berikut:

1. **Tidak mengubah behavior sistem terlebih dahulu.**
   Fokus utama adalah struktur, penamaan, lokasi file, dan dokumentasi.

2. **Tidak melakukan redesign UI/UX.**
   Perubahan tampilan hanya boleh dilakukan jika diperlukan akibat path/import/component rename.

3. **Tidak mengubah logic bisnis.**
   Logic pembayaran, role, accounting, dan galon tracker tidak boleh diubah kecuali untuk memindahkan file ke folder yang lebih tepat.

4. **Tidak menghapus file sebelum dipastikan tidak dipakai.**
   Cek import, route, reference, dan dependency sebelum menghapus.

5. **Semua perubahan harus bisa dibuild.**
   Setelah rename/move file, jalankan lint dan build.

6. **Nama file harus menggambarkan isi dan fungsinya.**
   Hindari nama generik seperti `Data.tsx`, `Page.tsx`, `Table.tsx`, `NewPage.tsx`, `FixPage.tsx`, `Test.tsx`, atau nama yang tidak menjelaskan konteks.

7. **Dokumentasi harus ringkas tetapi lengkap.**
   Banyak file `.md` yang tumpang tindih harus dikonsolidasikan menjadi beberapa dokumen utama.

---

## 3. Target Struktur Folder Ideal

Struktur akhir yang direkomendasikan:

```txt
.
├── docs/
│   ├── 01-PROJECT-OVERVIEW.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-ROLES-AND-PERMISSIONS.md
│   ├── 04-UI-UX-GUIDELINES.md
│   ├── 05-DATA-AND-INTEGRATION.md
│   ├── 06-ACCOUNTING-CYCLE.md
│   ├── 07-DEPLOYMENT-AND-ENV.md
│   ├── 08-AUDIT-AND-ROADMAP.md
│   └── archive/
│       └── legacy-docs/
│
├── public/
│   └── assets/
│
├── scripts/
│   ├── google-apps-script/
│   │   └── soematra-sheets-api.gs
│   ├── maintenance/
│   │   ├── update-contributions.cjs
│   │   └── update-currency.cjs
│   └── audit/
│       └── sheet-audit.json
│
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx
│   │
│   ├── assets/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── common/
│   │   ├── data-display/
│   │   ├── forms/
│   │   ├── feedback/
│   │   └── navigation/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── roles.ts
│   │   ├── routes.ts
│   │   └── navigation.ts
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/
│   │   ├── residents/
│   │   ├── rooms/
│   │   ├── billing/
│   │   ├── payments/
│   │   ├── gallon-tracker/
│   │   ├── reports/
│   │   ├── accounting/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── services/
│   │   │   ├── calculations/
│   │   │   ├── data/
│   │   │   ├── types.ts
│   │   │   └── index.ts
│   │   ├── notifications/
│   │   └── settings/
│   │
│   ├── hooks/
│   │   └── shared hooks only
│   │
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── google-sheets/
│   │   ├── accounting/
│   │   ├── validation/
│   │   └── utils/
│   │
│   ├── services/
│   │   ├── api-client.ts
│   │   ├── sheets-client.ts
│   │   └── storage-client.ts
│   │
│   ├── types/
│   │   ├── domain.ts
│   │   ├── api.ts
│   │   ├── auth.ts
│   │   ├── accounting.ts
│   │   └── index.ts
│   │
│   └── utils/
│       ├── date.ts
│       ├── currency.ts
│       ├── format.ts
│       └── guards.ts
│
├── .env.example
├── .gitignore
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

---

## 4. Rekomendasi Struktur `src/features`

Gunakan pendekatan **feature-based architecture** agar tiap domain sistem mudah ditemukan.

### 4.1 `features/auth`

Untuk semua hal terkait login, logout, session, protected route, dan role detection.

Contoh isi:

```txt
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   └── UnauthorizedState.tsx
├── pages/
│   ├── LoginPage.tsx
│   └── UnauthorizedPage.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useSession.ts
├── services/
│   └── auth.service.ts
├── types.ts
└── index.ts
```

### 4.2 `features/dashboard`

Untuk dashboard semua role, tetapi tetap dipisahkan berdasarkan role.

```txt
src/features/dashboard/
├── components/
│   ├── DashboardMetricCard.tsx
│   ├── DashboardSection.tsx
│   └── RecentActivityList.tsx
├── pages/
│   ├── SuperAdminDashboardPage.tsx
│   ├── AdminDashboardPage.tsx
│   └── ResidentDashboardPage.tsx
├── services/
│   └── dashboard.service.ts
├── types.ts
└── index.ts
```

### 4.3 `features/residents`

Untuk data penghuni.

```txt
src/features/residents/
├── components/
│   ├── ResidentForm.tsx
│   ├── ResidentTable.tsx
│   ├── ResidentStatusBadge.tsx
│   └── ResidentDetailCard.tsx
├── pages/
│   ├── ResidentsPage.tsx
│   └── ResidentDetailPage.tsx
├── services/
│   └── residents.service.ts
├── types.ts
└── index.ts
```

### 4.4 `features/rooms`

Untuk kamar dan relasinya dengan penghuni.

```txt
src/features/rooms/
├── components/
│   ├── RoomForm.tsx
│   ├── RoomTable.tsx
│   ├── RoomStatusBadge.tsx
│   └── RoomOccupancyCard.tsx
├── pages/
│   ├── RoomsPage.tsx
│   └── RoomDetailPage.tsx
├── services/
│   └── rooms.service.ts
├── types.ts
└── index.ts
```

### 4.5 `features/billing`

Untuk tagihan/iuran.

```txt
src/features/billing/
├── components/
│   ├── BillForm.tsx
│   ├── BillsTable.tsx
│   ├── BillStatusBadge.tsx
│   └── BillSummaryCard.tsx
├── pages/
│   ├── BillsPage.tsx
│   ├── CreateBillPage.tsx
│   └── ResidentBillsPage.tsx
├── services/
│   └── billing.service.ts
├── types.ts
└── index.ts
```

### 4.6 `features/payments`

Untuk pembayaran, upload bukti, validasi, dan riwayat pembayaran.

```txt
src/features/payments/
├── components/
│   ├── PaymentUploadForm.tsx
│   ├── PaymentValidationPanel.tsx
│   ├── PaymentHistoryTable.tsx
│   ├── PaymentStatusBadge.tsx
│   └── PaymentProofPreview.tsx
├── pages/
│   ├── PaymentsPage.tsx
│   ├── PaymentValidationPage.tsx
│   └── ResidentPaymentHistoryPage.tsx
├── services/
│   └── payments.service.ts
├── types.ts
└── index.ts
```

### 4.7 `features/gallon-tracker`

Untuk galon, stok, container, dan riwayat penggunaan.

```txt
src/features/gallon-tracker/
├── components/
│   ├── GallonTransactionForm.tsx
│   ├── GallonHistoryTable.tsx
│   ├── GallonContainerCard.tsx
│   └── GallonStockSummary.tsx
├── pages/
│   ├── GallonTrackerPage.tsx
│   └── GallonContainersPage.tsx
├── services/
│   └── gallon.service.ts
├── types.ts
└── index.ts
```

### 4.8 `features/accounting`

Untuk seluruh library siklus akuntansi.

```txt
src/features/accounting/
├── components/
│   ├── AccountSelector.tsx
│   ├── AccountingPeriodFilter.tsx
│   ├── JournalEntryTable.tsx
│   ├── LedgerTable.tsx
│   ├── TrialBalanceTable.tsx
│   ├── FinancialStatementCard.tsx
│   └── AccountingStageBadge.tsx
├── pages/
│   ├── AccountingDashboardPage.tsx
│   ├── ChartOfAccountsPage.tsx
│   ├── GeneralJournalPage.tsx
│   ├── LedgerPage.tsx
│   ├── TrialBalancePage.tsx
│   ├── AdjustingEntriesPage.tsx
│   ├── AdjustedTrialBalancePage.tsx
│   ├── FinancialStatementsPage.tsx
│   ├── ClosingEntriesPage.tsx
│   ├── PostClosingTrialBalancePage.tsx
│   └── ReversingEntriesPage.tsx
├── calculations/
│   ├── journal-generator.ts
│   ├── ledger-calculator.ts
│   ├── trial-balance-calculator.ts
│   ├── adjustment-calculator.ts
│   ├── financial-statement-calculator.ts
│   ├── closing-entry-generator.ts
│   └── reversing-entry-generator.ts
├── services/
│   ├── accounting.service.ts
│   ├── chart-of-accounts.service.ts
│   └── journal.service.ts
├── data/
│   └── default-chart-of-accounts.ts
├── types.ts
└── index.ts
```

### 4.9 `features/reports`

Untuk laporan lintas modul.

```txt
src/features/reports/
├── components/
│   ├── ReportFilter.tsx
│   ├── ReportExportButton.tsx
│   └── ReportSummaryCard.tsx
├── pages/
│   ├── ReportsPage.tsx
│   ├── PaymentReportPage.tsx
│   ├── OccupancyReportPage.tsx
│   ├── GallonReportPage.tsx
│   └── AccountingReportPage.tsx
├── services/
│   └── reports.service.ts
├── types.ts
└── index.ts
```

---

## 5. Konvensi Penamaan File

### 5.1 Komponen UI

Gunakan PascalCase dan nama deskriptif.

| Hindari | Ganti Menjadi |
|---|---|
| `Table.tsx` | `PaymentHistoryTable.tsx` |
| `Form.tsx` | `ResidentForm.tsx` |
| `Card.tsx` | `DashboardMetricCard.tsx` |
| `Modal.tsx` | `PaymentValidationDialog.tsx` |
| `Status.tsx` | `PaymentStatusBadge.tsx` |

### 5.2 Page

Semua halaman harus berakhiran `Page.tsx`.

| Hindari | Ganti Menjadi |
|---|---|
| `Dashboard.tsx` | `AdminDashboardPage.tsx` |
| `Accounting.tsx` | `AccountingDashboardPage.tsx` |
| `Payment.tsx` | `PaymentsPage.tsx` |
| `UserBills.tsx` | `ResidentBillsPage.tsx` |

### 5.3 Service

Semua file service menggunakan kebab-case + `.service.ts`.

| Hindari | Ganti Menjadi |
|---|---|
| `api.ts` | `api-client.ts` |
| `paymentApi.ts` | `payments.service.ts` |
| `sheet.ts` | `sheets-client.ts` |
| `accounting.ts` | `accounting.service.ts` |

### 5.4 Utility

Utility umum menggunakan nama fungsi domain.

| Hindari | Ganti Menjadi |
|---|---|
| `helper.ts` | `format.ts` / `date.ts` / `currency.ts` |
| `utils.ts` | pecah sesuai fungsi |
| `misc.ts` | nama spesifik sesuai isi |

### 5.5 Type

Type global masuk ke `src/types`. Type spesifik fitur tetap di folder fitur.

```txt
src/types/domain.ts
src/types/api.ts
src/types/auth.ts
src/types/accounting.ts
```

Untuk fitur:

```txt
src/features/payments/types.ts
src/features/accounting/types.ts
```

---

## 6. Strategi Migrasi Aman

### Phase 1 — Inventory dan Dependency Map

Tujuan: memahami kondisi aktual sebelum memindahkan file.

Tugas:

1. Buat daftar semua file di `src`.
2. Kelompokkan file berdasarkan domain:
   - auth,
   - dashboard,
   - residents,
   - rooms,
   - billing,
   - payments,
   - gallon tracker,
   - accounting,
   - reports,
   - settings,
   - shared components,
   - utilities,
   - config,
   - types.
3. Buat peta import/export.
4. Tandai file yang:
   - aktif dipakai,
   - tidak dipakai,
   - duplikatif,
   - terlalu generik,
   - salah lokasi,
   - perlu rename.

Output:

```md
| Current File | Current Purpose | Used By | Suggested Domain | Suggested New Name | Action |
|---|---|---|---|---|---|
```

### Phase 2 — Buat Struktur Folder Baru

Tugas:

1. Buat folder `src/app`, `src/features`, `src/config`, `src/services`, `src/types`, dan rapikan `src/lib`.
2. Jangan pindahkan semua file sekaligus.
3. Mulai dari file yang paling aman:
   - constants,
   - types,
   - utils,
   - shared components.
4. Jalankan build setelah batch kecil.

### Phase 3 — Rename File Generik

Tugas:

1. Rename file yang tidak jelas.
2. Update semua import path.
3. Pastikan route tetap bekerja.
4. Jalankan lint/build.

Contoh batch rename:

```txt
Dashboard.tsx -> AdminDashboardPage.tsx
Accounting.tsx -> AccountingDashboardPage.tsx
Payment.tsx -> PaymentsPage.tsx
UserPayment.tsx -> ResidentPaymentHistoryPage.tsx
```

### Phase 4 — Pindahkan Feature Files

Pindahkan file berdasarkan domain.

Urutan aman:

1. `auth`
2. `dashboard`
3. `residents`
4. `rooms`
5. `billing`
6. `payments`
7. `gallon-tracker`
8. `accounting`
9. `reports`
10. `settings`

Setelah setiap domain dipindah:

```bash
npm run lint
npm run build
```

### Phase 5 — Rapikan Accounting Library

Accounting harus menjadi domain paling rapi karena logic-nya kompleks.

Pisahkan:

- page UI,
- table component,
- calculation logic,
- service data access,
- default chart of accounts,
- type definitions.

Pastikan tidak ada calculation logic besar di file page.

### Phase 6 — Konsolidasi Dokumentasi `.md`

Gabungkan banyak file markdown menjadi dokumentasi inti.

### Phase 7 — Final Validation

Jalankan:

```bash
npm run lint
npm run build
npm run dev
```

Lakukan smoke test:

- login semua role;
- buka semua route;
- cek dashboard;
- cek pembayaran;
- cek validasi;
- cek galon;
- cek accounting;
- cek laporan;
- cek mobile responsive.

---

## 7. Konsolidasi Dokumentasi Markdown

Saat ini repository memiliki beberapa dokumen `.md` yang berpotensi tumpang tindih. Dokumentasi harus dikonsolidasikan menjadi sedikit dokumen namun tetap lengkap.

### 7.1 Struktur Dokumentasi Baru

Rekomendasi:

```txt
docs/
├── 01-PROJECT-OVERVIEW.md
├── 02-ARCHITECTURE.md
├── 03-ROLES-AND-PERMISSIONS.md
├── 04-UI-UX-GUIDELINES.md
├── 05-DATA-AND-INTEGRATION.md
├── 06-ACCOUNTING-CYCLE.md
├── 07-DEPLOYMENT-AND-ENV.md
├── 08-AUDIT-AND-ROADMAP.md
└── archive/
    └── legacy-docs/
```

### 7.2 Isi Tiap Dokumen

#### `README.md`

README harus menjadi pintu masuk utama.

Isi minimal:

- nama project;
- deskripsi singkat;
- tech stack;
- fitur utama;
- role utama;
- quick start;
- environment variables;
- link ke dokumentasi di folder `docs`;
- status project;
- deployment link jika ada.

#### `docs/01-PROJECT-OVERVIEW.md`

Berisi:

- latar belakang sistem;
- masalah yang diselesaikan;
- tujuan sistem;
- target pengguna;
- fitur utama;
- ringkasan modul.

#### `docs/02-ARCHITECTURE.md`

Berisi:

- arsitektur frontend;
- struktur folder;
- data flow;
- routing;
- state management;
- service layer;
- Google Sheets integration;
- Google Apps Script integration;
- deployment architecture.

#### `docs/03-ROLES-AND-PERMISSIONS.md`

Gabungkan isi dari role structure lama.

Berisi:

- daftar role;
- permission matrix;
- halaman per role;
- protected route behavior;
- batasan akses;
- flow antar role.

#### `docs/04-UI-UX-GUIDELINES.md`

Gabungkan isi `DESIGN.md` dan sidebar animation docs jika masih relevan.

Berisi:

- design principles;
- color palette;
- typography;
- spacing;
- component standard;
- sidebar behavior;
- responsive rules;
- status color;
- icon usage;
- copywriting tone.

#### `docs/05-DATA-AND-INTEGRATION.md`

Berisi:

- Google Sheets tab structure;
- field/column dictionary;
- API action;
- request/response pattern;
- data ownership;
- security notes;
- integration flow antar modul.

#### `docs/06-ACCOUNTING-CYCLE.md`

Berisi:

- tujuan modul accounting;
- chart of accounts;
- sumber transaksi;
- jurnal otomatis;
- buku besar;
- neraca saldo;
- jurnal penyesuaian;
- laporan keuangan;
- jurnal penutup;
- jurnal pembalik;
- mapping transaksi kos ke jurnal.

#### `docs/07-DEPLOYMENT-AND-ENV.md`

Berisi:

- cara setup lokal;
- env variable;
- Google Apps Script deployment;
- Vercel deployment;
- security warning;
- production checklist.

#### `docs/08-AUDIT-AND-ROADMAP.md`

Gabungkan hasil audit dan roadmap.

Berisi:

- ringkasan audit terakhir;
- phase perbaikan;
- known issues;
- technical debt;
- next development roadmap.

### 7.3 Dokumen yang Bisa Dipindahkan ke Archive

Pindahkan dokumen lama ke `docs/archive/legacy-docs/` jika sudah digabung:

- audit report lama,
- prompt lama,
- sidebar README lama jika sudah masuk UI/UX guidelines,
- role structure lama jika sudah masuk roles and permissions,
- design lama jika sudah masuk UI/UX guidelines.

Jangan hapus dulu agar histori tetap aman.

---

## 8. Output yang Wajib Dibuat Agent

Agent harus membuat dokumen baru:

```txt
docs/STRUCTURE_REFACTOR_PLAN.md
```

Isi dokumen:

```md
# Structure Refactor Plan

## 1. Current Structure Snapshot
## 2. Problems Found
## 3. Proposed Folder Structure
## 4. File Rename Plan
## 5. File Move Plan
## 6. Documentation Consolidation Plan
## 7. Migration Phases
## 8. Risk Analysis
## 9. Validation Checklist
## 10. Final Summary
```

Agent juga harus membuat ringkasan chat:

1. struktur yang diusulkan;
2. daftar file yang perlu rename;
3. daftar file yang perlu dipindahkan;
4. daftar dokumen `.md` yang perlu digabung;
5. risiko refactor;
6. urutan eksekusi paling aman.

---

## 9. Validation Checklist

Setelah refactor:

```bash
npm run lint
npm run build
npm run dev
```

Checklist manual:

- semua import path valid;
- semua route terbuka sesuai role;
- tidak ada halaman blank;
- sidebar tetap berjalan;
- accounting module tetap bisa dibuka;
- payment flow tetap berjalan;
- gallon tracker tetap berjalan;
- laporan tetap berjalan;
- README link ke docs valid;
- tidak ada broken markdown link;
- tidak ada file lama yang masih di-import dari lokasi archive.

---

## 10. Prompt untuk Agent AI Antigravity IDE

```md
Saya ingin Anda menjalankan STRUCTURE REFACTOR AUDIT & PLAN terhadap repository Soematra Kost.

Repository:
https://github.com/mizzulislam/contribution-fee-app.git

Baseline terbaru:
7d03430 - "run audit plan that have 7 phase upgrade"

Konteks:
Sistem Soematra Kost sudah melewati beberapa fase audit dan perbaikan. Sekarang saya ingin fokus pada perbaikan struktur folder dan file, perubahan nama file agar lebih relevan dengan isi dan fungsi kode, serta konsolidasi dokumentasi `.md` agar project lebih mudah dipahami oleh pengembang lain di masa depan.

Tujuan utama:
1. Merapikan struktur folder dan file.
2. Mengubah nama file yang terlalu generik, ambigu, atau tidak menggambarkan isi kode.
3. Mengelompokkan file berdasarkan domain/fitur.
4. Memisahkan business logic dari UI.
5. Merapikan library siklus akuntansi agar mudah dikembangkan.
6. Merapikan service, utils, hooks, types, dan config.
7. Mengurangi duplikasi file dan komponen.
8. Mengkonsolidasikan banyak file `.md` menjadi beberapa dokumen utama.
9. Menjaga agar seluruh sistem tetap buildable dan tidak berubah behavior-nya.

Aturan penting:
- Jangan redesign UI/UX.
- Jangan mengubah business logic.
- Jangan mengubah schema data.
- Jangan menghapus file sebelum mengecek import/reference.
- Jangan menghapus dokumen lama; pindahkan ke archive jika sudah dikonsolidasikan.
- Jangan melakukan perubahan besar sekaligus.
- Lakukan refactor secara bertahap dan jalankan lint/build setelah tiap batch besar.
- Semua perubahan nama file harus disertai update import path.
- Semua perubahan struktur harus terdokumentasi.

==================================================
1. INVENTORY STRUKTUR SAAT INI
==================================================

Lakukan pemetaan seluruh file dan folder:
- root files;
- docs;
- public;
- scripts;
- src;
- components;
- pages;
- hooks;
- services;
- utils;
- lib;
- types;
- data;
- config;
- accounting files;
- Google Apps Script files;
- file markdown;
- temporary/audit files.

Buat tabel:
| Current File/Folder | Purpose Detected | Used By | Problem | Suggested Action |

Kategorikan setiap file ke domain:
- auth;
- dashboard;
- residents;
- rooms;
- billing;
- payments;
- gallon-tracker;
- accounting;
- reports;
- notifications;
- settings;
- shared UI;
- layout;
- config;
- services;
- utils;
- types;
- scripts;
- documentation;
- archive candidate.

==================================================
2. DETEKSI FILE YANG PERLU RENAME
==================================================

Cari file dengan nama:
- terlalu generik;
- tidak menjelaskan isi;
- tidak sesuai domain;
- menggunakan nama lama;
- typo;
- tidak konsisten dengan naming convention;
- mirip dengan file lain sehingga membingungkan.

Gunakan aturan:
- Page harus berakhiran `Page.tsx`.
- Component harus PascalCase dan menjelaskan konteks.
- Service harus berakhiran `.service.ts`.
- Hook harus diawali `use`.
- Utility harus menjelaskan fungsi, misalnya `currency.ts`, `date.ts`, `format.ts`.
- Type global masuk ke `src/types`, type fitur masuk ke folder fitur.

Buat tabel:
| Current Name | Current Location | Problem | New Name | New Location | Import Impact | Priority |

Jangan rename sebelum membuat daftar lengkap.

==================================================
3. USULKAN STRUKTUR FOLDER FINAL
==================================================

Gunakan struktur berbasis fitur:

src/
├── app/
├── assets/
├── components/
│   ├── ui/
│   ├── layout/
│   ├── common/
│   ├── data-display/
│   ├── forms/
│   ├── feedback/
│   └── navigation/
├── config/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── residents/
│   ├── rooms/
│   ├── billing/
│   ├── payments/
│   ├── gallon-tracker/
│   ├── accounting/
│   ├── reports/
│   ├── notifications/
│   └── settings/
├── hooks/
├── lib/
├── services/
├── types/
└── utils/

Untuk setiap feature, gunakan pola:
feature-name/
├── components/
├── pages/
├── hooks/
├── services/
├── data/
├── types.ts
└── index.ts

Khusus accounting:
features/accounting/
├── components/
├── pages/
├── calculations/
├── services/
├── data/
├── types.ts
└── index.ts

==================================================
4. RAPIKAN ACCOUNTING CYCLE LIBRARY
==================================================

Accounting module harus dipisahkan menjadi:
- UI pages;
- reusable components;
- calculation logic;
- data access service;
- default chart of accounts;
- accounting types;
- journal generation logic;
- ledger calculation;
- trial balance calculation;
- adjustment logic;
- closing entry logic;
- reversing entry logic.

Pastikan calculation logic tidak bercampur di page component.

Buat tabel:
| Current Accounting File | Current Role | Suggested New Location | Suggested New Name | Reason |

==================================================
5. KONSOLIDASI DOKUMENTASI MARKDOWN
==================================================

Audit semua file `.md` di root dan docs.

Tujuan:
Meringkas banyak file markdown menjadi beberapa dokumen utama tanpa kehilangan konteks.

Struktur dokumentasi final:

docs/
├── 01-PROJECT-OVERVIEW.md
├── 02-ARCHITECTURE.md
├── 03-ROLES-AND-PERMISSIONS.md
├── 04-UI-UX-GUIDELINES.md
├── 05-DATA-AND-INTEGRATION.md
├── 06-ACCOUNTING-CYCLE.md
├── 07-DEPLOYMENT-AND-ENV.md
├── 08-AUDIT-AND-ROADMAP.md
└── archive/
    └── legacy-docs/

README.md tetap berada di root sebagai pintu masuk utama.

README.md harus berisi:
- nama project;
- deskripsi singkat;
- tech stack;
- fitur utama;
- role utama;
- quick start;
- environment variables;
- link ke dokumentasi docs;
- deployment link;
- status project.

Gabungkan:
- DESIGN.md ke `docs/04-UI-UX-GUIDELINES.md`;
- ROLE_STRUCTURE_SOEMATRA_KOST.md ke `docs/03-ROLES-AND-PERMISSIONS.md`;
- README_SIDEBAR_ANIMATION.md ke `docs/04-UI-UX-GUIDELINES.md` jika masih relevan;
- audit report lama ke `docs/08-AUDIT-AND-ROADMAP.md`;
- detail Google Sheets/API ke `docs/05-DATA-AND-INTEGRATION.md`;
- accounting docs ke `docs/06-ACCOUNTING-CYCLE.md`.

Dokumen lama yang sudah digabung jangan dihapus dulu. Pindahkan ke:
docs/archive/legacy-docs/

Buat tabel:
| Current Markdown File | Keep/Merge/Archive | Target Document | Reason |

==================================================
6. EKSEKUSI BERTAHAP
==================================================

Lakukan dalam fase berikut:

Phase 1: Inventory and Mapping
- Buat peta file dan dependency.
- Buat daftar rename/move.
- Buat `docs/STRUCTURE_REFACTOR_PLAN.md`.

Phase 2: Documentation Consolidation
- Buat struktur docs baru.
- Gabungkan dokumen markdown.
- Update README.md.
- Pindahkan dokumen lama ke archive.

Phase 3: Create New Folder Structure
- Buat folder `src/app`, `src/features`, `src/config`, `src/services`, `src/types`, dan rapikan `src/lib`.
- Jangan pindahkan semua file sekaligus.

Phase 4: Move Shared Files
- Pindahkan shared components, layout, utils, config, services, types.
- Update import path.
- Jalankan lint/build.

Phase 5: Move Feature Files
- Pindahkan fitur satu per satu:
  1. auth
  2. dashboard
  3. residents
  4. rooms
  5. billing
  6. payments
  7. gallon-tracker
  8. accounting
  9. reports
  10. settings

Setelah tiap fitur:
npm run lint
npm run build

Phase 6: Accounting Library Cleanup
- Pisahkan calculation logic, services, pages, components, data, dan types.
- Pastikan output accounting tetap sama.

Phase 7: Final Validation
- Jalankan lint/build/dev.
- Smoke test semua route.
- Pastikan tidak ada broken import.
- Pastikan tidak ada broken markdown link.

==================================================
7. OUTPUT WAJIB
==================================================

Buat file:
docs/STRUCTURE_REFACTOR_PLAN.md

Isi:
# Structure Refactor Plan

## 1. Current Structure Snapshot
## 2. Problems Found
## 3. Proposed Folder Structure
## 4. File Rename Plan
## 5. File Move Plan
## 6. Accounting Module Refactor Plan
## 7. Documentation Consolidation Plan
## 8. Migration Phases
## 9. Risk Analysis
## 10. Validation Checklist
## 11. Final Summary

Setelah itu, jika perubahan struktur mulai dieksekusi, buat ringkasan:
- folder baru yang dibuat;
- file yang dipindahkan;
- file yang di-rename;
- import yang diperbarui;
- dokumen yang digabung;
- dokumen yang dipindahkan ke archive;
- hasil lint/build;
- sisa pekerjaan.

==================================================
8. VALIDATION CHECKLIST
==================================================

Jalankan:
npm run lint
npm run build
npm run dev

Cek manual:
- login semua role;
- dashboard semua role;
- sidebar semua role;
- manajemen penghuni;
- manajemen kamar;
- tagihan;
- pembayaran;
- validasi pembayaran;
- galon tracker;
- accounting module;
- laporan;
- settings/profil;
- responsive mobile;
- link dokumentasi README ke docs.

==================================================
9. BATASAN
==================================================

- Jangan ubah behavior sistem.
- Jangan ubah UI visual besar-besaran.
- Jangan ubah schema data.
- Jangan ubah security logic kecuali import path perlu diperbaiki.
- Jangan hapus file lama tanpa bukti tidak dipakai.
- Jangan hapus markdown lama; archive dulu.
- Jangan melakukan semua rename sekaligus tanpa build checkpoint.
- Fokus pada maintainability, readability, scalability, dan onboarding developer baru.
```

---

## 11. Prompt Eksekusi Setelah Plan Disetujui

```md
Berdasarkan `docs/STRUCTURE_REFACTOR_PLAN.md`, jalankan Phase 1 sampai Phase 3 terlebih dahulu.

Prioritas:
1. Buat inventory seluruh file.
2. Buat daftar rename dan move.
3. Konsolidasikan dokumentasi markdown.
4. Buat folder struktur baru.
5. Update README.md agar menjadi pintu masuk dokumentasi.
6. Pindahkan dokumen lama ke `docs/archive/legacy-docs/` setelah digabung.

Jangan pindahkan semua source code fitur dulu.
Jangan ubah behavior sistem.
Jangan ubah business logic.
Jangan ubah UI/UX.
Jangan hapus file lama secara permanen.

Setelah selesai, jalankan:
npm run lint
npm run build

Lalu laporkan:
- file dokumentasi yang dibuat;
- file dokumentasi yang digabung;
- file yang dipindahkan ke archive;
- folder struktur baru yang dibuat;
- hasil lint/build;
- rekomendasi untuk Phase 4 sampai Phase 7.
```
