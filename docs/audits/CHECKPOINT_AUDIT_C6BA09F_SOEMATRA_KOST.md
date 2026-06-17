# Checkpoint Audit C6BA09F - Soematra Kost

Tanggal audit: 17 Juni 2026  
Auditor: Codex  
Mode audit: read-only audit, tanpa redesign dan tanpa perbaikan kode aplikasi  
Target commit: `c6ba09f`

## 1. Executive Summary

Sistem Soematra Kost adalah React SPA dengan Google Apps Script/Spreadsheet sebagai sumber data utama. Secara teknis aplikasi dapat di-install, lint, build, dan dijalankan pada dev server. UI utama sudah cukup konsisten di banyak halaman, dan modul accounting cycle sudah mulai memiliki struktur library terpisah.

Namun, sistem belum siap produksi untuk data kos riil karena fondasi keamanan, otorisasi, integritas data, dan integrasi accounting masih lemah. Risiko terbesar berada pada login dengan password plaintext dari spreadsheet, session dan role yang disimpan dan divalidasi di client, API spreadsheet yang dipanggil langsung dari browser, serta operasi data generik yang bergantung pada validasi backend Apps Script yang belum terbukti dari repo frontend ini.

Kesimpulan kesiapan:

| Area | Status | Catatan |
|---|---:|---|
| Build aplikasi | Lulus | `npm run build` berhasil |
| Lint | Lulus dengan warning | 9 warning `react-hooks/exhaustive-deps` |
| Runtime dev | Lulus awal | Vite dev server berhasil start |
| Test otomatis | Belum siap | Tidak ada script `test` |
| Security production | Tidak siap | Auth, RBAC, dan API masih client-heavy |
| Accounting cycle | Parsial | Library ada, integrasi transaksi belum lengkap |
| UI/UX | Cukup baik, belum konsisten penuh | Masih ada native `alert/confirm`, halaman besar, dan potensi mobile table |
| Data model | Belum kuat | Spreadsheet tidak memiliki constraint, ownership, atau audit trail kuat |

## 2. Latest Commit Audited

Commit terakhir yang diaudit:

```text
c6ba09f (HEAD -> main, origin/main) add some library of accounting cycle and repair messy design of UI
```

Catatan worktree saat audit:

- File audit plan `AUDIT_PLAN_SOEMATRA_KOST_C6BA09F.md` berada sebagai file untracked.
- Audit ini menilai kondisi repo pada commit `c6ba09f` plus kondisi worktree saat ini.
- File output audit ini dibuat sebagai `CHECKPOINT_AUDIT_C6BA09F_SOEMATRA_KOST.md`.

## 3. Current System Architecture

Arsitektur yang terdeteksi:

```text
Browser React SPA
  -> React Router dashboard routes
  -> Zustand auth/session store
  -> spreadsheetApi generic client
  -> Google Apps Script endpoint
  -> Google Spreadsheet sheets
```

Komponen utama:

| Layer | Implementasi | Catatan |
|---|---|---|
| Frontend | React + Vite + TypeScript | Semua role berada dalam satu SPA |
| Routing | React Router DOM | Route guard client-side via `ProtectedRoute` dan `DashboardLayout` |
| Auth state | `src/hooks/useAuth.ts` | Session disimpan di `localStorage` |
| Data access | `src/lib/spreadsheet.ts` | Generic CRUD ke sheet apa pun |
| Accounting | `src/lib/accounting/*` | Ada engine dan generator siklus accounting |
| UI | Tailwind + custom components + lucide-react | Konsistensi meningkat, tapi belum merata |
| Charts | Recharts | Dipakai pada dashboard dan laporan |

Masalah arsitektur utama:

- Browser memegang terlalu banyak kewenangan data.
- Tidak ada backend aplikasi yang jelas untuk auth, RBAC, validasi ownership, dan audit log.
- Apps Script/Spreadsheet menjadi database sekaligus API, tetapi kontrak keamanan backend tidak terlihat di repo ini.

## 4. Tech Stack Detected

Berdasarkan `package.json`:

| Kategori | Stack |
|---|---|
| App framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS 4, custom CSS |
| Routing | React Router DOM 7 |
| State | Zustand |
| Icons | lucide-react |
| Charts | Recharts |
| Spreadsheet | Google Apps Script endpoint via fetch |
| Lint | ESLint 9 |

Script tersedia:

| Script | Status |
|---|---|
| `npm run dev` | Ada |
| `npm run build` | Ada |
| `npm run lint` | Ada |
| `npm run preview` | Ada |
| `npm run test` | Tidak ada |

## 5. Build, Lint, and Runtime Audit

Command yang dijalankan:

| Command | Hasil | Risiko |
|---|---|---|
| `npm install` | Berhasil, 0 vulnerability terlapor | Low |
| `npm run lint` | Berhasil dengan 9 warning | Medium |
| `npm run build` | Berhasil | Medium |
| `npm run test` | Gagal karena script tidak ada | High |
| `npm run dev -- --host 127.0.0.1 --port 5174` | Server berhasil start | Low |

Detail lint warning:

- `Dashboard.tsx`: missing dependency `fetchDashboardData`
- `PaymentConfirm.tsx`: missing dependency `fetchBills`
- `PaymentHistory.tsx`: missing dependency `fetchHistory`
- `ResidentBillsList.tsx`: missing dependency `fetchBills`
- `MyDuties.tsx`: missing dependency `fetchData`
- `BillsPayments.tsx`: missing dependency `fetchBills`
- `BillsPayments.tsx`: missing dependency `templates.length`
- `Reminders.tsx`: missing dependency `fetchData`
- `Notifications.tsx`: missing dependency `profile`

Detail build warning:

- Tailwind class ambiguous: `delay-[3s]`
- Tailwind class ambiguous: `ease-[cubic-bezier(0.4,0,0.2,1)]`
- Bundle JS utama lebih dari 500 kB setelah minify, sekitar 1.06 MB.

Implikasi:

- Build tidak rusak, tetapi belum ada safety net test.
- Missing dependency pada hook dapat menyebabkan data stale, fetch tidak konsisten, atau behavior berbeda saat state berubah.
- Bundle besar perlu code splitting terutama halaman dashboard besar.

## 6. Folder and File Structure Audit

Struktur utama:

```text
src/
  assets/
  components/
  hooks/
  lib/
  pages/
  stores/
```

File besar yang perlu perhatian:

| File | Perkiraan baris | Risiko |
|---|---:|---|
| `src/pages/dashboard/gallons/GallonTracker.tsx` | 998 | Terlalu besar, rawan regresi |
| `src/pages/dashboard/gallons/GallonsInfo.tsx` | 780 | Terlalu besar |
| `src/pages/dashboard/Dashboard.tsx` | 742 | Logika multi-role terlalu padat |
| `src/pages/dashboard/contributions/ContributionsList.tsx` | 707 | UI dan business logic bercampur |
| `src/pages/dashboard/finance/BillsPayments.tsx` | 672 | Banyak state dan operasi data |
| `src/lib/accounting/optimizedCycle.ts` | 553 | Logic accounting padat, perlu test |
| `src/components/accounting/JournalEntryForm.tsx` | 527 | Form kompleks, perlu validasi terpisah |
| `src/pages/dashboard/finance/views/FinancialStatementsView.tsx` | 502 | UI laporan besar |

Temuan struktur:

- Business logic banyak berada langsung di komponen page.
- CRUD spreadsheet generik dipakai dari banyak UI tanpa service/domain layer yang kuat.
- Tidak terlihat folder `services` atau repository layer untuk transaksi domain.
- File sementara dan artefak audit lama masih berada di root.

File/artefak yang berpotensi redundan atau perlu dirapikan:

- `financial statements.md`
- `sheet_audit.json`
- `test.js`
- `update_contributions_temp.cjs`
- `update_currency.cjs`
- `README_SIDEBAR_ANIMATION.md`
- `AUDIT_REPORT_SOEMATRA_KOST.md`
- `CHECKPOINT_AUDIT_SOEMATRA_KOST.md`
- `src/assets/react.svg`
- `vite.svg`

## 7. Security Audit

Temuan keamanan utama:

| Severity | Temuan | Lokasi | Dampak |
|---|---|---|---|
| Critical | Login membandingkan email dan password plaintext dari sheet | `src/pages/auth/Login.tsx` | Kebocoran data user dan takeover akun |
| Critical | Session dan role disimpan di `localStorage` dan divalidasi client-side | `src/hooks/useAuth.ts` | Role dapat dimanipulasi dari browser |
| Critical | Fallback session secret berada di frontend | `src/hooks/useAuth.ts` | Signature tidak memberi keamanan riil |
| Critical | API spreadsheet dipanggil langsung dari browser | `src/lib/spreadsheet.ts` | Endpoint dan operasi data terekspos |
| High | Token API berbasis `VITE_` dikirim dari client | `src/lib/spreadsheet.ts` | Token client bukan secret |
| High | Token juga dikirim via query/payload fallback | `src/lib/spreadsheet.ts` | Risiko bocor melalui log, history, proxy |
| High | Generic CRUD dapat menarget sheet apa pun | `src/lib/spreadsheet.ts` | Jika backend longgar, semua data bisa dimanipulasi |
| High | Filter data user dilakukan di client | beberapa page user | User dapat melihat data lain jika API tidak membatasi |
| High | Restore backup dari frontend | `BackupRestore.tsx` | Risiko overwrite seluruh data |
| Medium | Upload bukti pembayaran disimpan base64 | `PaymentConfirm.tsx` | Pembengkakan sheet, validasi file lemah |
| Medium | Banyak `alert/confirm` native | banyak file | UX buruk, sulit audit action flow |

Catatan penting:

README sudah menyebut bahwa signature frontend bukan pengganti auth backend. Ini benar, tetapi berarti sistem belum memenuhi kebutuhan keamanan production sampai backend benar-benar menerapkan auth, RBAC, dan validasi data.

## 8. Role-Based Access Audit

Role yang terdeteksi:

- `super admin`
- `admin`
- `user`

Route guard:

| Area | Guard | Catatan |
|---|---|---|
| Dashboard layout | Redirect jika tidak ada profile | Client-side |
| Super admin pages | `ProtectedRoute allowedRoles={['super admin']}` | Client-side |
| Admin/bendahara pages | `ProtectedRoute allowedRoles={['super admin','admin']}` | Client-side |
| User/common pages | `ProtectedRoute allowedRoles={['super admin','admin','user']}` | Client-side |

Temuan RBAC:

- Role aktif dapat berasal dari session client.
- Multi-role disimpan sebagai string comma-separated.
- Sidebar menyembunyikan menu berdasarkan role, tetapi ini bukan kontrol keamanan.
- Jika pengguna bisa memodifikasi `localStorage`, akses route dapat dipalsukan bila tidak ada validasi server.
- Operasi CRUD spreadsheet tidak membawa bukti otorisasi yang kuat selain token client.

Risiko per role:

| Role | Risiko |
|---|---|
| Super admin | Restore backup dan master data berbahaya jika session dipalsukan |
| Admin/Bendahara | Dapat mengubah data billing, finance, gallon, duties melalui client |
| User | Data sendiri difilter client-side, perlu enforcement backend |

## 9. Cross-Role Integration Audit

Audit alur antar role:

| Alur | Status | Masalah |
|---|---|---|
| Admin membuat tagihan -> user melihat tagihan | Parsial | Ada di Bills, tetapi ownership harus server-side |
| User konfirmasi pembayaran -> admin verifikasi | Parsial | Ada Payments dan Bills update |
| Admin verifikasi pembayaran -> accounting journal | Tidak lengkap | Belum terlihat posting jurnal otomatis Dr Kas / Cr Piutang |
| Admin membuat tagihan -> accounting journal | Tidak lengkap | Belum terlihat posting Dr Piutang / Cr Pendapatan atau Pendapatan Ditangguhkan |
| Pengeluaran -> journal | Parsial baik | `Expenses.tsx` membuat JournalEntries |
| Galon -> biaya/stock/accounting | Parsial | Alur operasional ada, integrasi accounting belum kuat |
| Duty schedule admin -> user duty page | Parsial | Ada assignment, tetapi perlu validasi data ownership |
| Dashboard admin/user/super admin | Parsial | Banyak data aggregate dihitung client-side |

Masalah integrasi terbesar:

- Pembayaran yang disetujui tidak otomatis menjadi jurnal accounting yang lengkap.
- Status tagihan disinkronkan dengan jurnal secara fuzzy pada sebagian kasus, tetapi bukan domain transaction yang deterministic.
- Tidak ada transaction boundary: update Payments, Bills, dan JournalEntries dapat sebagian sukses dan sebagian gagal.

## 10. UI/UX Design Consistency Audit

Kondisi umum:

- UI sudah memiliki bahasa visual hijau-putih, card, tabel, tab, dan icon yang cukup konsisten.
- Beberapa halaman dashboard admin/bendahara terlihat lebih matang daripada halaman lain.
- Tab finance dan billing sudah mengarah ke konsistensi visual.

Masalah UI/UX:

| Severity | Temuan | Dampak |
|---|---|---|
| High | Masih banyak native `alert/confirm` | Dialog tidak konsisten dengan modal sistem |
| Medium | Halaman besar dan padat | Sulit dipelihara dan rawan layout regression |
| Medium | Tabel mobile masih bergantung pada horizontal scroll | UX mobile kurang nyaman |
| Medium | Empty state tidak seragam | Pengguna bisa bingung saat data kosong |
| Medium | Beberapa card/dashboard berbeda density dan treatment | Konsistensi lintas role belum sempurna |
| Low | Copy informal di beberapa tempat | Tone sistem kurang profesional |

Contoh native dialog tersisa:

- `ContributionsList.tsx`
- `ProfileSettings.tsx`
- `BillsPayments.tsx`
- `Expenses.tsx`
- `GallonsInfo.tsx`
- `GallonTracker.tsx`
- `BackupRestore.tsx`
- `DutySchedules.tsx`

## 11. Responsiveness Audit

Audit dilakukan secara statis dan melalui startup dev server. Tidak dilakukan full screenshot matrix semua viewport.

Temuan:

- Banyak tabel menggunakan `overflow-x-auto`, sehingga masih bisa dibuka di mobile tetapi belum ideal.
- Beberapa toolbar memiliki banyak tab dan filter dalam satu baris, rawan overflow di layar kecil.
- Card grid dashboard relatif responsif, tetapi perlu regression test desktop/tablet/mobile.
- File page yang sangat besar membuat risiko perubahan layout sulit dikendalikan.

Rekomendasi:

- Buat mobile table pattern: card-list atau stacked rows untuk halaman utama.
- Tambahkan Playwright visual smoke test untuk halaman dashboard utama setiap role.
- Pastikan container, tab, dan action bar punya wrapping behavior yang konsisten.

## 12. Accounting Cycle Library Audit

Library accounting yang terdeteksi:

| File | Fungsi |
|---|---|
| `DoubleEntryEngine.ts` | Validasi double-entry dan COA |
| `GeneralJournal.ts` | Journal in-memory dan ID generator |
| `chartOfAccounts.ts` | Default COA |
| `optimizedCycle.ts` | Trial balance, adjustment, statements, closing entries |
| `sync.ts` | Sync MasterData dan JournalEntries ke engine |
| `period.ts` | Filter periode accounting |

Status siklus accounting:

| Tahap | Status | Catatan |
|---|---|---|
| COA | Parsial | Ada MasterData dan default chart |
| Identifikasi transaksi | Parsial | Sebagian transaksi masuk jurnal |
| Jurnal umum | Ada | Perlu validasi persistence dan edit flow |
| Posting buku besar | Ada/parsial | Bergantung data JournalEntries |
| Neraca saldo | Ada/parsial | Dihitung dari jurnal dan COA |
| Jurnal penyesuaian | Parsial | Generator ada, perlu kontrol data riil |
| Laporan keuangan | Parsial | UI dan hitungan ada, perlu test accounting |
| Jurnal penutup | Parsial | Generator ada, workflow belum kuat |
| Post-closing trial balance | Belum jelas | Tidak terlihat sebagai gate wajib |
| Reversing entries | Belum terlihat | Belum ada workflow |

Masalah accounting terbesar:

- Posting accounting belum menjadi konsekuensi otomatis dari alur bisnis utama seperti tagihan dan verifikasi pembayaran.
- ID jurnal masih memakai timestamp/random di beberapa tempat.
- Belum ada test accounting untuk memastikan debit-kredit balance di setiap workflow.
- Belum ada transaction lock atau period close control yang mencegah perubahan data setelah tutup buku.

## 13. Functionality Audit

Ringkasan fitur:

| Fitur | Status | Risiko |
|---|---|---|
| Login | Berfungsi tapi tidak aman | Critical |
| Role switching | Berfungsi client-side | High |
| Manajemen warga | Ada | Perlu validasi backend |
| Billing admin | Ada | Accounting belum lengkap |
| Billing user | Ada | Filter data client-side |
| Payment confirmation | Ada | File base64 dan no strong validation |
| Payment verification | Ada | Tidak membuat jurnal pembayaran |
| Finance expenses | Ada | Jurnal dibuat, perlu test |
| General journal | Ada | Perlu test edit/delete/bulk |
| Adjusting entries | Ada/parsial | Perlu data riil dan no mock |
| Closing entries | Ada/parsial | Perlu persistence dan empty-state riil |
| Gallon tracker | Ada | Terlalu besar dan integrasi accounting belum jelas |
| Duty schedules | Ada | Random assignment client-side |
| Backup/restore | Ada | Sangat berisiko tanpa backend guard |

## 14. Redundancy Audit

Potensi redundansi halaman/fitur:

| Area | Catatan |
|---|---|
| Billing admin vs Finance BillsPayments | Alur tagihan tersebar, perlu domain tunggal |
| Billing user legacy routes | Ada redirect legacy, perlu dokumentasi dan cleanup setelah migrasi |
| Payment confirm/history/resident bills | Perlu konsolidasi service billing user |
| Accounting old report/checkpoint files | Banyak file audit lama di root |
| Temp scripts | `update_contributions_temp.cjs`, `update_currency.cjs` perlu keputusan simpan/hapus |
| Default assets | `react.svg`, `vite.svg` tidak relevan untuk produk |
| Dialog patterns | Native dialog dan modal custom bercampur |
| ID generation | Banyak pola `Date.now()`/`Math.random()` tersebar |

## 15. Database and Data Model Audit

Sumber data utama adalah Google Spreadsheet via Apps Script. Dari frontend terlihat sheet seperti:

- `Users`
- `Bills`
- `Payments`
- `Settings`
- `JournalEntries`
- `MasterData`
- `Contributions`
- sheet lain untuk galon, duties, backup, dan modul admin

Masalah data model:

- Tidak ada constraint relational yang terlihat dari repo frontend.
- Password ada sebagai field data user.
- Tidak ada row-level ownership enforcement di frontend.
- Tidak ada migration/versioning schema.
- Tidak ada audit log standar untuk create/update/delete.
- Tidak ada soft delete standar.
- Operasi batch tidak transactional.
- File upload disimpan sebagai base64, tidak cocok untuk skala produksi.

Rekomendasi data model:

- Pindahkan auth dan RBAC ke backend.
- Tambahkan schema contract per sheet/API.
- Gunakan ID server-generated.
- Tambahkan `created_by`, `updated_by`, `deleted_at`, `version`, dan audit log.
- Pisahkan journal header dan journal lines jika accounting makin serius.

## 16. Code Quality Audit

Temuan code quality:

| Temuan | Dampak |
|---|---|
| 56 penggunaan `any` di `src` | Type safety lemah |
| Banyak komponen page lebih dari 500 baris | Sulit test dan review |
| Business logic langsung di UI | Reuse dan validasi sulit |
| Native dialog tersebar | UX dan flow confirmation tidak konsisten |
| `Date.now()` dan `Math.random()` untuk ID | Potensi collision dan data tidak deterministik |
| Missing hook dependencies | Potensi stale data |
| Tidak ada error boundary | Runtime error bisa menghasilkan layar putih |
| Generic spreadsheet API tanpa typed contract | Risiko field mismatch |

Masalah layar putih sebelumnya sangat mungkin dipicu oleh data shape yang tidak sesuai ekspektasi komponen, contohnya `.map` pada field yang ternyata bukan array. Ini menunjukkan perlunya normalizer dan guard di setiap boundary data.

## 17. Copywriting and Information Clarity Audit

Kondisi:

- Mayoritas copy menggunakan bahasa Indonesia yang mudah dipahami.
- Beberapa istilah akuntansi sudah jelas untuk admin/bendahara.
- Ada campuran bahasa Indonesia dan Inggris pada judul seperti `Adjusting Entries`, `Closing the Books`.

Masalah:

- Copy teknis dan informal bercampur.
- Error message sering generik.
- Beberapa halaman memakai istilah role "Admin", "Bendahara", "Warga" secara campur; perlu glossary.
- Beberapa state kosong belum menjelaskan aksi berikutnya.

Rekomendasi:

- Tetapkan glossary: Super Admin, Bendahara/Admin, Warga.
- Gunakan error message berbasis aksi: apa yang gagal, kenapa, apa yang harus dilakukan.
- Samakan judul bilingual: pilih Indonesia penuh atau bilingual konsisten.

## 18. Accessibility Audit

Temuan:

- Banyak icon button sudah memiliki `title`, tetapi belum semua.
- Modal custom perlu audit focus trap, Escape close, dan `aria-*`.
- Native dialog yang tersisa tidak sesuai design system.
- Tabel perlu caption atau context yang lebih baik untuk screen reader.
- Warna status perlu dicek contrast untuk teks kecil.
- Checkbox bulk action perlu label aksesibel.

Rekomendasi:

- Audit semua button icon agar punya `aria-label`.
- Modal sistem harus punya `role="dialog"`, `aria-modal`, focus management.
- Tambahkan label untuk input search/filter.
- Tambahkan keyboard navigation smoke test.

## 19. Performance Audit

Temuan:

| Area | Masalah |
|---|---|
| Bundle size | JS utama > 500 kB |
| Data fetching | Banyak page mengambil seluruh sheet lalu filter client-side |
| File upload | Bukti transfer base64 membebani sheet dan network |
| Component size | Page besar sulit dioptimasi |
| Charts/tables | Berpotensi berat jika data bertambah |

Rekomendasi:

- Code splitting per route besar.
- Server-side filtering di Apps Script/API.
- Pindahkan bukti pembayaran ke storage file, simpan URL/metadata di sheet.
- Memoization pada tabel besar setelah data model stabil.

## 20. Testing and Quality Gate Audit

Status:

- Tidak ada script `test`.
- Build dan lint ada.
- Tidak terlihat test unit untuk accounting library.
- Tidak terlihat e2e test untuk alur role.
- Tidak terlihat visual regression test.

Quality gate minimum yang disarankan:

| Gate | Prioritas |
|---|---|
| Unit test accounting double-entry | Critical |
| Unit test normalizer data sheet | Critical |
| E2E login role route access | High |
| E2E bill -> payment -> verification -> journal | Critical |
| E2E delete/bulk delete journal adjustment/closing | High |
| Build + lint in CI | High |
| Visual smoke dashboard per role | Medium |

## 21. Documentation Audit

Dokumentasi yang ada:

- `README.md`
- `DESIGN.md`
- `ROLE_STRUCTURE_SOEMATRA_KOST.md`
- `README_SIDEBAR_ANIMATION.md`
- audit report/checkpoint lama
- `financial statements.md`

Temuan:

- README cukup membantu setup Google Apps Script.
- README sudah memberi warning bahwa session signature frontend bukan pengganti backend auth.
- Belum ada dokumentasi schema sheet yang lengkap.
- Belum ada runbook deployment production.
- Belum ada matriks permission role per sheet/action.
- Belum ada dokumen accounting policy yang mengikat mapping jurnal.

Rekomendasi:

- Buat `docs/schema.md` untuk semua sheet dan field wajib.
- Buat `docs/rbac.md` berisi matriks action per role.
- Buat `docs/accounting-policy.md` untuk mapping transaksi ke jurnal.
- Arsipkan audit lama atau pindahkan ke folder `docs/audits/`.

## 22. Critical Findings

10 temuan paling kritis:

1. Password user divalidasi plaintext dari spreadsheet.
2. Session dan role disimpan di `localStorage`, sehingga RBAC dapat dimanipulasi.
3. API spreadsheet dipanggil langsung dari browser dengan operasi CRUD generik.
4. Token API berbasis `VITE_` tidak dapat dianggap secret.
5. Data user difilter di client, bukan dipastikan server-side.
6. Backup/restore seluruh data tersedia dari frontend dan sangat berbahaya jika auth bocor.
7. Alur pembayaran yang diverifikasi belum otomatis menghasilkan jurnal accounting.
8. Operasi multi-step seperti update Payments + Bills + JournalEntries tidak transactional.
9. Tidak ada test otomatis, terutama untuk accounting dan role access.
10. Banyak komponen besar dengan `any`, native dialogs, dan ID random/timestamp yang membuat regresi mudah terjadi.

## 23. Prioritized Roadmap

### Phase 1: Critical Build, Runtime, and Security Fixes

- Hapus password plaintext dari sheet dan pindahkan login ke backend auth.
- Jangan gunakan frontend session signature sebagai kontrol keamanan.
- Hapus fallback secret hardcoded.
- Pastikan Apps Script/API memvalidasi token server-side, role, ownership, dan action.
- Tambahkan error boundary agar runtime error tidak menjadi layar putih.
- Tambahkan normalizer data untuk semua sheet sebelum render.

### Phase 2: Role-Based Access and Data Protection

- Buat matriks permission role per action.
- Terapkan RBAC di backend, bukan hanya route guard.
- Pastikan user hanya bisa membaca/mengubah data miliknya dari server.
- Audit semua endpoint CRUD generik.
- Tambahkan audit log untuk create/update/delete/restore.

### Phase 3: Cross-Role Integration Stabilization

- Stabilkan alur tagihan admin -> user -> konfirmasi -> verifikasi.
- Buat transaction boundary untuk update Payments, Bills, dan JournalEntries.
- Tambahkan retry/rollback atau status kompensasi jika salah satu operasi gagal.
- Samakan status enum tagihan dan pembayaran.

### Phase 4: Accounting Cycle Logic and Integration Fixes

- Definisikan accounting policy untuk setiap transaksi.
- Saat tagihan dibuat: posting jurnal sesuai kebijakan.
- Saat pembayaran disetujui: posting Dr Kas / Cr Piutang atau mapping yang sesuai.
- Saat pengeluaran dibuat: pertahankan double-entry dan tambah test.
- Tambahkan post-closing trial balance dan period lock.
- Buat unit test untuk debit-kredit balance.

### Phase 5: UI/UX Consistency and Responsiveness Cleanup

- Ganti semua native `alert/confirm` dengan modal sistem.
- Samakan header, icon, card, tab, table, empty state, dan toast.
- Buat mobile table pattern.
- Tambahkan visual smoke test dashboard untuk super admin, admin/bendahara, dan user.

### Phase 6: Redundancy Cleanup and Structure Refactor

- Pindahkan business logic dari page besar ke hooks/services/domain modules.
- Konsolidasikan billing dan payment service.
- Rapikan file audit lama, temp script, dan default assets.
- Kurangi `any` dan buat typed model untuk setiap sheet.
- Ganti ID timestamp/random dengan ID dari backend.

### Phase 7: Testing, Documentation, and Production Readiness

- Tambahkan script `test`.
- Tambahkan unit test accounting engine dan normalizer.
- Tambahkan e2e test alur role utama.
- Dokumentasikan schema sheet, RBAC, accounting policy, dan deployment.
- Tambahkan CI: lint, typecheck, build, test.

## 24. Final Recommendation

Sistem sebaiknya belum dipakai untuk data operasional riil sebelum Phase 1 dan Phase 2 selesai. Build sudah lolos, UI sudah berkembang baik, dan accounting library memberi fondasi awal yang berguna, tetapi risiko keamanan dan integritas data masih terlalu tinggi.

Prioritas pertama bukan polishing UI, melainkan mengamankan auth, role, API data, dan normalisasi data. Setelah itu barulah integrasi accounting cycle dibuat deterministic dan diuji end-to-end dari transaksi bisnis sampai laporan keuangan.

