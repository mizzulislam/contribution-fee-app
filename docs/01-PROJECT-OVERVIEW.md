# Project Overview (Soematra Kost)

## 1. Latar Belakang

Aplikasi **Soematra Kost** dirancang untuk memecahkan tantangan pengelolaan operasional, keuangan, dan tata tertib pada rumah kos bersama. Sering kali, pencatatan iuran kos bulanan, beban listrik/air, pembelian galon bersama, dan giliran piket harian dikerjakan secara manual di atas kertas atau grup chat WhatsApp. Hal ini memicu ketidakakuratan saldo, keterlambatan penagihan, kurangnya transparansi arus kas bersama, serta perselisihan antarpenghuni akibat pembagian tugas piket yang tidak merata.

Dengan Soematra Kost, seluruh aktivitas tersebut disentralisasi ke dalam sistem informasi berbasis web yang terintegrasi dengan Google Spreadsheet sebagai basis data cloud yang gratis dan mudah dikelola oleh pengurus kos.

---

## 2. Fitur Utama Sistem

Sistem ini memiliki 4 pilar fungsionalitas utama:

1. **Manajemen Tagihan & Pembayaran (Billing & Payments):**
   * Pembuatan tagihan bulanan (massal atau personal).
   * Portal warga untuk melihat rincian kewajiban bayar dan mengunggah gambar bukti transfer.
   * Panel verifikasi transaksi bagi Bendahara kos untuk menyetujui atau menolak bukti bayar.
2. **Siklus Akuntansi Ganda IFRS (Double Entry Accounting):**
   * Jurnal otomatis yang terintegrasi langsung dengan aktivitas penagihan, penerimaan kas, dan pencatatan biaya operasional.
   * Penghasil laporan keuangan dinamis (Laporan Laba Rugi, Perubahan Ekuitas, Neraca) yang transparan dan akurat.
   * Mekanisme Tutup Buku akhir periode untuk mengunci transaksi historis.
3. **Tracker Galon Air Kos (Gallon Tracker):**
   * Pelacakan konsumsi galon harian warga berdasarkan kapasitas tumbler.
   * Pencatatan stok galon berjalan dan riwayat transaksi pengisian ulang.
4. **Jadwal Piket Warga Kos (Duty Schedules):**
   * Sistem rotasi jadwal piket kebersihan/galon kos antar warga secara otomatis.
   * Portal konfirmasi penyelesaian tugas piket pribadi.

---

## 3. Target Pengguna (Target Audience)
* **Pemilik Kos (Super Admin):** Pengawas sistem utama yang memantau profitabilitas kos, mengatur hak akses staf, mendaftarkan penghuni baru, dan menjaga kelangsungan sistem database.
* **Bendahara Kos (Admin):** Pengelola harian kos yang menerbitkan tagihan, melakukan pembayaran biaya, memantau piket, dan menyajikan laporan keuangan berkala.
* **Warga Kos (Penghuni):** Penghuni aktif kos yang memantau kewajiban bayar pribadi, melapor bukti bayar, memantau air minum, dan menjalankan piket bersama.
