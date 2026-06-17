# DESIGN.md — Soematra Kost

## 1. Tujuan Dokumen

Dokumen ini menjadi acuan desain visual dan pengalaman pengguna untuk pengembangan aplikasi **Soematra Kost**. Seluruh keputusan UI/UX, warna, tipografi, layout, komponen, dan pola interaksi dalam aplikasi harus mengikuti panduan ini agar sistem memiliki tampilan yang modern, konsisten, rapi, dan mudah digunakan.

Aplikasi Soematra Kost adalah sistem manajemen operasional kos yang mencakup pengelolaan iuran, pembayaran, pencatatan keuangan, dana talangan, tracker galon, prediksi kebutuhan galon, reminder pembayaran, dan jadwal piket pembelian galon.

---

## 2. Design Direction

### 2.1 Konsep Visual

Desain aplikasi menggunakan pendekatan **modern, clean, friendly, financial-dashboard oriented, dan mobile-first**. Tampilan harus terasa sederhana namun tetap profesional karena aplikasi mengelola data keuangan bersama.

Karakter desain yang diharapkan:

- Modern dan minimalis.
- Dominan warna hijau dengan kombinasi putih.
- Bersih, lapang, dan tidak terlalu padat.
- Mudah dibaca oleh pengguna non-teknis.
- Cocok untuk aplikasi manajemen kos dan keuangan sederhana.
- Memiliki nuansa transparan, tertib, dan terpercaya.
- Memiliki visual dashboard yang informatif tanpa terlihat rumit.

### 2.2 Design Keywords

- Clean
- Fresh
- Trustworthy
- Organized
- Transparent
- Friendly
- Practical
- Financial clarity
- Operational control

---

## 3. Color Palette

Warna utama aplikasi adalah **hijau** dengan dukungan warna putih dan netral. Hijau dipilih untuk menggambarkan keteraturan, stabilitas, transparansi, pertumbuhan saldo, dan rasa aman dalam pengelolaan keuangan bersama.

### 3.1 Primary Colors

| Token | Color Name | Hex | Usage |
|---|---|---:|---|
| `primary` | Emerald Green | `#10B981` | Tombol utama, highlight, active state, icon utama |
| `primary-dark` | Deep Emerald | `#047857` | Hover button, header accent, active navigation |
| `primary-light` | Soft Mint | `#D1FAE5` | Background badge, alert ringan, card highlight |
| `primary-soft` | Pale Green | `#ECFDF5` | Section background, empty state background |

### 3.2 Neutral Colors

| Token | Color Name | Hex | Usage |
|---|---|---:|---|
| `white` | Pure White | `#FFFFFF` | Background utama, card, modal |
| `background` | Off White | `#F9FAFB` | App background |
| `surface` | Soft Surface | `#F3F4F6` | Secondary background, table header |
| `border` | Light Border | `#E5E7EB` | Border card, input, divider |
| `text-primary` | Charcoal | `#111827` | Heading, teks utama |
| `text-secondary` | Slate Gray | `#4B5563` | Deskripsi, metadata |
| `text-muted` | Muted Gray | `#9CA3AF` | Placeholder, helper text |

### 3.3 Semantic Colors

| Token | Color Name | Hex | Usage |
|---|---|---:|---|
| `success` | Green Success | `#22C55E` | Pembayaran berhasil, status lunas |
| `warning` | Amber Warning | `#F59E0B` | Jatuh tempo dekat, galon hampir habis |
| `danger` | Red Danger | `#EF4444` | Pembayaran terlambat, error, saldo tidak cukup |
| `info` | Blue Info | `#3B82F6` | Informasi umum, update sistem |

### 3.4 Recommended Gradient

Gunakan gradient secara terbatas pada hero, top card, atau summary dashboard.

```css
background: linear-gradient(135deg, #10B981 0%, #047857 100%);
```

Alternatif soft gradient:

```css
background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%);
```

---

## 4. Typography

### 4.1 Font Family

Gunakan font sans-serif modern yang mudah dibaca.

Rekomendasi utama:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Alternatif:

- Inter
- Plus Jakarta Sans
- Geist Sans
- DM Sans

### 4.2 Type Scale

| Element | Size | Weight | Usage |
|---|---:|---:|---|
| Display | 32–40px | 700 | Landing page title / dashboard greeting |
| H1 | 28–32px | 700 | Page title |
| H2 | 22–24px | 600–700 | Section title |
| H3 | 18–20px | 600 | Card title |
| Body | 14–16px | 400–500 | Main content |
| Small | 12–13px | 400–500 | Metadata, helper text |
| Label | 13–14px | 500–600 | Form label |

### 4.3 Text Rules

- Heading harus ringkas, jelas, dan informatif.
- Hindari paragraph panjang di dalam card.
- Gunakan teks status yang eksplisit seperti `Lunas`, `Belum Bayar`, `Menunggu Verifikasi`, `Terlambat`, dan `Sudah Piket`.
- Gunakan format mata uang Indonesia: `Rp25.000`.
- Gunakan format tanggal yang mudah dibaca: `12 Juni 2026`.

---

## 5. Layout System

### 5.1 Layout Principle

Aplikasi harus menggunakan layout yang konsisten antara desktop dan mobile.

Prinsip utama:

- Mobile-first.
- Dashboard berbasis card.
- Navigasi sederhana.
- Setiap halaman memiliki title, deskripsi singkat, dan action utama.
- Data penting ditampilkan di bagian atas halaman.
- Tabel di desktop, card-list di mobile.

### 5.2 Page Structure

Struktur halaman utama:

1. **Top Navigation / Header**
   - Logo aplikasi.
   - Nama kos atau nama sistem.
   - User profile menu.
   - Notification icon.

2. **Sidebar Navigation** untuk desktop
   - Dashboard
   - Penghuni
   - Iuran
   - Pembayaran
   - Pengeluaran
   - Dana Talangan
   - Laporan Keuangan
   - Galon
   - Jadwal Piket
   - Notifikasi
   - Pengaturan

3. **Bottom Navigation** untuk mobile
   - Dashboard
   - Iuran
   - Galon
   - Piket
   - Profil

4. **Content Area**
   - Page title.
   - Summary cards.
   - Filter/search.
   - Main table/list.
   - Primary action button.

### 5.3 Spacing

Gunakan spacing berbasis kelipatan 4px.

| Token | Value | Usage |
|---|---:|---|
| `space-1` | 4px | Gap kecil |
| `space-2` | 8px | Gap antar label |
| `space-3` | 12px | Padding kecil |
| `space-4` | 16px | Padding card standar |
| `space-6` | 24px | Gap section |
| `space-8` | 32px | Padding halaman |
| `space-10` | 40px | Section besar |

### 5.4 Border Radius

| Token | Value | Usage |
|---|---:|---|
| `radius-sm` | 6px | Badge, small button |
| `radius-md` | 10px | Input, select |
| `radius-lg` | 14px | Card, modal |
| `radius-xl` | 20px | Dashboard highlight card |
| `radius-full` | 9999px | Avatar, pill badge |

---

## 6. Component Design Guidelines

## 6.1 Button

### Primary Button

Digunakan untuk action utama seperti `Tambah Iuran`, `Konfirmasi Pembayaran`, `Tambah Pengeluaran`, dan `Buat Jadwal Piket`.

Style:

```css
background: #10B981;
color: #FFFFFF;
border-radius: 10px;
font-weight: 600;
padding: 10px 16px;
```

Hover:

```css
background: #047857;
```

### Secondary Button

Digunakan untuk action tambahan seperti `Lihat Detail`, `Filter`, dan `Export`.

```css
background: #FFFFFF;
color: #047857;
border: 1px solid #D1FAE5;
```

### Danger Button

Digunakan untuk delete atau tindakan kritis.

```css
background: #EF4444;
color: #FFFFFF;
```

---

## 6.2 Card

Card adalah komponen utama dashboard.

Style:

```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 14px;
padding: 16px;
box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
```

Jenis card utama:

- Summary card.
- Financial metric card.
- Payment status card.
- Galon prediction card.
- Schedule card.
- Notification card.

---

## 6.3 Badge / Status Pill

Gunakan badge untuk menampilkan status penting.

| Status | Background | Text Color | Label |
|---|---:|---:|---|
| Lunas | `#D1FAE5` | `#047857` | `Lunas` |
| Belum Bayar | `#FEF3C7` | `#92400E` | `Belum Bayar` |
| Terlambat | `#FEE2E2` | `#B91C1C` | `Terlambat` |
| Menunggu Verifikasi | `#DBEAFE` | `#1D4ED8` | `Menunggu Verifikasi` |
| Ditolak | `#FEE2E2` | `#B91C1C` | `Ditolak` |
| Sudah Piket | `#D1FAE5` | `#047857` | `Sudah Piket` |
| Belum Piket | `#FEF3C7` | `#92400E` | `Belum Piket` |

---

## 6.4 Input and Form

Form harus sederhana dan mudah dipahami.

Style input:

```css
background: #FFFFFF;
border: 1px solid #E5E7EB;
border-radius: 10px;
padding: 10px 12px;
font-size: 14px;
```

Focus state:

```css
border-color: #10B981;
box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
```

Form field yang umum:

- Text input.
- Number input.
- Date picker.
- Select dropdown.
- Textarea.
- File upload untuk bukti pembayaran atau bukti pembelian.

Form rules:

- Label wajib jelas.
- Field wajib diberi tanda `*`.
- Error message muncul di bawah field.
- Gunakan placeholder sebagai contoh, bukan pengganti label.
- Validasi nominal harus mencegah angka negatif.

---

## 6.5 Table

Tabel digunakan untuk desktop.

Style:

- Header background: `#F3F4F6`.
- Border: `#E5E7EB`.
- Row hover: `#ECFDF5`.
- Action icon berada di kolom paling kanan.

Kolom tabel harus ringkas. Untuk data panjang, gunakan detail drawer atau modal.

Contoh tabel pembayaran:

| Penghuni | Periode | Nominal | Status | Jatuh Tempo | Action |
|---|---|---:|---|---|---|
| Ahmad | Juni 2026 | Rp25.000 | Lunas | 10 Juni 2026 | Detail |

---

## 6.6 Modal / Dialog

Modal digunakan untuk:

- Tambah data.
- Edit data.
- Konfirmasi hapus.
- Verifikasi pembayaran.
- Detail transaksi.

Rules:

- Modal tidak boleh terlalu panjang.
- Untuk form panjang, gunakan halaman khusus atau stepper.
- Modal harus memiliki tombol `Batal` dan tombol action utama.
- Gunakan confirm dialog untuk action irreversible.

---

## 6.7 Empty State

Setiap halaman data harus memiliki empty state.

Contoh copywriting:

- `Belum ada data iuran.`
- `Belum ada pembayaran yang perlu diverifikasi.`
- `Belum ada jadwal piket galon.`
- `Data galon belum cukup untuk membuat prediksi.`

Empty state harus memiliki:

- Icon sederhana.
- Judul singkat.
- Deskripsi.
- Action button jika relevan.

---

## 6.8 Notification / Toast

Gunakan toast untuk feedback cepat.

Contoh:

- Success: `Pembayaran berhasil dikonfirmasi.`
- Error: `Nominal pembayaran tidak boleh kosong.`
- Warning: `Saldo kas tidak mencukupi.`
- Info: `Reminder pembayaran telah dikirim.`

Toast rules:

- Muncul maksimal 3–5 detik.
- Tidak menutupi tombol utama.
- Gunakan warna sesuai semantic color.

---

## 7. Page-Level Design Specification

## 7.1 Login Page

Tujuan halaman:

- Memberikan akses masuk kepada pengguna.
- Menampilkan identitas aplikasi dengan jelas.

Layout:

- Desktop: split layout, kiri visual/branding, kanan form login.
- Mobile: single column.

Elemen:

- Logo `Soematra Kost`.
- Tagline: `Kelola iuran, galon, dan jadwal kos dengan lebih tertib.`
- Input email.
- Input password.
- Tombol login.
- Link lupa password jika tersedia.

Visual:

- Background putih dengan aksen soft green.
- Card login putih dengan shadow halus.
- Ilustrasi opsional berupa rumah/kos dan dashboard keuangan.

---

## 7.2 Dashboard Bendahara

Dashboard bendahara harus menjadi pusat kontrol keuangan dan operasional.

Komponen utama:

1. Greeting card
   - `Selamat datang, Bendahara`
   - Ringkasan bulan berjalan.

2. Summary cards
   - Saldo kas.
   - Total iuran masuk.
   - Total pengeluaran.
   - Dana talangan belum diganti.
   - Pembayaran menunggu verifikasi.

3. Action shortcuts
   - Tambah iuran.
   - Catat pengeluaran.
   - Verifikasi pembayaran.
   - Catat pembelian galon.

4. Recent transactions
   - Transaksi terbaru.

5. Payment status overview
   - Jumlah lunas, belum bayar, terlambat.

6. Galon overview
   - Estimasi galon habis.
   - Rekomendasi pembelian.

---

## 7.3 Dashboard Penghuni

Dashboard penghuni harus sederhana dan berorientasi pada kewajiban pribadi.

Komponen utama:

1. Tagihan aktif.
2. Status pembayaran pribadi.
3. Reminder jatuh tempo.
4. Jadwal piket galon pribadi.
5. Informasi kas bersama ringkas.
6. Notifikasi terbaru.

Primary action:

- `Bayar / Konfirmasi Pembayaran`
- `Konfirmasi Piket`

---

## 7.4 Dashboard Koordinator

Dashboard koordinator fokus pada monitoring.

Komponen utama:

1. Status pembayaran seluruh penghuni.
2. Saldo kas ringkas.
3. Jadwal piket minggu ini.
4. Prediksi kebutuhan galon.
5. Penghuni terlambat bayar.
6. Aktivitas operasional terbaru.

Primary action:

- `Atur Jadwal Piket`
- `Lihat Laporan`

---

## 7.5 Halaman Iuran

Fungsi:

- Membuat iuran.
- Menampilkan daftar iuran.
- Melihat status tagihan per penghuni.

Layout:

- Top summary: total iuran bulan ini, jumlah penghuni tertagih, pembayaran lunas, belum bayar.
- Filter: periode, status, jenis iuran.
- Table/list: daftar iuran.
- Button: `Tambah Iuran`.

Form tambah iuran:

- Nama iuran.
- Jenis iuran.
- Nominal.
- Periode.
- Tanggal jatuh tempo.
- Penghuni yang dikenakan iuran.
- Catatan.

---

## 7.6 Halaman Pembayaran

Fungsi:

- Penghuni mengonfirmasi pembayaran.
- Bendahara memverifikasi pembayaran.

Status flow:

```text
Belum Bayar → Menunggu Verifikasi → Lunas
Belum Bayar → Menunggu Verifikasi → Ditolak
```

Komponen:

- Daftar pembayaran.
- Filter status.
- Detail pembayaran.
- Bukti pembayaran.
- Tombol verifikasi / tolak.

---

## 7.7 Halaman Pengeluaran

Fungsi:

- Mencatat pengeluaran operasional.
- Menampilkan riwayat pengeluaran.
- Menghubungkan pembelian galon dengan pengeluaran kas.

Field utama:

- Tanggal.
- Kategori.
- Nominal.
- Deskripsi.
- Bukti transaksi.
- Dibayar oleh.
- Sumber dana: `Kas Kos` atau `Dana Talangan`.

---

## 7.8 Halaman Dana Talangan

Fungsi:

- Mencatat dana pribadi bendahara yang digunakan untuk kebutuhan kos.
- Memantau status penggantian.

Status:

- `Belum Diganti`
- `Sebagian Diganti`
- `Sudah Diganti`

Komponen:

- Summary total talangan aktif.
- Daftar talangan.
- Detail transaksi.
- Action penggantian.

---

## 7.9 Halaman Laporan Keuangan

Fungsi:

- Menampilkan laporan kas kos secara transparan.

Komponen:

- Filter periode.
- Total pemasukan.
- Total pengeluaran.
- Saldo awal.
- Saldo akhir.
- Dana talangan.
- Pembayaran belum lunas.
- Export laporan jika memungkinkan.

Visual:

- Gunakan card ringkasan.
- Gunakan chart sederhana untuk pemasukan vs pengeluaran.
- Gunakan tabel transaksi untuk detail.

---

## 7.10 Halaman Galon

Fungsi:

- Mencatat pembelian galon.
- Memantau konsumsi.
- Memprediksi kebutuhan.

Komponen:

- Summary galon bulan ini.
- Rata-rata konsumsi.
- Estimasi tanggal habis.
- Rekomendasi jumlah pembelian.
- Riwayat pembelian.
- Tombol `Catat Pembelian Galon`.

Prediction card:

- Background: `#ECFDF5`.
- Icon galon.
- Status prediksi.
- Warning jika galon diprediksi hampir habis.

---

## 7.11 Halaman Jadwal Piket

Fungsi:

- Mengatur jadwal piket pembelian galon.
- Menampilkan giliran penghuni.
- Mengonfirmasi pelaksanaan piket.

Komponen:

- Calendar/list view.
- Nama penghuni bertugas.
- Status piket.
- Tombol konfirmasi.
- Fitur tukar jadwal opsional.

---

## 7.12 Halaman Notifikasi

Fungsi:

- Menampilkan seluruh notifikasi operasional.

Jenis notifikasi:

- Tagihan baru.
- Jatuh tempo pembayaran.
- Pembayaran diverifikasi.
- Pembayaran ditolak.
- Jadwal piket baru.
- Galon hampir habis.
- Dana talangan belum diganti.

---

## 8. Role-Based UI Rules

### 8.1 Admin Sistem

Admin dapat melihat dan mengelola:

- Pengguna.
- Role dan hak akses.
- Audit log.
- Koreksi data.
- Konfigurasi sistem.

### 8.2 Bendahara Kos

Bendahara dapat melihat dan mengelola:

- Iuran.
- Pembayaran.
- Verifikasi pembayaran.
- Pengeluaran.
- Dana talangan.
- Laporan keuangan.
- Pembelian galon.
- Vendor galon.

### 8.3 Koordinator Kos / Ketua Kos

Koordinator dapat melihat dan mengelola:

- Monitoring pembayaran.
- Jadwal piket.
- Data penghuni.
- Laporan keuangan ringkas.
- Prediksi kebutuhan galon.

### 8.4 Penghuni Kos

Penghuni dapat melihat dan mengelola:

- Tagihan pribadi.
- Konfirmasi pembayaran.
- Riwayat pembayaran pribadi.
- Jadwal piket pribadi.
- Konfirmasi pelaksanaan piket.
- Notifikasi pribadi.
- Informasi kas bersama yang diizinkan.

---

## 9. Interaction and UX Rules

### 9.1 Feedback

Setiap action penting harus memberikan feedback.

Contoh:

- Setelah submit pembayaran: tampilkan toast sukses.
- Setelah verifikasi pembayaran: status berubah menjadi `Lunas`.
- Setelah catat pengeluaran: saldo kas otomatis diperbarui.
- Setelah catat pembelian galon: tracker galon otomatis diperbarui.

### 9.2 Loading State

Gunakan loading state pada:

- Fetch data.
- Submit form.
- Upload bukti.
- Generate laporan.
- Hitung prediksi galon.

Style loading:

- Skeleton card untuk dashboard.
- Spinner kecil pada button submit.
- Disable button saat proses berjalan.

### 9.3 Error State

Error harus jelas dan actionable.

Contoh:

- `Nominal iuran wajib diisi.`
- `Tanggal jatuh tempo tidak boleh lebih awal dari hari ini.`
- `Bukti pembayaran wajib diunggah.`
- `Saldo kas tidak mencukupi. Gunakan dana talangan atau tambah iuran.`

### 9.4 Confirmation

Gunakan confirmation dialog untuk:

- Menghapus data.
- Menolak pembayaran.
- Mengubah status pembayaran menjadi lunas.
- Menghapus jadwal piket.
- Melakukan koreksi transaksi.

---

## 10. Data Visualization Guidelines

Gunakan visualisasi sederhana dan informatif.

Chart yang disarankan:

- Bar chart: pemasukan vs pengeluaran.
- Line chart: konsumsi galon per periode.
- Donut chart: status pembayaran penghuni.
- Progress bar: persentase pembayaran lunas.

Warna chart:

- Pemasukan: `#10B981`
- Pengeluaran: `#EF4444`
- Dana talangan: `#F59E0B`
- Pembayaran lunas: `#22C55E`
- Belum bayar: `#F59E0B`
- Terlambat: `#EF4444`

---

## 11. Iconography

Gunakan icon outline modern dan konsisten.

Rekomendasi library:

- Lucide React
- Heroicons
- Phosphor Icons

Icon mapping:

| Feature | Recommended Icon |
|---|---|
| Dashboard | LayoutDashboard |
| Penghuni | Users |
| Iuran | ReceiptText |
| Pembayaran | WalletCards |
| Pengeluaran | ArrowDownCircle |
| Dana Talangan | HandCoins |
| Laporan | ChartNoAxesCombined |
| Galon | Droplets / GlassWater |
| Jadwal Piket | CalendarCheck |
| Notifikasi | Bell |
| Pengaturan | Settings |
| Verifikasi | BadgeCheck |
| Error | CircleAlert |

---

## 12. Responsive Design

### 12.1 Breakpoints

| Breakpoint | Width | Behavior |
|---|---:|---|
| Mobile | `< 640px` | Bottom navigation, card-list, single column |
| Tablet | `640px–1024px` | Two-column grid, collapsible sidebar |
| Desktop | `> 1024px` | Sidebar, table view, multi-column dashboard |

### 12.2 Mobile Rules

- Gunakan bottom navigation.
- Hindari tabel lebar; ubah menjadi card-list.
- Primary action dapat menggunakan floating action button atau button full-width.
- Summary card maksimal 2 kolom, lebih baik 1 kolom untuk layar kecil.
- Form menggunakan single column.

---

## 13. Accessibility

Aplikasi harus mudah digunakan dan terbaca.

Rules:

- Kontras warna harus cukup jelas.
- Jangan hanya mengandalkan warna untuk status; gunakan juga label teks.
- Button harus memiliki label yang jelas.
- Form input harus memiliki label.
- Fokus keyboard harus terlihat.
- Ukuran font body minimal 14px.
- Touch target mobile minimal 44px.

---

## 14. Suggested Tailwind Design Tokens

Jika menggunakan Tailwind CSS, tambahkan konfigurasi warna berikut:

```js
const colors = {
  primary: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
};
```

Recommended body style:

```css
body {
  background: #F9FAFB;
  color: #111827;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
```

---

## 15. Example Component Structure

Jika aplikasi menggunakan React, komponen UI dapat disusun seperti berikut:

```text
src/
  components/
    ui/
      Button.tsx
      Card.tsx
      Badge.tsx
      Input.tsx
      Modal.tsx
      Table.tsx
      Toast.tsx
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
      BottomNav.tsx
    dashboard/
      SummaryCard.tsx
      MetricCard.tsx
      RecentTransactionList.tsx
      PaymentStatusChart.tsx
    finance/
      ContributionForm.tsx
      PaymentVerificationModal.tsx
      ExpenseForm.tsx
      CashBalanceCard.tsx
    gallon/
      GallonPurchaseForm.tsx
      GallonPredictionCard.tsx
      GallonHistoryList.tsx
    schedule/
      PicketScheduleCard.tsx
      PicketConfirmationButton.tsx
```

---

## 16. Copywriting Guidelines

Gunakan bahasa Indonesia yang singkat, jelas, dan ramah.

### 16.1 Button Copy

- `Tambah Iuran`
- `Konfirmasi Pembayaran`
- `Verifikasi`
- `Tolak Pembayaran`
- `Catat Pengeluaran`
- `Catat Pembelian Galon`
- `Buat Jadwal Piket`
- `Lihat Laporan`
- `Simpan Perubahan`

### 16.2 Empty State Copy

- `Belum ada data pembayaran.`
- `Belum ada transaksi pada periode ini.`
- `Belum ada pembelian galon yang tercatat.`
- `Belum ada jadwal piket yang dibuat.`

### 16.3 Warning Copy

- `Galon diprediksi akan habis dalam 2 hari.`
- `Saldo kas tidak mencukupi untuk transaksi ini.`
- `Masih ada penghuni yang belum membayar iuran.`
- `Dana talangan belum diganti.`

---

## 17. Design Acceptance Criteria

Sebuah fitur dianggap sesuai desain apabila memenuhi kriteria berikut:

- Menggunakan palet warna hijau-putih sesuai dokumen ini.
- Memiliki layout yang rapi dan konsisten.
- Menggunakan komponen yang reusable.
- Responsif di mobile dan desktop.
- Status data ditampilkan dengan badge yang jelas.
- Setiap action memiliki feedback.
- Form memiliki validasi dan error message.
- Informasi keuangan mudah dibaca dan tidak membingungkan.
- Dashboard menampilkan informasi paling penting di bagian atas.
- Tidak ada halaman inti yang hanya berupa placeholder.

---

## 18. Final UI Checklist

Sebelum aplikasi dianggap selesai, lakukan pengecekan berikut:

- [ ] Warna utama hijau dan putih sudah konsisten.
- [ ] Sidebar desktop dan bottom navigation mobile berfungsi.
- [ ] Dashboard tiap role memiliki informasi yang relevan.
- [ ] Card summary keuangan mudah dibaca.
- [ ] Status pembayaran menggunakan badge yang sesuai.
- [ ] Form iuran, pembayaran, pengeluaran, talangan, dan galon memiliki validasi.
- [ ] Tabel desktop berubah menjadi card-list di mobile.
- [ ] Toast muncul setelah action penting.
- [ ] Loading state tersedia di fetch dan submit data.
- [ ] Error state memiliki pesan yang jelas.
- [ ] Empty state tersedia untuk halaman tanpa data.
- [ ] Halaman laporan memiliki visual ringkasan yang mudah dipahami.
- [ ] Fitur prediksi galon memiliki visual warning jika galon hampir habis.
- [ ] Jadwal piket mudah dibaca dan dikonfirmasi.
- [ ] UI tidak terlalu padat dan tetap nyaman digunakan.

---

## 19. Summary

Desain Soematra Kost harus menghadirkan pengalaman penggunaan yang modern, bersih, dan mudah dipahami. Warna hijau digunakan sebagai identitas utama untuk memperkuat kesan transparansi, keteraturan, dan kepercayaan dalam pengelolaan operasional kos. Seluruh halaman harus dirancang dengan orientasi pada kemudahan penggunaan, akurasi informasi, dan efisiensi pengelolaan iuran, galon, keuangan, serta jadwal piket.
