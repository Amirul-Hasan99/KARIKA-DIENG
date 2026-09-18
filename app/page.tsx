"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import CheckOrderModal from "@/components/customer/CheckOrderModal";
import {
  Coffee,
  ChefHat,
  QrCode,
  Smartphone,
  CreditCard,
  Printer,
  Sparkles,
  ArrowRight,
  Database,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  Clock,
} from "lucide-react";

export default function HomePage() {
  const [selectedTable, setSelectedTable] = useState("01");
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const [isCheckOrderOpen, setIsCheckOrderOpen] = useState(false);

  const lastActiveOrderId = useCartStore((s) => s.lastActiveOrderId);
  const lastActiveOrderNumber = useCartStore((s) => s.lastActiveOrderNumber);

  const tables = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0")
  );

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSeedMessage(`Katalog Kopi & Snack berhasil di-seed! (${data.menusCount} menu)`);
      } else {
        setSeedMessage(`Error: ${data.error}`);
      }
    } catch (e: any) {
      setSeedMessage(`Gagal seeding: ${e?.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Top Banner Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 px-3.5 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20">
              <Coffee className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                  KOPI &amp; SNACK
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200 shrink-0">
                  SELF-ORDER SYSTEM
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-[190px] xs:max-w-xs sm:max-w-none">
                Pemesanan Mandiri Meja, QRIS &amp; KDS
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCheckOrderOpen(true)}
              className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500 shrink-0" strokeWidth={2} />
              <span className="hidden xs:inline">Cek Pesanan</span>
              <span className="xs:hidden">Status</span>
              {lastActiveOrderId && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition shadow-2xs whitespace-nowrap"
            >
              <ChefHat className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 shrink-0" strokeWidth={1.75} />
              <span className="hidden sm:inline">Buka Panel Admin &amp; KDS</span>
              <span className="sm:hidden">Admin &amp; KDS</span>
            </Link>
          </div>
        </div>

        {/* Active Order Alert Banner */}
        {lastActiveOrderId && (
          <div className="border-t border-amber-500/20 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2.5 shadow-sm">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                </span>
                <span className="font-bold truncate">
                  Anda memiliki pesanan aktif {lastActiveOrderNumber ? `(#${lastActiveOrderNumber}) ` : ""}yang sedang diproses!
                </span>
              </div>
              <Link
                href={`/orders/${lastActiveOrderId}`}
                className="flex items-center gap-1 rounded-xl bg-white text-slate-900 font-bold px-3 py-1.5 text-xs shadow-xs hover:bg-amber-50 active:scale-95 transition shrink-0"
              >
                <span>Pantau Status</span>
                <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          {/* Left Column: Descriptions & Table Selector */}
          <div className="space-y-6 lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1 text-xs font-bold text-amber-800">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
              <span>Sistem Self-Order Coffee Shop &amp; Eatery</span>
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl leading-tight">
              Katalog Menu <br />
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                Kopi &amp; Aneka Snack
              </span>
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed max-w-xl">
              Pelanggan cukup scan QR di meja, pilih aneka kopi espresso, manual brew, non-coffee, dan snack gurih / manis favorit. Kustomisasi suhu, jenis susu, dan tingkat manis, lalu bayar menggunakan simulasi QRIS Midtrans yang otomatis masuk ke <strong>Panel Admin &amp; Kitchen Display</strong>.
            </p>

            {/* Interactive Table QR Simulator */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-amber-600" strokeWidth={1.75} />
                    <span>Pilih Nomor Meja Pelanggan</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih salah satu nomor meja untuk mencoba tampilan pemesanan pelanggan:
                  </p>
                </div>

                <span className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-mono font-bold text-amber-800">
                  Meja {selectedTable}
                </span>
              </div>

              {/* Table Grid Buttons */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {tables.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTable(t)}
                    className={`rounded-xl py-2 text-xs font-bold transition-all ${
                      selectedTable === t
                        ? "bg-amber-500 text-white shadow-xs font-black"
                        : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Meja {t}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <Link
                  href={`/table/table-${selectedTable}`}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 py-3.5 text-xs sm:text-sm font-black text-white shadow-sm shadow-amber-500/25 hover:brightness-105 active:scale-98 transition-all"
                >
                  <Smartphone className="h-4 w-4" strokeWidth={2} />
                  <span>Buka Menu Meja {selectedTable} (Katalog Pelanggan)</span>
                  <ArrowRight className="h-4 w-4 ml-1" strokeWidth={2} />
                </Link>
              </div>
            </div>

            {/* Database Seed Trigger */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <Database className="h-3.5 w-3.5 text-amber-600" strokeWidth={1.75} />
                <span>{isSeeding ? "Sedang Menyiapkan Data..." : "Seed Ulang Katalog Kopi & Snack"}</span>
              </button>

              {seedMessage && (
                <span className="text-xs font-medium text-emerald-600">
                  {seedMessage}
                </span>
              )}
            </div>
          </div>

          {/* Right Column: Feature Highlights */}
          <div className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-3.5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Fitur Utama Terintegrasi
              </h3>

              <div className="space-y-2.5">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <Coffee className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Katalog Kopi &amp; Snack Modern
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Espresso, Manual Brew, Non-Coffee, dan aneka Camilan Gurih &amp; Manis dengan opsi susu oat/almond dan saus cocolan.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <QrCode className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Simulasi Pembayaran QRIS Midtrans
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Tampilan kartu QRIS nasional dengan QR code tajam, countdown timer, dan tombol simulasi instan sandbox.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                    <ChefHat className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Panel Admin &amp; Kitchen Display (KDS)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Pesanan otomatis masuk ke panel admin secara realtime dilengkapi bel notifikasi, timer durasi, dan tombol status.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                    <Printer className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Cetak Struk Kasir &amp; Dapur
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                      Cetak struk belanja thermal format 58mm/80mm langsung melalui browser.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/admin"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-amber-400 hover:shadow-xs transition"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">Panel Admin</span>
                  <span className="text-[10px] text-slate-500">KDS &amp; Rekap Omzet</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              </Link>

              <Link
                href="/table/table-01"
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:border-amber-400 hover:shadow-xs transition"
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">Customer App</span>
                  <span className="text-[10px] text-slate-500">Pesan Meja 01</span>
                </div>
                <ExternalLink className="h-4 w-4 text-slate-400" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <CheckOrderModal
        isOpen={isCheckOrderOpen}
        onClose={() => setIsCheckOrderOpen(false)}
      />
    </main>
  );
}
