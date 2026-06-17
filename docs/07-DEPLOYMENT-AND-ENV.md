# Deployment and Environment Setup Guide

Dokumen ini menjelaskan langkah-langkah instalasi, konfigurasi token keamanan, dan publikasi sistem Soematra Kost ke lingkungan produksi, baik pada sisi backend (Google Apps Script) maupun frontend (React-Vite).

---

## 1. Persiapan Google Spreadsheet (Database)

1. Buat Google Spreadsheet baru di akun Google Drive Anda.
2. Buat tab/sheet baru dengan nama-nama berikut secara presisi (bersifat **case-sensitive**):
   * `Users`
   * `Bills`
   * `Payments`
   * `Expenses`
   * `JournalEntries`
   * `MasterData`
   * `Gallons`
   * `GallonContainers`
   * `Settings`
   * `AuditLogs`
3. Buka tab `MasterData` dan masukkan baris bagan akun akuntansi bawaan (COA) minimal sebagai berikut:
   * **account_number** `1102`, **account_name** `Kas di Bank`, **account_type** `Harta`, **status** `Aktif`
   * **account_number** `1104`, **account_name** `Piutang Iuran`, **account_type** `Harta`, **status** `Aktif`
   * **account_number** `3101`, **account_name** `Modal Pemilik`, **account_type** `Modal`, **status** `Aktif`
   * **account_number** `3201`, **account_name** `Laba Ditahan`, **account_type** `Modal`, **status** `Aktif`
   * **account_number** `3500`, **account_name** `Ikhtisar Laba Rugi`, **account_type** `Modal`, **status** `Aktif`
   * **account_number** `4101`, **account_name** `Pendapatan Sewa Kamar`, **account_type** `Pendapatan`, **status** `Aktif`
   * **account_number** `5101`, **account_name** `Beban Listrik`, **account_type** `Beban`, **status** `Aktif`
   * **account_number** `5106`, **account_name** `Beban Air & Galon`, **account_type** `Beban`, **status** `Aktif`

---

## 2. Penerapan Backend Google Apps Script (API Server)

1. Pada Google Spreadsheet yang telah Anda buat, klik menu **Ekstensi (Extensions)** > **Apps Script**.
2. Hapus seluruh kode kosong bawaan pada editor, kemudian tempelkan kode Apps Script dari berkas `scripts/google-apps-script/soematra-sheets-api.gs`.
3. Tentukan token keamanan Anda pada baris konstanta `const API_TOKEN = "GANTI_DENGAN_TOKEN_RAHASIA_ANDA"`. Masukkan sandi alfanumerik yang kuat. Kunci token ini wajib dicocokkan pada file `.env` di frontend nanti.
4. Klik ikon **Simpan (Save)**.
5. Jalankan deployment baru:
   * Klik **Terapkan (Deploy)** di bagian kanan atas > **Penerapan Baru (New Deployment)**.
   * Pilih jenis penerapan: **Aplikasi Web (Web App)** (klik ikon gear jika menu ini tidak muncul).
   * Konfigurasikan opsi berikut:
     * **Jalankan sebagai (Execute as):** `Saya (email-anda@gmail.com)` (wajib email pemilik agar script memiliki otorisasi menulis data ke Spreadsheet Anda).
     * **Siapa yang memiliki akses (Who has access):** `Siapa saja (Anyone)` (keamanan API tetap diverifikasi melalui otentikasi token).
   * Klik **Terapkan (Deploy)**.
   * Lakukan otorisasi akses Google jika diminta, klik *Advanced* > *Go to Soematra Kost (unsafe)*, lalu pilih *Allow*.
6. Salin **URL Web App (Web App URL)** yang ditampilkan (contoh: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 3. Konfigurasi Environment Frontend

1. Pada direktori root proyek React frontend, buat file `.env.local` atau ubah berkas `.env` yang ada.
2. Tambahkan variabel berikut:
   ```env
   # Web App URL yang didapatkan dari Apps Script tadi
   VITE_SPREADSHEET_API_URL=https://script.google.com/macros/s/AKfycb..._AKHIR_URL_DEPLOY_ANDA/exec

   # Token API rahasia yang sama persis dengan yang diatur di Apps Script
   VITE_SOEMATRA_API_TOKEN=sandi_rahasia_token_anda_tadi
   ```

---

## 4. Build dan Deployment Frontend

### 4.1 Build Produksi Lokal
1. Pastikan Node.js (v20+) telah terpasang di komputer Anda.
2. Jalankan instalasi dependensi proyek:
   ```bash
   npm install
   ```
3. Lakukan proses kompilasi bundel produksi:
   ```bash
   npm run build
   ```
4. Seluruh aset produksi yang telah dikompresi dan dioptimalkan akan tersimpan di dalam direktori `/dist`.

### 4.2 Hosting Aset Statis
Direktori `/dist` dapat dideploy ke berbagai platform hosting statis seperti Vercel, Netlify, atau GitHub Pages:
* **Vercel / Netlify:**
  * Hubungkan repositori GitHub Anda.
  * Atur parameter Build Command: `npm run build`, dan Output Directory: `dist`.
  * Masukkan Environment Variables `VITE_SPREADSHEET_API_URL` dan `VITE_SOEMATRA_API_TOKEN` pada menu pengaturan dashboard mereka.
* **SPA Fallback Redirect (Penting):**
  * Karena aplikasi menggunakan client-side routing React Router, pastikan web server Anda mengembalikan `index.html` jika user mengakses URL langsung. Pada Vercel, hal ini ditangani otomatis. Pada Apache, sertakan berkas `.htaccess` dengan aturan mod_rewrite yang merujuk seluruh request ke `index.html`.
