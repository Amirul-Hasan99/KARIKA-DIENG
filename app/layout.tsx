import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOPI & SNACK BAR - Self-Order Restaurant",
  description: "Aplikasi katalog menu & pemesanan mandiri kopi & aneka snack berbasis scan QR Meja dengan sistem simulasi pembayaran QRIS Midtrans dan Kitchen Display System.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f59e0b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const midtransClientKey =
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-sample-key";
  const snapScriptUrl =
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
        {children}
        {/* Midtrans Snap Script */}
        <Script
          src={snapScriptUrl}
          data-client-key={midtransClientKey}
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
