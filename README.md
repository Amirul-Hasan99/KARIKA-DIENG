# ☕ Katalog Menu Kopi & Snack - Self-Order & POS System

Sistem pemesanan mandiri (*Self-Order QR Code*), *Kitchen Display System* (KDS), dan Point of Sale (POS) modern berbasis web. Dirancang khusus untuk kedai kopi, kafe, dan resto cepat saji guna mempercepat antrean, meminimalisir kesalahan pesanan, serta mengotomatisasi pencatatan kasir dan dapur secara *real-time*.

---

## 🌟 Fitur Utama

### 📱 1. Customer Self-Ordering (Pemesanan Mandiri via QR)
- **Scan & Order Instant**: Pelanggan cukup scan QR Code di meja (`/table/[tableId]`) tanpa perlu download aplikasi.
- **Katalog Menu Interaktif**: Kategori lengkap (Espresso, Cold Brew, Non-Coffee, Savory Snacks, Pastries) dengan foto menarik, badge Best Seller, dan pencarian cepat.
- **Kustomisasi & Modifier Lengkap**:
  - Pilihan suhu: Dingin Segar (Iced) / Hangat Nikmat (Hot).
  - Pilihan susu: Fresh Milk, Oatmilk, Almond Milk.
  - Pilihan level manis (Sugar Level) & Topping tambahan.
  - Catatan khusus (*kitchen notes*) per menu.
- **Keranjang Belanja Real-Time**: Update instan kuantitas, modifikasi varian, dan kalkulasi subtotal.

### 💳 2. Sistem Pembayaran Digital & Tunai (Midtrans, QRIS & Kasir)
- **Metode Pembayaran Fleksibel**:
  - 📱 **QRIS & E-Wallet Digital**: Integrasi Midtrans Snap API (GoPay, OVO, ShopeePay, Dana, LinkAja, VA) dengan simulator QRIS sandbox lokal.
  - 💵 **Bayar Tunai di Kasir (Cash)**: Memfasilitasi pelanggan yang membawa uang tunai. Pesanan langsung tercatat dan menunggu konfirmasi satu klik dari kasir.
- **Auto Settlement & Webhook**: Verifikasi status pembayaran instan via webhook endpoint (`/api/midtrans/notification`).

### 🔔 3. Live Customer Order Tracking (`/orders/[orderId]`)
- **Tracking Status Real-Time**: Status pesanan ter-update otomatis tanpa refresh (Diterima ➡️ Sedang Dimasak ➡️ Siap Diambil ➡️ Selesai).
- **Banner Petunjuk Bayar Kasir**: Panduan bayar tunai lengkap dengan rincian total tagihan dan nomor pesanan.
- **Estimasi Antrean & Layanan**: Indikator perkiraan waktu siap (± 8-12 menit) dan nomor meja.
- **Audio Chime & Confetti**: Suara bel peracikan kopi selesai dan efek animasi confetti.
- **E-Receipt & Koreksi Meja**: Pelanggan dapat mengganti nomor meja langsung dari keranjang jika salah scan QR.

### 🍳 4. Kitchen Display System - KDS (`/admin/kitchen`)
- **Pemisahan Stasiun Kerja**:
  - ☕ **Stasiun Barista**: Khusus meracik minuman, kopi, dan teh.
  - 🍟 **Stasiun Dapur**: Khusus menggoreng dan menyiapkan snack/makanan.
  - 📋 **Semua Stasiun**: Tampilan gabungan untuk kasir/supervisor.
- **Checklist Coret Item Interaktif**: Staf dapat mencentang/mencoret baris item yang telah selesai dibuat.
- **Audio Alert & SLA Timer**: Suara bel peringatan pesanan baru dan badge indikator lama waktu tunggu.

### 🖥️ 5. Admin & POS Dashboard (`/admin`)
- **Konfirmasi Pembayaran Kasir**: Tab *"Bayar Kasir"* untuk mengonfirmasi pelunasan uang tunai dalam 1 klik.
- **Manajemen Stok Cepat (Sold Out Toggle)**: Tab *"Kelola Stok Menu"* untuk menonaktifkan menu yang bahannya habis secara real-time.
- **Filter Tanggal & Ekspor CSV**: Filter omset harian (Hari Ini, Kemarin, Semua) dan tombol unduh laporan transaksi spreadsheet (CSV).
- **Thermal Printer ESC/POS & Void**: Cetak struk kasir thermal 58mm/80mm dan tombol pembatalan pesanan jika pelanggan keliru.

---

## 🛠️ Tech Stack

| Komponen | Teknologi |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Library UI** | [React 19](https://react.dev/) & [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [Lucide Icons](https://lucide.dev/) |
| **State Management** | [Zustand](https://github.com/pmndrs/zustand) (dengan LocalStorage Persist) |
| **Database & Realtime** | [Firebase Firestore](https://firebase.google.com/) + In-Memory Fallback Store |
| **Server SDK** | [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup) |
| **Payment Gateway** | [Midtrans Snap API & Client](https://midtrans.com/) |
| **Printer Hardware** | ESC/POS Command Encoder + Web Bluetooth / Web Print API |
| **Audio Alert** | Web Audio API Synthesizer (Tanpa dependensi file audio eksternal) |

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Cara 1: Menggunakan File Otomatis `run.bat` (Windows)
Cukup klik ganda (double-click) file **`run.bat`** di folder root proyek ini. Skrip akan secara otomatis:
1. Memeriksa instalasi Node.js.
2. Memeriksa dan menginstal dependensi (`npm install`) jika belum ada.
3. Menyiapkan file konfigurasi `.env.local` jika belum dibuat.
4. Menjalankan server pengembangan (`npm run dev`).
5. Membuka browser otomatis ke `http://localhost:3000`.

---

### Cara 2: Manual via Terminal / Command Prompt

1. **Clone atau Buka Folder Proyek**:
   ```bash
   cd "c:/Users/VIVOBOOK/OneDrive - Business/FILE/Pictures/KATALOG MENU"
   ```

2. **Instal Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables**:
   Salin template `.env.local.example` menjadi `.env.local`:
   ```bash
   copy .env.local.example .env.local
   ```
   > *Catatan*: Aplikasi sudah dilengkapi dengan sistem **Fallback Mock Database** dan **QRIS Simulator**. Jadi aplikasi tetap dapat berjalan normal untuk demo dan pengujian lokal meskipun Anda belum mengisi kredensial Firebase atau Midtrans asli.

4. **Jalankan Server Development**:
   ```bash
   npm run dev
   ```

5. **Buka Aplikasi di Browser**:
   - Beranda & Navigasi: [http://localhost:3000](http://localhost:3000)
   - Menu Meja 01: [http://localhost:3000/table/table-01](http://localhost:3000/table/table-01)
   - Dashboard Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Kitchen Display: [http://localhost:3000/admin/kitchen](http://localhost:3000/admin/kitchen)

---

## 📁 Struktur Direktori

```text
├── app/
│   ├── admin/
│   │   ├── kitchen/page.tsx    # Kitchen Display System (KDS)
│   │   └── page.tsx            # Admin & POS Dashboard
│   ├── api/
│   │   ├── midtrans/           # Endpoint integrasi Midtrans Snap & Webhook
│   │   ├── orders/             # REST API CRUD Pesanan & In-Memory Store
│   │   └── seed/               # Endpoint seeder database menu & meja
│   ├── orders/[orderId]/       # Halaman live tracking status pesanan pelanggan
│   ├── table/[tableId]/        # Halaman menu katalog & self-order pelanggan
│   ├── layout.tsx              # Root layout & meta tags
│   └── page.tsx                # Halaman utama landing & hub navigasi
├── components/
│   └── customer/
│       ├── CartDrawer.tsx      # Sidebar keranjang belanja & ringkasan
│       ├── ModifierDrawer.tsx  # Modal pilihan varian, level manis, susu, dsb.
│       ├── PaymentModal.tsx    # Modal checkout & integrasi Midtrans Snap
│       └── QrisDisplay.tsx     # Komponen tampilan QRIS simulator & auto-poll
├── hooks/
│   └── useKitchenOrders.ts     # Hook sinkronisasi real-time data pesanan
├── lib/
│   ├── firebase.ts             # Inisialisasi Firebase Client
│   ├── firebase-admin.ts       # Inisialisasi Firebase Admin SDK
│   ├── midtrans.ts             # Helper koneksi API Midtrans Sandbox/Prod
│   ├── mock-data.ts            # Data master katalog kopi, snack, dan meja
│   ├── order-store.ts          # In-memory storage fallback saat offline/tanpa db
│   ├── thermal-printer.ts      # ESC/POS formatter & web thermal print driver
│   └── utils.ts                # Format mata uang rupiah, audio alert, helpers
├── store/
│   └── useCartStore.ts         # Zustand state management keranjang belanja
├── types/
│   └── index.ts                # TypeScript interfaces & data contracts
├── PRD.md                      # Product Requirement Document lengkap
├── SKILLS.md                   # Dokumentasi kapabilitas & standar teknis
└── run.bat                     # Script one-click launcher untuk Windows
```

---

## ⚙️ Skrip yang Tersedia

- `npm run dev` : Menjalankan Next.js development server di port 3000.
- `npm run build` : Membuat production build yang telah dioptimasi.
- `npm run start` : Menjalankan server production setelah proses build.
- `npm run lint` : Menjalankan ESLint untuk mengecek kualitas dan format kode.

---

## 📄 Lisensi & Kontributor
Dikembangkan untuk sistem operasional gerai Kopi & Snack modern. Bebas dimodifikasi sesuai kebutuhan bisnis.
