# Dokumen Kebijakan & Pemetaan Siklus Akuntansi

Dokumen ini menjelaskan standar pencatatan akuntansi ganda (Double Entry), Bagan Akun (Chart of Accounts), pemetaan entri jurnal otomatis dari aktivitas operasional, penanganan transaksi gagal (Saga Rollback), dan kebijakan tutup buku periode.

---

## 1. Bagan Akun Akuntansi (Chart of Accounts - COA)

Sistem keuangan Soematra Kost menggunakan Chart of Accounts standar untuk melacak aset, kewajiban, ekuitas, pendapatan, dan beban sebagai berikut:

| Nomor Akun | Nama Akun | Tipe Akun | Saldo Normal | Deskripsi |
| :--- | :--- | :--- | :---: | :--- |
| **1102** | Kas di Bank | Aset Lancar | Debit | Rekening bank utama kos untuk menerima iuran dan membayar biaya. |
| **1104** | Piutang Iuran | Aset Lancar | Debit | Hak kos atas tagihan iuran sewa/galon yang belum dilunasi warga. |
| **3101** | Modal Pemilik | Ekuitas | Kredit | Setoran modal awal/tambahan dari pemilik kos. |
| **3201** | Laba Ditahan | Ekuitas | Kredit | Akumulasi laba bersih kos dari periode-periode sebelumnya. |
| **3500** | Ikhtisar Laba Rugi | Ekuitas (Temp) | Kredit | Akun sementara untuk menampung saldo nominal saat tutup buku. |
| **4101** | Pendapatan Sewa Kamar| Pendapatan | Kredit | Penerimaan iuran utama sewa kamar dari warga. |
| **5101** | Beban Listrik | Beban | Debit | Biaya tagihan PLN kos. |
| **5102** | Beban Kebersihan | Beban | Debit | Biaya iuran sampah atau peralatan kebersihan kos. |
| **5103** | Beban Perbaikan | Beban | Debit | Biaya renovasi, servis AC, pompa air, atau fasilitas kos rusak. |
| **5105** | Beban Lain-Lain | Beban | Debit | Pengeluaran kecil operasional yang tidak terklasifikasi. |
| **5106** | Beban Air & Galon | Beban | Debit | Biaya pengisian galon air minum kos dan pemeliharaan filter. |

---

## 2. Pemetaan Jurnal Transaksi Otomatis (Journal Mappings)

Sistem secara otomatis memposting ayat jurnal ke lembar kerja `JournalEntries` pada kejadian-kejadian operasional berikut:

### 2.1 Pembuatan Invoice Tagihan Baru (Billing Created)
Saat bendahara membuat invoice tagihan baru untuk warga (baik tunggal maupun massal), sistem mencatat timbulnya piutang warga dan pendapatan kos:
* **Nomor Jurnal:** `BIL-{tagihan_id}`
* **Jurnal:**
  * **Debit (Dr) 1104** (Piutang Iuran) — Sebesar nominal tagihan.
  * **Kredit (Cr) 4101** (Pendapatan Sewa Kamar) — Sebesar nominal tagihan.

### 2.2 Verifikasi Pembayaran Sukses (Payment Verified)
Saat warga mengunggah bukti bayar dan dikonfirmasi **"Disetujui"** oleh Bendahara, piutang warga dikredit (dihapus) dan kas bank didebit (bertambah):
* **Nomor Jurnal:** `JE-{UUID}`
* **Jurnal:**
  * **Debit (Dr) 1102** (Kas di Bank) — Sebesar nominal pembayaran.
  * **Kredit (Cr) 1104** (Piutang Iuran) — Sebesar nominal pembayaran.

### 2.3 Pencatatan Beban Pengeluaran (Expense Recorded)
Saat bendahara mencatat pengeluaran kas operasional kos pada form pengeluaran:
* **Nomor Jurnal:** `JE-{UUID}`
* **Jurnal:**
  * **Debit (Dr) 5xxx** (Akun Beban terkait Kategori, misal: `5101` untuk Listrik, `5106` untuk Galon).
  * **Kredit (Cr) 1102** (Kas di Bank) — Sebesar nominal pengeluaran.

---

## 3. Transaction Boundaries & Saga Rollback Pattern

Untuk menjaga agar data di lembar kerja operasional (`Bills`, `Payments`, `Expenses`) selalu sinkron 100% dengan lembar akuntansi (`JournalEntries`), sistem menerapkan pola **Saga Transactional Rollback** pada frontend:

1. **Urutan Operasi (Multi-step):** Setiap mutasi data sensitif diproses secara berurutan. Misalnya, hapus tagihan dilakukan terlebih dahulu pada sheet `Bills`, baru disusul penghapusan jurnal piutang pada sheet `JournalEntries`.
2. **Penanganan Kegagalan (Rollback):** Jika operasi langkah kedua gagal (contoh: gangguan internet saat menghapus jurnal), blok `catch` akan menangkap error tersebut dan secara otomatis mengirimkan request kompensasi untuk memulihkan data langkah pertama (misalnya membuat kembali tagihan yang sempat dihapus).
3. **Pemberitahuan User:** Transaksi dibatalkan secara utuh dan bendahara diinfokan melalui Alert dialog terintegrasi bahwa transaksi gagal secara aman tanpa merusak konsistensi data.

---

## 4. Kebijakan Kunci Periode (Period Lock Policy)

* **Tujuan Kunci:** Mencegah manipulasi data transaksi historis pasca pembuatan laporan keuangan bulanan.
* **Mekanisme Deteksi:** Fungsi `checkPeriodLock(dateStr)` secara otomatis memindai lembar `JournalEntries` pada bulan dan tahun yang bersangkutan dari tanggal input. Jika ditemukan jurnal penutup (dengan ID diawali `CL-REV` atau `CL-EXP`), maka periode tersebut dinyatakan **Terkunci (Locked)**.
* **Perilaku UI Guard:** Tombol tambah, edit, verifikasi, dan hapus pada form transaksi (`JournalEntryForm.tsx`, `Expenses.tsx`, `BillsPayments.tsx`, `Verification.tsx`) akan dinonaktifkan secara otomatis, mencegah penulisan data baru ke bulan yang sudah ditutup.

---

## 5. Proses Tutup Buku Akhir Periode (Closing the Books)

Bendahara/Super Admin dapat menjalankan proses "Tutup Buku" di menu Akuntansi yang mencakup:

1. **Jurnal Penutupan Pendapatan:**
   * **Debit (Dr) 4101** (Pendapatan Sewa Kamar) — Dinolkan.
   * **Kredit (Cr) 3500** (Ikhtisar Laba Rugi) — Menampung total pendapatan.
2. **Jurnal Penutupan Beban:**
   * **Debit (Dr) 3500** (Ikhtisar Laba Rugi) — Menampung total beban.
   * **Kredit (Cr) 5xxx** (Seluruh akun beban) — Dinolkan.
3. **Jurnal Laba Bersih ke Laba Ditahan:**
   * Menghitung selisih akun `3500`. Jika Laba:
     * **Debit (Dr) 3500** (Ikhtisar Laba Rugi) — Dinolkan.
     * **Kredit (Cr) 3201** (Laba Ditahan) — Bertambah.
4. **Hasil Neraca Saldo Setelah Penutupan:**
   * Seluruh akun nominal (Pendapatan & Beban) bernilai **nol**.
   * Hanya menyisakan akun Riil (Kas `1102`, Piutang `1104`, Modal `3101`, Laba Ditahan `3201`) pada Neraca untuk dipindahkan sebagai saldo awal periode berikutnya.
