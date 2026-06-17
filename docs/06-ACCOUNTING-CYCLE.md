# Accounting Cycle Guide (IFRS Double Entry System)

Dokumen ini menjelaskan kebijakan dan implementasi siklus akuntansi ganda (Double Entry Bookkeeping) berbasis IFRS pada sistem Soematra Kost, mencakup Chart of Accounts (COA), pemetaan jurnal transaksi otomatis, jurnal penyesuaian (adjustments), penyusunan buku besar & neraca saldo, pelaporan keuangan, dan proses penutupan periode (Closing).

---

## 1. Bagan Akun (Chart of Accounts - COA)

Sistem menggunakan Chart of Accounts standar untuk melacak aset, kewajiban, ekuitas, pendapatan, dan beban sebagai berikut:

| Nomor Akun | Nama Akun | Tipe Akun | Saldo Normal | Deskripsi |
| :--- | :--- | :--- | :---: | :--- |
| **1102** | Kas di Bank | Aset Lancar | Debit | Rekening bank utama kos untuk transaksi penerimaan dan pengeluaran kas. |
| **1104** | Piutang Iuran | Aset Lancar | Debit | Hak tagihan iuran sewa/galon yang belum dilunasi warga. |
| **1501** | Peralatan Kos | Aset Tetap | Debit | Nilai perolehan peralatan kos (misal: AC, kulkas, pompa). |
| **1502** | Akumulasi Penyusutan | Kontra Aset | Kredit | Akumulasi nilai penyusutan peralatan kos berjalan. |
| **2102** | Uang Muka Sewa | Kewajiban | Kredit | Pendapatan sewa diterima dimuka (*unearned revenue*). |
| **3101** | Modal Pemilik | Ekuitas | Kredit | Setoran modal awal dari pemilik kos. |
| **3201** | Laba Ditahan | Ekuitas | Kredit | Akumulasi laba bersih dari periode-periode akuntansi sebelumnya. |
| **3500** | Ikhtisar Laba Rugi | Ekuitas Temp | Kredit | Akun sementara penampung nominal pendapatan & beban saat tutup buku. |
| **4101** | Pendapatan Sewa Kamar| Pendapatan | Kredit | Penerimaan iuran utama sewa kamar dari warga kos. |
| **5101** | Beban Listrik & Air | Beban | Debit | Pengeluaran tagihan PLN & PDAM kos. |
| **5102** | Beban Kebersihan | Beban | Debit | Biaya operasional kebersihan dan keamanan kos. |
| **5103** | Beban Perawatan | Beban | Debit | Biaya renovasi/pemeliharaan fasilitas gedung kos. |
| **5106** | Beban Air & Galon | Beban | Debit | Biaya pengisian galon air minum kos. |
| **5107** | Beban Penyusutan | Beban | Debit | Alokasi beban penyusutan aset tetap bulanan. |

---

## 2. Pemetaan Jurnal Otomatis (Journal Mappings)

Sistem secara otomatis memposting ayat jurnal ke sheet `JournalEntries` pada kejadian-kejadian transaksi berikut:

### 2.1 Pembuatan Invoice Tagihan Baru (Billing Invoice)
Saat bendahara mempublikasikan invoice tagihan kepada penghuni kos:
* **ID Jurnal:** `BIL-{tagihan_id}`
* **Jurnal:**
  * **Debit (Dr) 1104** (Piutang Iuran) — Sebesar nominal tagihan.
  * **Kredit (Cr) 4101** (Pendapatan Sewa Kamar) — Sebesar nominal tagihan.

### 2.2 Verifikasi Pembayaran Sukses (Payment Verified)
Saat bukti pembayaran dari warga disetujui (diverifikasi) oleh bendahara:
* **ID Jurnal:** `JE-{UUID}`
* **Jurnal:**
  * **Debit (Dr) 1102** (Kas di Bank BCA) — Sebesar nominal bayar.
  * **Kredit (Cr) 1104** (Piutang Iuran) — Sebesar nominal bayar.

### 2.3 Pencatatan Beban Pengeluaran (Expense Recorded)
Saat pengeluaran operasional dicatat oleh bendahara (sumber kas kos):
* **ID Jurnal:** `JE-{UUID}`
* **Jurnal:**
  * **Debit (Dr) 5xxx** (Beban Terkait, misal: `5106` untuk Galon, `5101` untuk Listrik).
  * **Kredit (Cr) 1102** (Kas di Bank BCA) — Sebesar nominal beban.

---

## 3. Jurnal Penyesuaian (Adjusting Entries)

Penyesuaian dijalankan pada akhir bulan untuk menerapkan prinsip akrual akuntansi:

### 3.1 Pendapatan Sewa Diterima Dimuka (Unearned Revenue)
* Jika warga melakukan pembayaran massal (misal: bayar sewa 3 bulan sekaligus), nominal bulan depan dicatat sebagai **Kewajiban Uang Muka Sewa (2102)**.
* Pada akhir tiap bulan berikutnya, bagian sewa bulan tersebut diakui (*earned*) dengan menjurnal:
  * **Debit (Dr) 2102** (Uang Muka Sewa)
  * **Kredit (Cr) 4101** (Pendapatan Sewa Kamar)

### 3.2 Penyusutan Aset Tetap (Depreciation)
* Aset tetap didepresiasi setiap akhir periode dengan metode garis lurus:
  * **Debit (Dr) 5107** (Beban Penyusutan)
  * **Kredit (Cr) 1502** (Akumulasi Penyusutan)

---

## 4. Agregasi Buku Besar & Neraca Saldo (Trial Balance)

### 4.1 Aturan Saldo Normal
* **Aset & Beban:** `Total Debit - Total Kredit`
* **Kewajiban, Ekuitas, & Pendapatan:** `Total Kredit - Total Debit`

### 4.2 Neraca Saldo Disesuaikan (Adjusted Trial Balance)
* Berisi daftar seluruh akun beserta saldonya setelah memposting entri penyesuaian. Nilai total saldo Debit **harus sama secara mutlak** dengan total saldo Kredit.

---

## 5. Laporan Keuangan (Financial Statements)

Sistem secara dinamis menyusun laporan keuangan berikut dari Neraca Saldo Disesuaikan:

1. **Laporan Laba Rugi (Income Statement):**
   * Menyajikan total Pendapatan dikurangi total Beban untuk menghasilkan **Laba Bersih** (*Net Income*).
2. **Laporan Perubahan Laba Ditahan (Retained Earnings Statement):**
   * `Laba Ditahan Awal + Laba Bersih - Prive/Dividen = Laba Ditahan Akhir`.
3. **Laporan Posisi Keuangan (Balance Sheet):**
   * Mengelompokkan akun ke dalam: Aset Lancar, Aset Tetap, Kewajiban Jangka Pendek, Kewajiban Jangka Panjang, dan Ekuitas.
   * Wajib memenuhi persamaan dasar akuntansi: `Aset = Kewajiban + Ekuitas`.

---

## 6. Proses Tutup Buku (Closing the Books)

Pada akhir periode akuntansi tahunan, seluruh saldo akun nominal (Pendapatan & Beban) ditutup dengan memindahkannya ke akun **Ikhtisar Laba Rugi (3500)** lalu dialokasikan ke **Laba Ditahan (3201)**:

1. **Menutup Akun Pendapatan:**
   * Debit `Pendapatan`, Kredit `Ikhtisar Laba Rugi`.
2. **Menutup Akun Beban:**
   * Debit `Ikhtisar Laba Rugi`, Kredit seluruh akun `Beban`.
3. **Menutup Ikhtisar Laba Rugi:**
   * Selisih (Laba Bersih) didebit dari `Ikhtisar Laba Rugi` dan dikredit ke `Laba Ditahan`.
4. **Neraca Saldo Setelah Penutupan (Post-Closing Trial Balance):**
   * Seluruh Pendapatan dan Beban kembali bernilai **nol**, menyisakan saldo kas, piutang, aset tetap, kewajiban, dan laba ditahan untuk dipindahkan ke periode berikutnya.

---

## 7. Kebijakan Kunci Periode & Saga Rollback

### 7.1 Kunci Periode (Period Lock)
* Bulan yang telah melalui proses Tutup Buku ditandai dengan adanya jurnal penutup ber-ID `CL-REV` atau `CL-EXP`.
* Jika mendeteksi status terkunci, antarmuka frontend akan mengunci form input agar tidak terjadi penulisan transaksi baru ke bulan historis tersebut.

### 7.2 Saga Rollback Pattern
* Operasi hapus/tambah data yang melibatkan dua tabel berbeda (misal: sheet `Bills` dan sheet `JournalEntries`) dieksekusi secara transaksional bertahap. Jika langkah kedua gagal, blok `catch` akan membatalkan perubahan langkah pertama (*rollback*) untuk menjamin konsistensi data finansial.
