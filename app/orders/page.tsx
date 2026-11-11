"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const deliveryStatusMap: Record<
  string,
  { label: string; desc: string; step: number; color: string }
> = {
  pending: {
    label: "Menunggu Konfirmasi Toko",
    desc: "Pesanan Anda telah diterima dan sedang dipersiapkan oleh toko.",
    step: 1,
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  assigned: {
    label: "Kurir Ditugaskan",
    desc: "Kurir telah menerima pesanan dan bersiap menuju lokasi Anda.",
    step: 2,
    color: "bg-blue-100 text-blue-900 border-blue-300",
  },
  picked_up: {
    label: "Kurir Dalam Perjalanan (Otw Dieng)",
    desc: "Kurir sedang menuju penginapan/villa Anda di kawasan Dieng.",
    step: 3,
    color: "bg-purple-100 text-purple-900 border-purple-300",
  },
  delivered: {
    label: "Pesanan Telah Tiba",
    desc: "Pesanan telah sukses diantarkan dan diterima.",
    step: 4,
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  failed_attempt: {
    label: "Pengantaran Tertunda",
    desc: "Kurir mencoba menghubungi Anda. Silakan hubungi nomor WhatsApp toko.",
    step: 2,
    color: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

const formatRupiah = (val: number) => `Rp${val.toLocaleString("id-ID")}`;

function OrdersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPhone = searchParams.get("phone") || searchParams.get("q") || "";

  const [phoneQuery, setPhoneQuery] = useState(initialPhone);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedOrder, setSavedOrder] = useState<any | null>(null);

  // Check localStorage for saved active order on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("karika_active_order");
      if (raw) {
        const parsed = JSON.parse(raw);
        setSavedOrder(parsed);
        // Pre-fill phone query if available and not yet set
        if (!phoneQuery && parsed.customerPhone) {
          setPhoneQuery(parsed.customerPhone);
        }
      }
    } catch {}
  }, []);

  // Auto-search if query param present
  useEffect(() => {
    if (initialPhone) {
      handleSearchSubmit(initialPhone);
    }
  }, [initialPhone]);

  const handleSearchSubmit = async (queryText?: string) => {
    const q = (queryText !== undefined ? queryText : phoneQuery).trim();
    if (!q) {
      setErrorMsg("Masukkan nomor WhatsApp pemesan atau nomor pesanan Anda.");
      return;
    }

    setIsSearching(true);
    setErrorMsg("");
    setResults(null);

    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal melakukan pencarian pesanan.");

      const foundOrders = [...(data.orders || [])];

      // Check localStorage for matches on this device
      try {
        const raw = localStorage.getItem("karika_active_order");
        if (raw) {
          const parsed = JSON.parse(raw);
          const cleanQ = q.replace(/\D/g, "");
          const cleanPhone = (parsed.customerPhone || "").replace(/\D/g, "");
          const normQ = cleanQ.startsWith("62") ? cleanQ.slice(2) : cleanQ.startsWith("0") ? cleanQ.slice(1) : cleanQ;
          const normPhone = cleanPhone.startsWith("62") ? cleanPhone.slice(2) : cleanPhone.startsWith("0") ? cleanPhone.slice(1) : cleanPhone;

          const isPhoneMatch =
            (cleanQ.length >= 4 && (cleanPhone.includes(cleanQ) || cleanQ.includes(cleanPhone))) ||
            (normQ.length >= 4 && normPhone.length >= 4 && (normPhone === normQ || normPhone.includes(normQ) || normQ.includes(normPhone)));
          const isNumMatch = parsed.orderNumber && parsed.orderNumber.toLowerCase().includes(q.toLowerCase());
          const isIdMatch = parsed.orderId && parsed.orderId.toLowerCase().includes(q.toLowerCase());

          if (isPhoneMatch || isNumMatch || isIdMatch) {
            const alreadyInList = foundOrders.some((o: any) => o.id === parsed.orderId || o.order_number === parsed.orderNumber);
            if (!alreadyInList) {
              foundOrders.unshift({
                id: parsed.orderId,
                order_number: parsed.orderNumber,
                customer_name: parsed.customerName || "Pelanggan",
                customer_phone: parsed.customerPhone || "",
                total_amount: parsed.totalAmount || 0,
                payment_status: parsed.paymentStatus || "pending",
                delivery_status: parsed.deliveryStatus || "pending",
                payment_type: parsed.paymentType || "qris",
                created_at: parsed.updatedAt || new Date().toISOString(),
              });
            }
          }
        }
      } catch {}

      setResults(foundOrders);
      if (foundOrders.length === 0) {
        setErrorMsg(
          "Tidak ditemukan pesanan dengan nomor tersebut. Pastikan nomor WhatsApp yang dimasukkan sama persis saat checkout."
        );
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kendala jaringan saat mencari pesanan.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#24251f] selection:bg-[#f4ce00] selection:text-black">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-[#e9e7dc] bg-[#f8f7f2]/95 backdrop-blur-md">
        <nav className="mx-auto flex h-[68px] max-w-5xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#292a23] text-[#f4ce00] shadow-xs">
              <BrandLogoIcon size={18} color="#f4ce00" />
            </span>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-[#24251f]">
                KARIKA<span className="text-[#90802a] ml-1">DIENG</span>
              </span>
              <span className="text-[10px] text-[#78776f] font-medium leading-none">
                Laman Pantau Pesanan
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/catalog">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-[#d9d6cb] bg-white text-xs font-bold hover:bg-[#faf9f5]"
              >
                <Flaticon name="shop" className="text-xs mr-1 text-[#90802a]" />
                <span>Katalog Produk</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Title Hero */}
        <div className="text-center max-w-2xl mx-auto">
          <Badge
            variant="outline"
            className="border-[#d5d1c2] bg-[#fdfcf7] text-[#867100] font-bold px-3 py-1 text-xs"
          >
            <Flaticon name="truck-side" className="text-xs mr-1.5" />
            Lacak Pesanan Oleh-Oleh Dieng
          </Badge>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl text-[#24251f] tracking-tight">
            Pantau Pesanan &amp; Pengantaran Anda
          </h1>
          <p className="mt-2.5 text-sm text-[#727168] leading-relaxed">
            Jika Anda menutup browser atau memuat ulang sistem, cukup masukkan nomor WhatsApp yang digunakan saat memesan untuk melihat status kurir dan tagihan Anda secara real-time.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="mt-8 rounded-3xl border border-[#e4e1d7] bg-white p-5 sm:p-7 shadow-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            className="space-y-3"
          >
            <label className="block text-xs font-bold uppercase tracking-wider text-[#79776f]">
              Nomor WhatsApp / Nomor Pesanan
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Flaticon
                  name="phone-call"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                />
                <input
                  type="text"
                  value={phoneQuery}
                  onChange={(e) => setPhoneQuery(e.target.value)}
                  placeholder="Contoh: 08123456789 atau ORD-..."
                  className="h-12 w-full rounded-2xl border border-[#d8d5c7] bg-[#faf9f5] pl-11 pr-4 text-sm font-semibold text-[#24251f] outline-none transition focus:border-[#90802a] focus:bg-white"
                />
              </div>
              <Button
                type="submit"
                disabled={isSearching}
                className="h-12 rounded-2xl bg-[#292a23] hover:bg-black px-6 text-sm font-bold text-white transition shadow-xs disabled:opacity-50"
              >
                {isSearching ? (
                  <>
                    <Flaticon name="spinner" className="text-sm animate-spin mr-2" />
                    <span>Mencari Pesanan...</span>
                  </>
                ) : (
                  <>
                    <Flaticon name="search" className="text-sm mr-2" />
                    <span>Cari Pesanan</span>
                  </>
                )}
              </Button>
            </div>
          </form>

          {errorMsg && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700">
              <Flaticon name="exclamation" className="text-sm shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Active Local Order Card (If saved on this browser) */}
        {savedOrder && !results && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#79776f] flex items-center gap-1.5">
                <Flaticon name="time-fast" className="text-xs text-[#90802a]" />
                Pesanan Terakhir di Perangkat Ini
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Tersimpan Otomatis
              </span>
            </div>

            <Card className="rounded-3xl border-[#d8d5c7] bg-gradient-to-br from-[#faf8ed] via-white to-[#fbfaf3] shadow-sm hover:shadow-md transition">
              <CardHeader className="p-5 sm:p-6 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-[#90802a]">
                      #{savedOrder.orderNumber}
                    </span>
                    <CardTitle className="text-base font-extrabold text-[#24251f] mt-0.5">
                      {savedOrder.customerName || "Pelanggan"}
                    </CardTitle>
                    <p className="text-xs text-[#78776f]">
                      WhatsApp: {savedOrder.customerPhone || "-"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#78776f] font-semibold block">Total</span>
                    <span className="text-base font-black text-[#24251f]">
                      {savedOrder.totalAmount ? formatRupiah(savedOrder.totalAmount) : "-"}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-5 sm:px-6 pb-5 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#eee9db]">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                    <span>Lacak Pengantaran</span>
                  </span>
                </div>

                <Link href={`/orders/${savedOrder.orderId}`}>
                  <Button className="w-full sm:w-auto rounded-xl bg-[#292a23] hover:bg-black font-bold text-xs px-5">
                    <span>Buka Laman Pantau &amp; QRIS</span>
                    <Flaticon name="arrow-right" className="text-xs ml-1.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search Results List */}
        {results && results.length > 0 && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-sm font-extrabold text-[#24251f]">
                Ditemukan {results.length} Pesanan:
              </h2>
              <span className="text-xs text-[#78776f]">
                Klik kartu untuk membuka pelacakan lengkap
              </span>
            </div>

            <div className="space-y-4">
              {results.map((ord) => {
                const delivery =
                  deliveryStatusMap[ord.delivery_status || "pending"] ||
                  deliveryStatusMap.pending;

                return (
                  <article
                    key={ord.id}
                    className="rounded-3xl border border-[#e4e1d7] bg-white p-5 sm:p-6 shadow-xs hover:shadow-md transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#efeee9] pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-black text-[#24251f]">
                            #{ord.order_number}
                          </span>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border ${delivery.color}`}
                          >
                            {delivery.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#78776f] mt-1 font-medium">
                          Pemesan: <strong className="text-[#24251f]">{ord.customer_name}</strong> •{" "}
                          WhatsApp: {ord.customer_phone}
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs font-black text-[#90802a] text-lg block">
                          {formatRupiah(ord.total_amount)}
                        </span>
                        <span className="text-[11px] text-[#78776f]">
                          Metode: {ord.payment_type === "cash" ? "Bayar Tunai (COD)" : "QRIS Midtrans"}
                        </span>
                      </div>
                    </div>

                    {/* Progress Steps */}
                    <div className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#24251f]">
                          Status Pengantaran:
                        </span>
                        <span className="text-xs text-[#78776f]">{delivery.desc}</span>
                      </div>

                      {/* 4-Step Progress Bar */}
                      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                        {[
                          { step: 1, label: "Toko" },
                          { step: 2, label: "Kurir" },
                          { step: 3, label: "Dalam Jalan" },
                          { step: 4, label: "Tiba" },
                        ].map((s) => {
                          const isDone = delivery.step >= s.step;
                          return (
                            <div key={s.step} className="space-y-1">
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  isDone ? "bg-emerald-500" : "bg-[#ebe8de]"
                                }`}
                              />
                              <p
                                className={`text-[10px] font-bold text-center ${
                                  isDone ? "text-emerald-800" : "text-slate-400"
                                }`}
                              >
                                {s.label}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Order Items Summary */}
                    {ord.items && ord.items.length > 0 && (
                      <div className="border-t border-[#efeee9] pt-3 pb-2 text-xs text-[#6e6c64]">
                        <span className="font-semibold text-[#24251f]">Rincian Paket: </span>
                        <span>
                          {ord.items.map((i: any) => `${i.qty}x ${i.name}`).join(", ")}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-between border-t border-[#efeee9] pt-4">
                      <p className="text-[11px] text-[#78776f]">
                        Alamat: {ord.delivery_address || "Area Penginapan Dieng (Radius 8 km)"}
                      </p>

                      <Link href={`/orders/${ord.id}`}>
                        <Button className="rounded-xl bg-[#292a23] hover:bg-black text-xs font-bold text-white px-4">
                          <span>Buka Pelacakan &amp; QRIS</span>
                          <Flaticon name="arrow-right" className="text-xs ml-1.5" />
                        </Button>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrdersIndexPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center p-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-[#e5a93c] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-neutral-600">Memuat Laman Pantau Pesanan...</p>
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

