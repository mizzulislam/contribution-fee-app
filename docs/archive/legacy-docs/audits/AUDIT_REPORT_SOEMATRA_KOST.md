# AUDIT REPORT SOEMATRA KOST

## 1. Executive Summary
Sistem Soematra Kost saat ini berada pada fase *half-built* (setengah jalan) dengan fokus yang masih bertumpu pada pengembangan UI/UX dan *dummy state*. Tampilan visual sudah diimplementasikan dengan cukup rapi mengikuti panduan `DESIGN.md`. Namun, dari segi fungsionalitas dan keamanan, sistem ini masih sepenuhnya merupakan prototipe (*mockup*) karena belum ada integrasi *backend* (Supabase) sama sekali, dan autentikasi masih mengandalkan `localStorage` yang sangat tidak aman. Sistem ini layak dilanjutkan, namun memerlukan prioritas pada integrasi *backend* dan perbaikan manajemen *role* sebelum melanjutkan pembuatan fitur baru.

## 2. Current Tech Stack Detected
Berdasarkan `package.json` dan struktur folder, berikut adalah *tech stack* yang digunakan:
- **Frontend Framework:** React 19, Vite, TypeScript
- **Styling:** Tailwind CSS, Lucide React
- **State Management:** Zustand
- **Form Handling & Validation:** React Hook Form, Zod
- **Routing:** React Router DOM v7
- **Charts:** Recharts
- **Backend/Database:** Supabase (terdeteksi file migrasi SQL, namun *client library* `@supabase/supabase-js` **belum diinstal** di frontend).

## 3. Project Structure Audit
- **Masalah:** Struktur folder `src` sudah cukup standar, namun tidak ada folder `services` atau `api` untuk manajemen pemanggilan data ke *backend*. Semua *state* masih tergabung dalam komponen atau *store* Zustand berbasis *dummy*. Komponen halaman tertentu seperti `ManajemenWarga.tsx` (20KB) dan `MasterData.tsx` (19KB) terlalu besar.
- **Dampak:** Ketika *backend* dihubungkan, kode akan menjadi berantakan jika pemanggilan API dicampur ke dalam komponen UI. Komponen yang terlalu besar akan sulit di-*maintain*.
- **Rekomendasi:** 
  - Buat folder `src/services` atau `src/api` untuk sentralisasi *fetch* Supabase.
  - Pecah file halaman yang lebih dari 10KB menjadi beberapa sub-komponen di dalam `src/components/admin/...`.
  - Bersihkan duplikasi struktur di `pages/dashboard/finance` dan `pages/dashboard/bills`.

## 4. UI/UX Audit
- **Masalah:** Ada beberapa tabel data yang tidak dibungkus dengan *wrapper responsive* (terdeteksi dari observasi umum Tailwind), berpotensi rusak (terpotong) pada layar *mobile*.
- **Dampak:** Pengalaman penghuni yang mayoritas menggunakan HP akan terganggu saat melihat tabel iuran.
- **Rekomendasi:** Pastikan semua tabel dibungkus dengan `<div className="overflow-x-auto">`. Secara keseluruhan, implementasi warna dan tipografi sudah sejalan dengan `DESIGN.md` dan menggunakan CSS variables dengan baik.

## 5. Role & Navigation Audit
- **Masalah [CRITICAL]:** Terdapat inkonsistensi penamaan Role antara Frontend dan Database!
  - Di Frontend (`App.tsx` & `useAuth.ts`): `super admin`, `admin`, `user`.
  - Di Database (`initial_schema.sql`): `admin`, `bendahara`, `koordinator`, `penghuni`.
- **Dampak:** Jika *backend* dihubungkan sekarang, sistem *Role-Based Access Control* (RBAC) akan langsung rusak total karena tidak ada kecocokan data *role*.
- **Rekomendasi:** Samakan enum Role. Sangat disarankan mengikuti schema DB: `super_admin`, `admin`, `penghuni` (atau sesuaikan dengan kebutuhan pasti, namun pastikan Frontend dan DB menggunakan string yang persis sama).

## 6. Redundant Pages / Missing Pages

| Page/Menu | Status | Reason | Recommended Action |
|---|---|---|---|
| `pages/dashboard/finance/BillsPayments.tsx` (15KB) vs `pages/dashboard/bills/BillsPayments.tsx` (5KB) | **Merge/Remove** | Ada dua file dengan nama sama yang mengurus fitur mirip (satu versi admin, satu versi penghuni, atau duplikat). | Hapus file di folder `bills` jika memang `finance` adalah *source of truth* untuk bendahara, dan gunakan nama berbeda untuk versi penghuni. |
| `pages/dashboard/finance/BillingDashboard.tsx` vs `pages/dashboard/finance/FinanceDashboard.tsx` | **Merge** | Fungsi *dashboard billing* biasanya adalah bagian dari *finance dashboard*. | Jadikan *Billing* sebagai salah satu tab atau *widget* di dalam *FinanceDashboard*. |

## 7. Security Audit

| Finding | Severity | Risk | Recommended Fix |
|---|---|---|---|
| **Mock Authentication** (`localStorage`) | **Critical** | Siapa saja bisa mengedit `localStorage` (mengubah role menjadi `super admin`) dan membobol halaman admin. | Segera instal `@supabase/supabase-js`, implementasikan autentikasi Supabase nyata, dan hapus logic *mock* di `useAuth.ts`. |
| **Tidak Ada Verifikasi Token** | **Critical** | `ProtectedRoute` hanya mengecek state lokal, bukan token sesi yang valid di server. | Gunakan sesi dari Supabase Auth untuk memvalidasi akses *route*. |
| **RLS Tidak Ditegakkan** | **High** | Karena belum terhubung ke DB, proteksi akses data bergantung pada UI, bukan pada database. | Aktifkan RLS dan hubungkan *client* dengan `auth.uid()` di Supabase. |

## 8. Database & Supabase Audit
- **Masalah Schema:** Skema di `initial_schema.sql` sudah sangat baik, namun memiliki beberapa kekurangan:
  1. Tidak ada *trigger* PostgreSQL untuk otomatis membuat baris di `users_profile` ketika ada *user* baru mendaftar di `auth.users` Supabase.
  2. Kebijakan *Row Level Security* (RLS) baru dibuat untuk tabel `users_profile` dan `rooms`. Tabel krusial seperti `contributions`, `bills`, `expenses`, dan `payments` belum memiliki *policy* RLS sama sekali.
- **Rekomendasi:**
  - Tambahkan fungsi dan trigger `on_auth_user_created`.
  - Tulis RLS untuk semua tabel operasional, pastikan `penghuni` hanya bisa melihat tagihannya sendiri.

## 9. Functionality Audit
- **Fitur yang sudah ada (UI level):** Dashboard (dengan view 3 role), manajemen tagihan, tracker galon, jadwal piket, manajemen profil.
- **Kekurangan:** Semua fungsi (termasuk penyimpanan data, kalkulasi, dll) saat ini berjalan menggunakan data *dummy* statis atau *store* Zustand statis. Tidak ada yang benar-benar disimpan secara persisten di *backend*.

## 10. Code Quality Audit
- **Masalah:** Ditemukan 11 file yang masih menggunakan tipe `any` (contoh di `ManajemenWarga.tsx`, `MasterData.tsx`, `FinancialChart.tsx`, dsb).
- **Rekomendasi Refactor:** Ganti penggunaan `any` dengan *interface* Typescript yang merepresentasikan data Supabase (bisa di-*generate* menggunakan Supabase CLI `supabase gen types typescript`). Pecah komponen yang melebihi 300 baris.

## 11. Responsive & Accessibility Audit
- **Masalah:** Form dan tombol sudah menggunakan ukuran yang *mobile-friendly*, tetapi untuk layar sempit, navigasi *sidebar* mungkin memakan terlalu banyak ruang.
- **Rekomendasi:** Pastikan *sidebar* bisa menjadi mode *drawer* (collapsible) di perangkat *mobile*.

## 12. Performance Audit
- **Masalah:** Saat ini aplikasi sangat cepat karena data bersifat *mock*.
- **Rekomendasi:** Persiapkan *skeleton loading* (yang sudah ada desainnya di `DESIGN.md`) untuk masa transisi ketika pemanggilan API memakan waktu (*network latency*).

## 13. Documentation Audit
- Dokumentasi `DESIGN.md` dan `ROLE_STRUCTURE_SOEMATRA_KOST.md` sangat komprehensif.
- Namun, **implementasi melenceng dari dokumentasi** (terutama penamaan *Role*). Dokumentasi tidak *outdated*, melainkan implementasi kode yang perlu diselaraskan dengan dokumen.

## 14. Prioritized Fixing Roadmap

- **Phase 1: Security & Backend Integration (Critical)**
  - Instal Supabase JS.
  - Perbaiki `useAuth.ts` untuk menggunakan sesi asli Supabase.
  - Selaraskan string *Role* antara kode Frontend dan Database Migration.
- **Phase 2: Database Standardization**
  - Tambahkan *trigger* otomatis untuk tabel profil.
  - Lengkapi RLS untuk semua tabel transaksi (Tagihan, Pembayaran, Pengeluaran).
- **Phase 3: Component Cleanup & Refactor**
  - Hapus atau gabungkan file duplikat (terutama di folder `finance` dan `bills`).
  - Ganti semua tipe `any` dengan *type* statis dari skema DB.
  - Pecah komponen raksasa.
- **Phase 4: Real Data Fetching**
  - Ganti *dummy data* Zustand dengan pemanggilan API (menggunakan SWR atau React Query).
- **Phase 5: Polish & Production Readiness**
  - Finalisasi *loading states*, optimasi UI *mobile* tabel, dan testing.

## 15. Final Recommendation
Sistem ini **LAYAK DILANJUTKAN DENGAN REFACTOR RINGAN (Fokus pada Integrasi)**. 
Tidak perlu menulis ulang dari awal, karena struktur UI dan komponennya sudah dibangun dengan sangat baik. Masalah terbesar hanyalah fakta bahwa sistem ini belum "dihidupkan" ke *backend*. Prioritas mutlak adalah membuang *mock authentication* dan menyelaraskan definisi role sebelum membuat fitur baru.
