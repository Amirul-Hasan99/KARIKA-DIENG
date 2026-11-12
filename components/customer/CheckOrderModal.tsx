"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/lib/utils";
import Flaticon from "@/components/ui/Flaticon";

interface CheckOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTableNumber?: string;
}

export default function CheckOrderModal({
  isOpen,
  onClose,
  currentTableNumber,
}: CheckOrderModalProps) {
  const router = useRouter();
  const recentOrders = useCartStore((s) => s.recentOrders);
  const lastActiveOrderId = useCartStore((s) => s.lastActiveOrderId);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchError, setSearchError] = useState("");

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) {
      setSearchError("Masukkan nomor pesanan, ID pembeli, atau nomor meja.");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setSearchResults(null);

    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.orders || []);
        if ((data.orders || []).length === 0) {
          setSearchError("Tidak ditemukan pesanan dengan kata kunci tersebut.");
        }
      } else {
        setSearchError("Gagal mencari pesanan. Silakan coba lagi.");
      }
    } catch (err) {
      console.error("Search error:", err);
      setSearchError("Terjadi kendala koneksi saat mencari pesanan.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleGoToOrder = (orderId: string) => {
    onClose();
    router.push(`/orders/${orderId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
              <Flaticon name="receipt" className="text-lg" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Cek &amp; Pantau Pesanan
              </h3>
              <p className="text-xs text-slate-500">
                Lacak status pesanan Anda yang sedang diproses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <Flaticon name="cross" className="text-sm" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1">
          {/* Section 1: Search form */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Cari Berdasarkan No. Pesanan / ID / Meja
            </label>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Flaticon name="search" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Contoh: GC-260918-..., CUST-..., atau 05"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-95 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition disabled:opacity-50 shrink-0"
              >
                {isSearching ? "Mencari..." : "Cari"}
              </button>
            </form>

            {searchError && (
              <p className="mt-2 text-xs text-rose-600 flex items-center gap-1">
                <Flaticon name="exclamation" className="text-xs shrink-0" />
                {searchError}
              </p>
            )}

            {/* Search Results list */}
            {searchResults && searchResults.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-slate-500">
                  Hasil Pencarian ({searchResults.length}):
                </p>
                {searchResults.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => handleGoToOrder(ord.id)}
                    className="group flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                          #{ord.order_number}
                        </span>
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          Meja {ord.table_number}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {ord.order_status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium">
                        Pemesan: {ord.customer_name} • {formatRupiah(ord.total_amount)}
                      </p>
                    </div>
                    <button className="flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow-2xs group-hover:bg-amber-600 transition shrink-0">
                      Buka <Flaticon name="arrow-right" className="text-[10px]" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: Recent Orders on This Device */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Flaticon name="time-fast" className="text-xs text-amber-500" />
                Pesanan Terakhir di Perangkat Ini
              </h4>
              {recentOrders && recentOrders.length > 0 && (
                <span className="text-[11px] text-slate-500 font-medium">
                  {recentOrders.length} tersimpan
                </span>
              )}
            </div>

            {(!recentOrders || recentOrders.length === 0) ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                <Flaticon name="box-alt" className="text-2xl text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Belum ada riwayat pesanan di perangkat ini
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pesanan yang Anda buat melalui meja akan otomatis tersimpan di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((ro) => {
                  const isLastActive = ro.id === lastActiveOrderId;
                  return (
                    <div
                      key={ro.id}
                      onClick={() => handleGoToOrder(ro.id)}
                      className={`group flex items-center justify-between p-3 sm:p-3.5 rounded-xl border cursor-pointer transition ${
                        isLastActive
                          ? "border-amber-300 bg-amber-50/40 shadow-xs ring-1 ring-amber-300"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900">
                            #{ro.orderNumber}
                          </span>
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                            Meja {ro.tableNumber}
                          </span>
                          {isLastActive && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 animate-pulse">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block" /> Sedang Aktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="font-semibold text-slate-800">
                            {formatRupiah(ro.totalAmount)}
                          </span>
                          <span>•</span>
                          <span>
                            {new Date(ro.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 text-amber-600 font-bold text-xs group-hover:translate-x-0.5 transition-transform">
                        <span>Pantau</span>
                        <Flaticon name="arrow-right" className="text-xs" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 px-5 py-3 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            QR Code status pesanan juga tersedia di struk kasir.
          </p>
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-200 hover:bg-slate-300 px-3.5 py-1.5 text-xs font-bold text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
