# UI/UX Guidelines (Soematra Kost Design System)

Dokumen ini menjadi acuan desain visual dan pengalaman pengguna untuk pengembangan aplikasi **Soematra Kost**. Seluruh keputusan UI/UX, warna, tipografi, tata letak, komponen, dan pola interaksi dalam aplikasi wajib mengikuti panduan ini agar sistem memiliki tampilan yang modern, konsisten, rapi, dan mudah digunakan.

---

## 1. Design Direction & Keywords

Aplikasi Soematra Kost menggunakan pendekatan **modern, clean, friendly, financial-dashboard oriented, dan mobile-first**. Tampilan dirancang untuk menumbuhkan rasa transparan, tertib, dan tepercaya.

### Kata Kunci Desain (Design Keywords)
* **Fresh & Clean:** Menggunakan ruang putih yang lapang dan aksen warna hijau segar.
* **Financial Clarity:** Laporan keuangan disajikan dengan jelas, menggunakan angka yang tegas dan chart yang intuitif.
* **Operational Control:** Alur interaksi operasional (seperti piket dan galon) dirancang praktis dan minim gesekan (frictionless).

---

## 2. Palet Warna (Color Palette)

Warna utama aplikasi adalah **hijau** (Emerald Green) untuk mewakili pertumbuhan, ketertiban, dan rasa aman dalam keuangan kos.

### 2.1 Primary Colors
| Token | Color Name | Hex | Usage |
| :--- | :--- | :---: | :--- |
| `primary` | Emerald Green | `#10B981` | Tombol utama, highlight, active state, icon utama |
| `primary-dark` | Deep Emerald | `#047857` | Hover button, header accent, active navigation |
| `primary-light` | Soft Mint | `#D1FAE5` | Background badge, alert ringan, card highlight |
| `primary-soft` | Pale Green | `#ECFDF5` | Section background, empty state background |

### 2.2 Neutral Colors
| Token | Color Name | Hex | Usage |
| :--- | :--- | :---: | :--- |
| `white` | Pure White | `#FFFFFF` | Background utama, card, modal |
| `background` | Off White | `#F9FAFB` | App background |
| `surface` | Soft Surface | `#F3F4F6` | Secondary background, table header |
| `border` | Light Border | `#E5E7EB` | Border card, input, divider |
| `text-primary` | Charcoal | `#111827` | Heading, teks utama |
| `text-secondary` | Slate Gray | `#4B5563` | Deskripsi, metadata |
| `text-muted` | Muted Gray | `#9CA3AF` | Placeholder, helper text |

### 2.3 Semantic Colors
* **Success:** `#22C55E` (Pembayaran Lunas, Sudah Piket)
* **Warning:** `#F59E0B` (Jatuh tempo dekat, galon hampir habis, verifikasi pending)
* **Danger:** `#EF4444` (Terlambat bayar, Ditolak, error/alert kritis)
* **Info:** `#3B82F6` (Pengumuman, informasi sistem)

### 2.4 Gradients
* **Header / Summary Accent:** `linear-gradient(135deg, #10B981 0%, #047857 100%)`
* **Card Soft Background:** `linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)`

---

## 3. Tipografi (Typography)

* **Font Family:** `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`
* **Format Mata Uang:** Wajib menggunakan format rupiah Indonesia yang jelas, misal: `Rp25.000` (tanpa spasi setelah Rp).
* **Format Tanggal:** Menggunakan format tanggal lokal Indonesia: `12 Juni 2026`.

---

## 4. Sistem Layout & Spacing

* **Mobile-first approach:** Menampilkan navigasi bawah (bottom navigation) untuk mobile, dan sidebar collapsible untuk desktop.
* **Border Radius:**
  * `radius-sm (6px)` - Badge, small button
  * `radius-md (10px)` - Input, select dropdown
  * `radius-lg (14px)` - Card, modal
  * `radius-xl (20px)` - Dashboard highlight card
* **Spacing Scale:** Kelipatan 4px (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).

---

## 5. Panduan Desain Komponen UI

### 5.1 Buttons
* **Primary:** `bg-[#10B981]` dengan teks putih. Efek hover bertransisi ke `bg-[#047857]` dalam waktu 200ms.
* **Secondary:** Border border-mint dengan teks hijau deep.
* **Danger:** `bg-[#EF4444]` untuk penghapusan data.

### 5.2 Badges & Status Pills
Badge status harus menggunakan paduan warna latar yang sangat lembut (*light background*) dengan teks warna gelap (*dark text*) yang kontras:
* **Lunas:** `bg-emerald-50 text-emerald-700 border-emerald-100`
* **Belum Bayar / Belum Piket:** `bg-amber-50 text-amber-700 border-amber-100`
* **Terlambat / Ditolak:** `bg-rose-50 text-rose-700 border-rose-100`
* **Menunggu Verifikasi:** `bg-blue-50 text-blue-700 border-blue-100`

### 5.3 Modals & Confirm Dialogs
* Setiap tindakan kritis yang tidak dapat dibatalkan (seperti menghapus tagihan, menolak pembayaran, atau merestore database) **wajib** memicu Dialog Konfirmasi (`ConfirmDialog.tsx`) yang jelas.

---

## 6. Animasi & Collapsible Sidebar Premium

Sidebar desktop dapat dibuka dan ditutup (collapse/expand) secara dinamis menggunakan global state store dari Zustand.

### 6.1 Spesifikasi Transisi
* **Kecepatan Animasi:** `300ms`
* **Easing Function:** `cubic-bezier(0.4, 0, 0.2, 1)`
* **Lebar Terbuka (Expanded Width):** `280px`
* **Lebar Tertutup (Collapsed Width):** `84px`

### 6.2 Perilaku Komponen saat Collapsed
1. **Logo Perusahaan:** Logo teks penuh meredup dan bergeser keluar (opacity 0, translate-x), menyisakan icon lambang kos yang membesar perlahan (scale-105).
2. **Navigasi Menu:** Teks label pada menu disembunyikan menggunakan transisi `overflow-hidden` dan `opacity-0` agar icon menu tetap presisi di tengah sidebar tertutup.
3. **Penyimpanan Status:** Sesi status collapse disimpan secara persisten di lokal penyimpanan browser (`localStorage` via Zustand middleware) sehingga tidak kembali ke status default saat halaman dimuat ulang.
