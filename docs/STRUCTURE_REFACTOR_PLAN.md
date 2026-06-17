# Structure Refactor Plan

## 1. Current Structure Snapshot

Struktur repositori aktual saat ini:
```txt
.
├── DESIGN.md
├── README.md
├── README_SIDEBAR_ANIMATION.md
├── REFACTOR_STRUCTURE_PLAN_SOEMATRA_KOST_7D03430.md
├── ROLE_STRUCTURE_SOEMATRA_KOST.md
├── google-apps-script.js
├── sheet_audit.json
├── docs/
│   ├── accounting-policy.md
│   ├── deployment.md
│   ├── rbac.md
│   ├── schema.md
│   └── audits/
│       ├── AUDIT_PLAN_SOEMATRA_KOST_C6BA09F.md
│       ├── AUDIT_REPORT_SOEMATRA_KOST.md
│       ├── CHECKPOINT_AUDIT_C6BA09F_SOEMATRA_KOST.md
│       ├── CHECKPOINT_AUDIT_SOEMATRA_KOST.md
│       └── financial_statements.md
├── scripts/
│   ├── test.js
│   ├── update_contributions_temp.cjs
│   └── update_currency.cjs
├── src/
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   ├── assets/
│   │   └── hero.png
│   ├── components/
│   │   ├── accounting/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── layouts/
│   │   ├── shared/
│   │   └── ui/
│   ├── hooks/
│   ├── lib/
│   │   └── accounting/
│   ├── pages/
│   │   ├── auth/
│   │   └── dashboard/
│   ├── services/
│   ├── stores/
│   ├── types/
│   └── utils/
```

---

## 2. Problems Found

1. **Struktur Folder Terfragmentasi**: Berkas page, hook, dan component diletakkan terpisah secara terpisah-pisah di root `src/pages`, `src/components`, dan `src/hooks` alih-alih dikelompokkan berdasarkan fitur bisnis (e.g. `billing`, `accounting`).
2. **Nama Berkas Ambigu/Generik**: Berkas seperti `Dashboard.tsx` menangani 3 dashboard role yang berbeda. Halaman `Login.tsx` dan `MasterData.tsx` berada di struktur yang kurang jelas.
3. **Pencampuran Business Logic & UI**: Logika perhitungan akuntansi IFRS diletakkan di `src/lib/accounting` dan beberapa file halaman dashboard langsung melakukan sinkronisasi tanpa pemisah layer service yang bersih.
4. **Dokumentasi Tumpang Tindih**: Banyak berkas `.md` di root dan folder `docs/audits/` yang menjelaskan konsep serupa seperti peran (RBAC), arsitektur, dan laporan audit secara terpisah.

---

## 3. Proposed Folder Structure

Struktur folder target setelah refaktorisasi:
```txt
src/
├── app/
│   ├── App.css
│   ├── App.tsx
│   └── providers.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   └── common/
├── config/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── residents/
│   ├── billing/
│   ├── payments/
│   ├── gallon-tracker/
│   ├── accounting/
│   ├── reports/
│   ├── notifications/
│   └── settings/
├── services/
├── types/
└── utils/
```

Tiap subfolder di `src/features/[feature-name]` akan mengikuti konvensi berikut:
```txt
feature-name/
├── components/
├── pages/
├── hooks/
├── services/
├── data/
├── types.ts
└── index.ts
```

---

## 4. File Rename Plan

| Current Name | Target Location & Name | Reason |
|---|---|---|
| `pages/auth/Login.tsx` | `features/auth/pages/LoginPage.tsx` | Mengikuti konvensi akhiran `Page.tsx` |
| `pages/dashboard/Dashboard.tsx` | `features/dashboard/pages/DashboardPage.tsx` | Penamaan spesifik untuk halaman dashboard portal |
| `pages/dashboard/admin/ManajemenWarga.tsx` | `features/residents/pages/ResidentsPage.tsx` | Generalisasi penamaan domain warga/residents |
| `components/admin/warga/WargaFormModal.tsx` | `features/residents/components/ResidentFormModal.tsx` | Mengubah ke PascalCase bahasa Inggris |
| `components/admin/warga/WargaTable.tsx` | `features/residents/components/ResidentTable.tsx` | Mengubah ke PascalCase bahasa Inggris |
| `pages/dashboard/duties/DutySchedules.tsx` | `features/residents/pages/DutySchedulesPage.tsx` | Piket dipindahkan ke domain warga kos |
| `pages/dashboard/duties/MyDuties.tsx` | `features/residents/pages/MyDutiesPage.tsx` | Piket personal dipindahkan ke domain warga kos |
| `pages/dashboard/finance/BillingDashboard.tsx` | `features/billing/pages/BillingDashboardPage.tsx` | Penamaan spesifik untuk halaman penagihan admin |
| `pages/dashboard/finance/BillsPayments.tsx` | `features/billing/components/BillsPaymentsList.tsx` | Dipindahkan sebagai sub-view list tagihan |
| `pages/dashboard/finance/Reminders.tsx` | `features/billing/components/BillingReminders.tsx` | Sub-view untuk pengingat tagihan |
| `pages/dashboard/bills/ResidentBillsList.tsx` | `features/billing/components/ResidentBillsList.tsx` | Sub-view tagihan untuk warga |
| `pages/dashboard/bills/UserBillingDashboard.tsx` | `features/billing/pages/ResidentBillingPage.tsx` | Dashboard tagihan di sisi penghuni |
| `pages/dashboard/contributions/ContributionsList.tsx` | `features/billing/pages/ContributionsPage.tsx` | Katalog iuran kos |
| `services/billingService.ts` | `features/billing/services/billing.service.ts` | Mengikuti konvensi `.service.ts` |
| `pages/dashboard/finance/Verification.tsx` | `features/payments/pages/PaymentVerificationPage.tsx` | Halaman verifikasi pembayaran oleh bendahara |
| `pages/dashboard/bills/PaymentConfirm.tsx` | `features/payments/components/PaymentConfirmForm.tsx` | Form upload bukti bayar |
| `pages/dashboard/bills/PaymentHistory.tsx` | `features/payments/components/PaymentHistoryTable.tsx` | Tabel riwayat pembayaran warga |
| `pages/dashboard/gallons/GallonsDashboard.tsx` | `features/gallon-tracker/pages/GallonsDashboardPage.tsx` | Halaman dashboard galon admin |
| `pages/dashboard/gallons/GallonsInfo.tsx` | `features/gallon-tracker/pages/GallonsInfoPage.tsx` | Info galon untuk warga |
| `pages/dashboard/gallons/GallonTracker.tsx` | `features/gallon-tracker/components/GallonTransactionsList.tsx` | Transaksi galon |
| `pages/dashboard/gallons/Vendors.tsx` | `features/gallon-tracker/pages/GallonVendorsPage.tsx` | Pengaturan vendor galon |
| `pages/dashboard/finance/FinanceDashboard.tsx` | `features/accounting/pages/AccountingDashboardPage.tsx` | Dashboard akuntansi bendahara |
| `pages/dashboard/finance/CashReports.tsx` | `features/reports/pages/CashReportsPage.tsx` | Laporan arus kas |
| `pages/dashboard/user/UserInformationDashboard.tsx` | `features/notifications/pages/UserInformationDashboardPage.tsx` | Dashboard info warga (notifikasi & pengumuman) |
| `pages/dashboard/user/Notifications.tsx` | `features/notifications/components/NotificationsList.tsx` | List notifikasi warga |
| `pages/dashboard/user/Announcements.tsx` | `features/notifications/components/AnnouncementsList.tsx` | List pengumuman warga |
| `pages/dashboard/admin/AuditLogs.tsx` | `features/settings/pages/AuditLogsPage.tsx` | Halaman log audit sistem |
| `pages/dashboard/admin/BackupRestore.tsx` | `features/settings/pages/BackupRestorePage.tsx` | Halaman backup database |
| `pages/dashboard/admin/NotificationSettings.tsx` | `features/settings/pages/NotificationSettingsPage.tsx` | Pengaturan notifikasi sistem |
| `pages/dashboard/admin/RolesPermissions.tsx` | `features/settings/pages/RolesPermissionsPage.tsx` | Manajemen otorisasi |
| `pages/dashboard/admin/SystemSettings.tsx` | `features/settings/pages/SystemSettingsPage.tsx` | Pengaturan aplikasi |
| `pages/dashboard/admin/MasterData.tsx` | `features/settings/pages/MasterDataPage.tsx` | Data kategori & metode pembayaran |
| `pages/dashboard/user/ProfileSettings.tsx` | `features/settings/pages/ProfileSettingsPage.tsx` | Pengaturan profil |
| `components/admin/master/CategoryTable.tsx` | `features/settings/components/CategoryTable.tsx` | Tabel kategori beban/pendapatan |
| `components/admin/master/PaymentMethodTable.tsx` | `features/settings/components/PaymentMethodTable.tsx` | Tabel bank pembayaran |
| `components/admin/master/MasterFormModals.tsx` | `features/settings/components/MasterFormModals.tsx` | Modal form master data |

---

## 5. File Move Plan

1. **Shared Layouts**:
   - `src/components/layouts/*` -> `src/components/layout/*`
2. **Shared UI**:
   - `src/components/ui/*` -> tetap di `src/components/ui/*`
3. **Shared Common Components**:
   - `src/components/shared/ErrorBoundary.tsx` -> `src/components/common/ErrorBoundary.tsx`
4. **Services & Lib**:
   - `src/lib/spreadsheet.ts` -> `src/services/sheets-client.ts`
   - `src/lib/spreadsheet.test.ts` -> `src/services/sheets-client.test.ts`
   - `src/lib/utils.ts` -> `src/utils/styles.ts`
5. **Apps Script & Scripts**:
   - `google-apps-script.js` -> `scripts/google-apps-script/soematra-sheets-api.gs`
   - `sheet_audit.json` -> `scripts/audit/sheet-audit.json`
   - `scripts/update_contributions_temp.cjs` -> `scripts/maintenance/update-contributions.cjs`
   - `scripts/update_currency.cjs` -> `scripts/maintenance/update-currency.cjs`

---

## 6. Accounting Module Refactor Plan

Kami mengelompokkan kode akuntansi di `src/features/accounting` menjadi subfolder berikut:
1. **`pages/`**:
   - `AccountingDashboardPage.tsx`
2. **`components/`**:
   - `GeneralJournalView.tsx`
   - `GeneralLedgerView.tsx`
   - `TrialBalanceView.tsx`
   - `FinancialStatementsView.tsx`
   - `FinancialSummaryView.tsx`
   - `AdjustingEntriesView.tsx`
   - `ClosingProcessView.tsx`
   - `JournalEntryForm.tsx`
   - `JournalEntryModal.tsx`
   - `AccountingDownloadMenu.tsx`
3. **`calculations/`**:
   - Seluruh engine akuntansi (`AccountingEngine.ts`, `ChartOfAccounts.ts`, `ClosingProcess.ts`, `DoubleEntryEngine.ts`, `DoubleEntryEngine.test.ts`, `FinancialStatements.ts`, `GeneralJournal.ts`, `GeneralLedger.ts`, `index.ts`, `optimizedCycle.ts`, `optimizedCycle.test.ts`, `period.ts`, `TrialBalance.ts`, `types.ts`)
4. **`services/`**:
   - `sync.ts` (penyedia sinkronisasi Sheets akuntansi)
   - `billingAccountingSync.ts` (jurnal otomatis transaksi tagihan)
5. **`data/`**:
   - `chartOfAccounts.ts` (Bagan akun bawaan kos)

---

## 7. Documentation Consolidation Plan

Kami mengonsolidasikan file markdown menjadi 8 dokumen utama di dalam folder `docs/`:

1. **`docs/01-PROJECT-OVERVIEW.md`**: Menjelaskan visi kos, modul utama, dan fungsionalitas sistem.
2. **`docs/02-ARCHITECTURE.md`**: Menjelaskan arsitektur client-side dan integrasi API Sheets.
3. **`docs/03-ROLES-AND-PERMISSIONS.md`**: Menggabungkan `ROLE_STRUCTURE_SOEMATRA_KOST.md` & `docs/rbac.md`.
4. **`docs/04-UI-UX-GUIDELINES.md`**: Menggabungkan `DESIGN.md` & `README_SIDEBAR_ANIMATION.md`.
5. **`docs/05-DATA-AND-INTEGRATION.md`**: Menggabungkan `docs/schema.md` & detail Apps Script.
6. **`docs/06-ACCOUNTING-CYCLE.md`**: Menggabungkan `docs/accounting-policy.md` & `docs/audits/financial_statements.md`.
7. **`docs/07-DEPLOYMENT-AND-ENV.md`**: Menggabungkan `docs/deployment.md` & setup environment.
8. **`docs/08-AUDIT-AND-ROADMAP.md`**: Menggabungkan seluruh berkas audit di dalam `docs/audits/`.

Seluruh berkas legasi dipindahkan ke `docs/archive/legacy-docs/` agar tidak mengotori repositori utama.

---

## 8. Migration Phases

1. **Phase 1: Inventory & Snapshot**: Pemetaan awal, penulisan rencana restrukturisasi (Selesai).
2. **Phase 2: Konsolidasi Dokumentasi**: Menggabungkan berkas `.md` ke folder `docs/`, memperbarui `README.md`, memindahkan dokumen lama ke `archive/`.
3. **Phase 3: Pembuatan Folder Baru**: Menginisialisasi folder target di bawah `src/features` dan folder bersama (`shared`).
4. **Phase 4: Pemindahan Kode Bersama**: Memindahkan layout, utils, shared UI, sheets API, dan menyinkronkan import path.
5. **Phase 5: Pemindahan Kode Fitur (Bertahap)**: Migrasi fitur per fitur (Auth -> Dashboard -> Residents -> Billing -> Payments -> Gallons -> Accounting -> Reports -> Notifications -> Settings) disertai pengujian build/lint setelah tiap batch.
6. **Phase 6: Perapian Library Siklus Akuntansi**: Penempatan berkas kalkulasi ke folder `calculations` dalam `features/accounting`.
7. **Phase 7: Validasi Akhir**: Pengujian penuh linting, Vitest unit testing, dan smoke test seluruh role di antarmuka web.

---

## 9. Risk Analysis

* **Broken Imports**: Risiko tertinggi akibat perubahan lokasi file yang cukup masif.
  * *Mitigasi*: Penggunaan absolute import alias `@/` meminimalkan dampak jika memindahkan sub-folder secara utuh. Kami akan memperbarui import path secara teliti menggunakan fitur linter dan IDE refactoring.
* **Accounting Engine Broken**: Perubahan lokasi file akuntansi dapat memecah import pada unit test.
  * *Mitigasi*: Jalankan `npm run test` setelah setiap pemindahan berkas akuntansi untuk memastikan tes Vitest tetap hijau.

---

## 10. Validation Checklist

- [ ] `npm run lint` menghasilkan 0 error.
- [ ] `npm run build` sukses melakukan kompilasi bundel produksi.
- [ ] `npm run test` meloloskan seluruh 29 unit test.
- [ ] Semua rute di `App.tsx` dapat diakses sesuai peran (Super Admin, Admin, Warga).
- [ ] Berkas markdown tidak memiliki broken links.

---

## 11. Final Summary

Rencana restrukturisasi folder dan konsolidasi dokumentasi ini dirancang agar tidak mengubah logika akuntansi maupun antarmuka pengguna kos, melainkan hanya meningkatkan keterbacaan, keteraturan, dan pemeliharaan jangka panjang kode Soematra Kost.
