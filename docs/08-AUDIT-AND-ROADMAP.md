# Audit and Roadmap Guide

Dokumen ini menggabungkan seluruh sejarah temuan audit, status perbaikan bug, penyeimbangan data finansial akuntansi, serta peta jalan (roadmap) pengembangan jangka panjang sistem Soematra Kost.

---

## 1. Ringkasan Eksekutif Audit Sistem

Sistem Soematra Kost telah melalui beberapa fase audit intensif untuk bertransformasi dari aplikasi prototipe berbasis data dummy lokal menjadi aplikasi manajemen kos berbasis cloud terpercaya.

### Masalah Utama Sebelum Audit:
1. **Mock Authentication:** Autentikasi didasarkan pada manipulasi `localStorage` yang rawan diretas.
2. **Inkonsistensi Role:** Nama peran berbeda antara frontend (`super admin`, `admin`, `user`) dan database (`admin`, `bendahara`, `penghuni`).
3. **Ketiadaan Backend Aktual:** Tidak adanya penyimpanan cloud persisten.
4. **Pencampuran Logic Keuangan:** Kode perhitungan saldo IFRS bercampur langsung dalam file visual view dashboard bendahara.

---

## 2. Peta Jalan Perbaikan yang Telah Diselesaikan (Solved Roadmap)

Sistem telah menyelesaikan 7 fase perbaikan besar untuk mencapai kesiapan produksi (*Production Ready*):

* **Fase 1: Keamanan & Autentikasi**
  - Mengganti mock auth dengan integrasi Apps Script Web App Token.
  - Penyelarasan role sistem di frontend & database.
* **Fase 2: Standarisasi Basis Data**
  - Pembuatan skema tabel Spreadsheet lengkap (Users, Bills, Payments, Expenses, dll).
  - Penegakan Row-Level Security (RLS) di Apps Script server-side untuk membatasi akses data user.
* **Fase 3: Pemisahan Data & Integrasi UI**
  - Sentralisasi koneksi spreadsheet di `src/lib/spreadsheet.ts`.
  - Penghapusan data dummy dan penggantian dengan state dinamis dari server.
* **Fase 4: Sistem Kunci Periode & Saga Transaksi**
  - Implementasi period lock bulanan pasca tutup buku.
  - Pola transaksional Saga untuk memastikan penghapusan data dan jurnal akuntansi sinkron.
* **Fase 5: Optimalisasi Penggunaan Air Galon**
  - Penambahan form transaksi penggunaan, pengisian, dan manajemen wadah botol warga.
* **Fase 6: Siklus Akuntansi IFRS Lengkap**
  - Implementasi agregator Neraca Saldo, Laba Rugi, Perubahan Ekuitas, Neraca Klasifikasi, dan Jurnal Penutup otomatis.
* **Fase 7: Pengujian Otomatis & Dokumentasi Produksi**
  - Pembuatan unit test komprehensif (`Vitest`) untuk data normalizer dan mesin jurnal akuntansi.
  - Penyusunan dokumentasi sistem lengkap di direktori `docs/`.

---

## 3. Hasil Pengujian Mutakhir (Vitest Suite)

Berdasarkan eksekusi pengujian vitest, sistem memiliki 29 unit test yang lolos 100% pada area krusial berikut:
* **`DoubleEntryEngine`:** Memastikan debit/kredit seimbang, pembentukan buku besar tepat, dan penolakan transaksi tidak seimbang.
* **`optimizedCycle`:** Validasi jurnal umum, penyesuaian sewa kamar diterima dimuka (*unearned revenue*), penyusutan aset tetap (*depreciation*), serta hasil neraca saldo yang seimbang.
* **`spreadsheet` (Data Normalizer):** Validasi sanitasi tipe data mentah yang ditarik dari Google Sheets agar aman diproses oleh aplikasi React.

---

## 4. Peta Jalan Pengembangan Berikutnya (Next Development Roadmap)

Untuk pengembangan lanjutan, sistem Soematra Kost diproyeksikan untuk menambahkan fitur:
1. **Integrasi Gerbang Pembayaran (Payment Gateway):** Otomatisasi deteksi transfer pembayaran iuran warga kos menggunakan layanan seperti Midtrans atau Xendit, menghilangkan verifikasi manual oleh bendahara.
2. **Auto-recognition Gambar Bukti Bayar:** OCR terintegrasi untuk mendeteksi nominal pada kuitansi bukti transfer warga saat unggah pembayaran.
3. **WhatsApp/Email Notifications Client:** Pengiriman tagihan bulanan kos secara otomatis langsung ke kontak WhatsApp pribadi penghuni pada tanggal jatuh tempo.
