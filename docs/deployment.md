# Panduan Deployment & Penerapan Produksi

Dokumen ini menjelaskan petunjuk instalasi dan penyiapan sistem (backend Google Apps Script dan frontend React-Vite) untuk dipublikasikan ke lingkungan produksi.

---

## 1. Persiapan Google Spreadsheet (Database)

1. Buat Google Spreadsheet baru di Google Drive Anda.
2. Buat lembar kerja (tab) baru dengan penamaan yang **sensitif terhadap huruf besar/kecil (case-sensitive)** sebagai berikut:
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
3. Pada tab `MasterData`, buat baris bagan akun awal (COA) minimal sebagai berikut:
   * **account_number** `1102`, **account_name** `Kas di Bank`, **account_type** `Aset`
   * **account_number** `1104`, **account_name** `Piutang Iuran`, **account_type** `Aset`
   * **account_number** `3101`, **account_name** `Modal Pemilik`, **account_type** `Ekuitas`
   * **account_number** `3201`, **account_name** `Laba Ditahan`, **account_type** `Ekuitas`
   * **account_number** `3500`, **account_name** `Ikhtisar Laba Rugi`, **account_type** `Ekuitas`
   * **account_number** `4101`, **account_name** `Pendapatan Sewa Kamar`, **account_type** `Pendapatan`
   * **account_number** `5101`, **account_name** `Beban Listrik`, **account_type** `Beban`
   * **account_number** `5106`, **account_name** `Beban Air & Galon`, **account_type** `Beban`

---

## 2. Pemasangan Backend Google Apps Script

1. Di dalam Google Spreadsheet Anda, buka menu **Ekstensi** > **Apps Script**.
2. Hapus semua kode default di editor, lalu salin seluruh isi berkas [google-apps-script.js](file:///d:/Soematra%20Kost/google-apps-script.js) dari repository ini.
3. Konfigurasi **Token Rahasia API**:
   * Temukan konstanta `const API_TOKEN = "ganti_dengan_token_rahasia_anda_disini"` di bagian atas kode.
   * Ganti nilai string tersebut dengan kunci acak yang aman (misalnya: string alfanumerik panjang). Kunci ini nanti harus dicocokkan pada variabel lingkungan frontend.
4. Simpan proyek dengan menekan ikon Disket (Save).
5. Lakukan Deployment sebagai Web App:
   * Klik tombol **Terapkan (Deploy)** di pojok kanan atas > **Penerapan Baru (New Deployment)**.
   * Pilih jenis penerapan: **Aplikasi Web (Web App)** (klik ikon roda gigi jika jenis ini belum muncul).
   * Masukkan keterangan (misal: `Soematra Kost Prod v1`).
   * Konfigurasi hak eksekusi:
     * **Jalankan sebagai (Execute as):** `Saya (email-anda@gmail.com)` (wajib email pemilik spreadsheet agar script memiliki izin menulis ke drive).
     * **Siapa yang memiliki akses (Who has access):** `Siapa saja (Anyone)` (GAS akan menyaring keamanan secara mandiri via API Token dan RLS).
   * Klik **Terapkan (Deploy)**.
   * Jika muncul jendela "Otorisasi Akses", klik **Berikan Izin (Authorize Access)**, pilih akun Google Anda, klik *Advanced* > *Go to Soematra Kost (unsafe)*, lalu klik **Allow**.
6. Salin **URL Aplikasi Web (Web App URL)** yang dihasilkan (contoh: `https://script.google.com/macros/s/AKfycb.../exec`).

---

## 3. Konfigurasi Lingkungan Frontend (.env)

1. Di root direktori proyek React (frontend), buat berkas `.env.local` atau perbarui berkas `.env` yang sudah ada.
2. Tambahkan variabel lingkungan berikut:
   ```env
   # URL hasil deploy Google Apps Script Web App
   VITE_SPREADSHEET_API_URL=https://script.google.com/macros/s/AKfycb..._JADI_URL_APPS_SCRIPT_ANDA/exec

   # Token API rahasia yang sama dengan konstanta API_TOKEN di Apps Script
   VITE_SOEMATRA_API_TOKEN=token_rahasia_anda_yang_tadi_diinput_di_apps_script
   ```

---

## 4. Build & Deployment Frontend

### 4.1 Build Produksi Lokal
1. Pastikan Node.js (v20+) sudah terinstal di komputer.
2. Jalankan perintah instalasi dependency:
   ```bash
   npm install
   ```
3. Lakukan build paket produksi:
   ```bash
   npm run build
   ```
4. Output kompilasi berupa HTML, CSS, dan JS yang optimal akan dihasilkan di folder `/dist`.

### 4.2 Hosting Aset Statis (Frontend)
Folder `/dist` dapat diunggah ke platform hosting statis gratis dengan setup yang sangat mudah:

* **Vercel / Netlify:**
  1. Hubungkan repository GitHub Anda ke akun Vercel/Netlify.
  2. Pilih framework preset: `Vite` atau `Other`.
  3. Konfigurasi Build Command: `npm run build`, Output Directory: `dist`.
  4. Tambahkan Environment Variables `VITE_SPREADSHEET_API_URL` dan `VITE_SOEMATRA_API_TOKEN` pada dashboard settings mereka.
  5. Klik Deploy.
* **GitHub Pages / Shared Hosting / cPanel:**
  * Cukup unggah seluruh isi folder `/dist` ke direktori root web server Anda (`public_html` atau sejenisnya).
  * Pastikan konfigurasi fallback routing diatur (seperti berkas `.htaccess` untuk Apache atau konfigurasi redirect Single Page Application pada server Nginx).
