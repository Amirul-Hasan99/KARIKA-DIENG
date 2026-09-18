# 🧠 Technical Skills & Architecture Competency Guide (SKILLS.md)

Dokumen ini memuat standar kompetensi rekayasa perangkat lunak (*software engineering skills*), pola arsitektur (*architecture patterns*), dan panduan teknis yang diterapkan dalam pengembangan **Sistem Self-Order & POS Katalog Menu Kopi & Snack**.

---

## 📑 Daftar Kompetensi Utama (Skill Matrix)

```text
├── 1. Frontend & Modern Web Architecture (Next.js 15, React 19, Tailwind)
├── 2. State Management & Data Flow (Zustand Persistent Store)
├── 3. Real-Time Database & Synchronous Messaging (Firebase Firestore)
├── 4. Payment Gateway & FinTech Integration (Midtrans Snap & QRIS)
├── 5. Hardware Integration & IoT (ESC/POS Bluetooth Thermal Printing)
├── 6. Web Audio API & Interactive Sound Synthesis
└── 7. DevOps, Deployment & Resiliency Engineering (In-Memory Fallback)
```

---

## 1. Frontend & Modern Web Architecture

### 1.1 Next.js 15 (App Router) & React 19
- **Server vs Client Component Boundary**:
  - Halaman interaktif (seperti keranjang belanja, drawer varian, dan KDS) menggunakan direktif `"use client"` secara terisolasi.
  - Pemanfaatan Server Route Handlers (`app/api/**/route.ts`) untuk menangani logika sensitif seperti komunikasi Midtrans Server Key dan Firebase Admin SDK.
- **Dynamic Routing & Path Parameters**:
  - Pengambilan parameter dinamis meja (`/table/[tableId]`) dan nomor pesanan (`/orders/[orderId]`) dengan validasi fallback otomatis jika parameter tidak valid.
- **Optimized UI Components**:
  - Desain modular dengan pemisahan komponen pelanggan (`CartDrawer.tsx`, `ModifierDrawer.tsx`, `PaymentModal.tsx`, `QrisDisplay.tsx`).

### 1.2 Tailwind CSS & Mobile-First Design System
- **Touch & Mobile Ergonomics**:
  - Ukuran target sentuh tombol minimal 44x44px (*Apple Human Interface Guidelines*).
  - Pemanfaatan fixed bottom action bars pada tampilan smartphone pelanggan agar jempol pengguna mudah menjangkau tombol checkout.
- **Micro-Interactions**:
  - Animasi transisi halus pada penambahan kuantitas pesanan, drawer slide-up, dan efek partikel confetti saat pesanan berhasil lunas.

---

## 2. State Management & Compound Item Modeling

### 2.1 Zustand Store (`store/useCartStore.ts`)
- **Compound Item Identifier**:
  - Untuk membedakan menu yang sama dengan varian berbeda (misal: *Kopi Susu Aren dingin less sugar* vs *Kopi Susu Aren panas double shot*), sistem menghasilkan compound ID:
    ```typescript
    const compoundId = `${menu.id}-${sortedModifiers.map(m => m.option_id).join("_")}`;
    ```
- **Local Persistence & Hydration**:
  - Sinkronisasi keranjang ke `localStorage` dengan penanganan safe hydration agar tidak terjadi *hydration mismatch* antara server-rendered HTML dan client state.

---

## 3. Real-Time Cloud Database & Resiliency

### 3.1 Firebase Firestore Real-Time Listeners (`hooks/useKitchenOrders.ts`)
- **Snapshot Synchronization**:
  - Barista dan pelanggan terhubung secara pasif (*real-time passive sync*) menggunakan Firestore `onSnapshot`.
  - Latensi pembaruan status antara dapur yang menekan tombol "Pesanan Siap" dan layar pelanggan yang berbunyi bel kurang dari 500ms.
- **Query Optimization**:
  - Pengambilan data pesanan dibatasi pada pesanan aktif dan disortir berdasarkan waktu pembuatan (`created_at descending`).

### 3.2 In-Memory Resilience Fallback Pattern (`lib/order-store.ts`)
- **Zero-Downtime Local Development**:
  - Jika pengguna belum mengonfigurasi Firebase credentials di `.env.local`, sistem secara cerdas beralih ke singleton in-memory map.
  - Memastikan demo produk, pelatihan staf, dan review aplikasi dapat berjalan 100% tanpa hambatan koneksi cloud.

---

## 4. Payment Gateway & Webhook Security

### 4.1 Midtrans Snap API Engine (`lib/midtrans.ts`)
- **Token Generation**:
  - Menghasilkan Snap Token aman dengan payload transaksi terperinci (rincian item, data pelanggan, dan gross amount).
- **QRIS Sandbox Simulator**:
  - Simulator QRIS lokal yang memungkinkan developer dan kasir mensimulasikan pembayaran instan tanpa memotong saldo dompet asli.

### 4.2 Webhook Signature & Security
- **HMAC SHA-512 Signature Verification**:
  - Verifikasi keamanan pada endpoint `/api/midtrans/notification`:
    $$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$
  - Mencegah penyerang mengirimkan status bayar palsu.

---

## 5. Hardware Integration: ESC/POS Thermal Printing

### 5.1 Text Layout Formatter (`lib/thermal-printer.ts`)
- **Column Justification Engine**:
  - Menghitung lebar karakter per baris untuk kertas 58mm (32 kolom) dan 80mm (48 kolom).
  - Fungsi `justify(leftText, rightText)` memastikan nama menu berada di kiri dan harga rata kanan dengan spasi presisi.

### 5.2 Protokol Koneksi Printer
- **Web Bluetooth API**: Komunikasi langsung dari browser ke printer Bluetooth thermal kasir menggunakan protokol GATT profile.
- **RawBT URI Scheme**: Pengiriman perintah raw ESC/POS ke driver aplikasi RawBT di perangkat Android kasir.
- **Browser Native Print Driver**: Fallback styling CSS `@media print` untuk mencetak nota kasir via USB atau dialog cetak sistem operasi.

---

## 6. Web Audio API & Sound Synthesis

### 6.1 Sintesis Suara Tanpa File Eksternal (`lib/utils.ts`)
- **Audio Context Chime Generator**:
  - Menghasilkan audio bel dapur (kitchen order chime) dan notifikasi pesanan siap menggunakan osilator frekuensi gelombang sinus (*sine wave oscillator*).
  - Tidak membutuhkan dependensi file `.mp3` eksternal yang rentan gagal dimuat (*broken link*) pada jaringan lambat.
  - Melakukan pre-unlock audio context pada interaksi pertama pengguna untuk mematuhi kebijakan autoplay browser modern.

---

## 7. Panduan Debugging & Troubleshooting

### Problem 1: Suara Notifikasi Dapur Tidak Bunyi
- **Penyebab**: Browser memblokir audio otomatis (*Autoplay Policy*) jika belum ada interaksi pengguna pada halaman.
- **Solusi**: Klik salah satu tombol di layar (misal tombol *Toggle Sound* di header KDS) untuk mengaktifkan `AudioContext`.

### Problem 2: Status Pesanan Tidak Berubah di Meja Pelanggan
- **Penyebab**: Koneksi internet terputus atau mode in-memory store aktif pada proses node berbeda.
- **Solusi**: Pastikan membuka aplikasi di browser yang sama atau lengkapi kredensial Firebase di `.env.local` untuk sinkronisasi multi-perangkat.

### Problem 3: Format Struk Thermal Terpotong
- **Penyebab**: Pengaturan lebar kertas printer tidak sesuai (misal menggunakan setting 80mm pada printer 58mm).
- **Solusi**: Ubah opsi `paperWidth` pada dialog cetak ke format `58mm`.
