# Soematra Kost

Aplikasi manajemen operasional dan keuangan kos/iuran warga berbasis React, Vite, TypeScript, Tailwind CSS, dan Google Sheets melalui Google Apps Script Web App.

---

## 🚀 Quick Start (Menjalankan Lokal)

1. **Instal Dependensi:**
   ```bash
   npm install
   ```
2. **Jalankan Mode Pengembangan:**
   ```bash
   npm run dev
   ```
3. **Build Bundel Produksi:**
   ```bash
   npm run build
   ```

---

## ⚙️ Variabel Lingkungan (.env.local)

Buat file `.env.local` di root proyek:
```env
VITE_SPREADSHEET_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
VITE_SOEMATRA_API_TOKEN=sandi-token-yang-sama-dengan-apps-script
VITE_SESSION_SIGNATURE_SECRET=string-random-untuk-signature-session-lokal
```

---

## 📖 Indeks Dokumentasi Proyek

Seluruh dokumentasi teknis dan panduan operasional sistem kos telah dikonsolidasikan ke dalam folder `docs/`:

* 📂 **[STRUCTURE_REFACTOR_PLAN.md](file:///d:/Soematra%20Kost/docs/STRUCTURE_REFACTOR_PLAN.md)** - Rencana penyusunan folder proyek.
* 📄 **[01-PROJECT-OVERVIEW.md](file:///d:/Soematra%20Kost/docs/01-PROJECT-OVERVIEW.md)** - Latar belakang kos dan fitur utama sistem.
* 📄 **[02-ARCHITECTURE.md](file:///d:/Soematra%20Kost/docs/02-ARCHITECTURE.md)** - Desain arsitektur React SPA, Zustand, dan aliran data.
* 📄 **[03-ROLES-AND-PERMISSIONS.md](file:///d:/Soematra%20Kost/docs/03-ROLES-AND-PERMISSIONS.md)** - Matriks otorisasi peran (RBAC) & keamanan server (RLS).
* 📄 **[04-UI-UX-GUIDELINES.md](file:///d:/Soematra%20Kost/docs/04-UI-UX-GUIDELINES.md)** - Palet warna, komponen, dan pedoman animasi sidebar.
* 📄 **[05-DATA-AND-INTEGRATION.md](file:///d:/Soematra%20Kost/docs/05-DATA-AND-INTEGRATION.md)** - Skema kolom Google Sheets dan format komunikasi API.
* 📄 **[06-ACCOUNTING-CYCLE.md](file:///d:/Soematra%20Kost/docs/06-ACCOUNTING-CYCLE.md)** - Kebijakan pencatatan akuntansi ganda IFRS, penyesuaian, dan tutup buku.
* 📄 **[07-DEPLOYMENT-AND-ENV.md](file:///d:/Soematra%20Kost/docs/07-DEPLOYMENT-AND-ENV.md)** - Panduan penerapan backend Apps Script & hosting frontend.
* 📄 **[08-AUDIT-AND-ROADMAP.md](file:///d:/Soematra%20Kost/docs/08-AUDIT-AND-ROADMAP.md)** - Riwayat laporan audit keuangan dan rencana pengembangan mendatang.

---

## 🔒 Catatan Keamanan

Sesi pengguna dienkripsi dengan signature lokal di sisi client untuk mencegah manipulasi peran secara kasual, namun penegakan keamanan aktual (Row-Level Security) tetap divalidasi di backend Google Apps Script sebelum data dituliskan ke Spreadsheet.
