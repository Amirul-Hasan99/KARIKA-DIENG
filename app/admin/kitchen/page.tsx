"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { Order, OrderStatus } from "@/types";
import { formatOrderTime, formatRupiah } from "@/lib/utils";
import { printReceiptViaBrowser } from "@/lib/thermal-printer";
import Flaticon from "@/components/ui/Flaticon";

export default function KitchenDashboardPage() {
  const {
    orders,
    isLoading,
    soundEnabled,
    setSoundEnabled,
    updateOrderStatus,
    playChime,
  } = useKitchenOrders();

  const [activeTab, setActiveTab] = useState<"all" | "received" | "cooking" | "ready" | "completed">("all");
  const [stationFilter, setStationFilter] = useState<"all" | "barista" | "kitchen">("all");
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});
  const [searchTable, setSearchTable] = useState("");
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Update clock every minute for elapsed time badges
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const toggleItemDone = (itemKey: string) => {
    setCompletedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const isDrinkItem = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.includes("kopi") ||
      lower.includes("coffee") ||
      lower.includes("espresso") ||
      lower.includes("latte") ||
      lower.includes("cappuccino") ||
      lower.includes("tea") ||
      lower.includes("teh") ||
      lower.includes("matcha") ||
      lower.includes("chocolate") ||
      lower.includes("brew") ||
      lower.includes("soda") ||
      lower.includes("americano") ||
      lower.includes("macchiato")
    );
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Must be paid settlement for kitchen
      if (order.payment_status !== "settlement") return false;

      const matchTab =
        activeTab === "all"
          ? order.order_status !== "completed"
          : order.order_status === activeTab;

      const matchSearch =
        searchTable === "" ||
        order.table_number.includes(searchTable) ||
        order.order_number.toLowerCase().includes(searchTable.toLowerCase());

      // Station filter: if barista, order must contain at least 1 drink; if kitchen, must contain at least 1 food
      let matchStation = true;
      if (stationFilter === "barista") {
        matchStation = order.items.some((item) => isDrinkItem(item.name));
      } else if (stationFilter === "kitchen") {
        matchStation = order.items.some((item) => !isDrinkItem(item.name));
      }

      return matchTab && matchSearch && matchStation;
    });
  }, [orders, activeTab, searchTable, stationFilter]);

  // Counts
  const counts = useMemo(() => {
    const settlementOrders = orders.filter((o) => o.payment_status === "settlement");
    return {
      all: settlementOrders.filter((o) => o.order_status !== "completed").length,
      received: settlementOrders.filter((o) => o.order_status === "received").length,
      cooking: settlementOrders.filter((o) => o.order_status === "cooking").length,
      ready: settlementOrders.filter((o) => o.order_status === "ready").length,
      completed: settlementOrders.filter((o) => o.order_status === "completed").length,
    };
  }, [orders]);

  // Elapsed time helper
  const getElapsedMinutes = (dateString: string) => {
    const created = new Date(dateString).getTime();
    if (isNaN(created)) return 0;
    return Math.max(0, Math.floor((currentTime - created) / 60000));
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "received":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-300">
            <Flaticon name="exclamation" className="text-xs" /> Pesanan Baru
          </span>
        );
      case "cooking":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-300">
            <Flaticon name="mug-hot-alt" className="text-xs" /> Sedang Diseduh / Dimasak
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            <Flaticon name="check" className="text-xs font-bold" /> Siap Disajikan
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
            Selesai
          </span>
        );
    }
  };

  const getNextStatus = (current: OrderStatus): { next: OrderStatus; label: string; iconName: string } | null => {
    switch (current) {
      case "received":
        return { next: "cooking", label: "1. Mulai Seduh & Masak", iconName: "mug-hot-alt" };
      case "cooking":
        return { next: "ready", label: "2. Pesanan Jadi (Siap Diambil)", iconName: "check" };
      case "ready":
        return { next: "completed", label: "3. Selesaikan Pesanan", iconName: "arrow-right" };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-3.5 py-2.5 sm:px-6 sm:py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
              title="Kembali ke Beranda"
            >
              <Flaticon name="arrow-left" className="text-sm" />
            </Link>

            <div className="hidden xs:flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20">
              <Flaticon name="mug-hot-alt" className="text-base text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                  <span className="sm:hidden">KDS Barista</span>
                  <span className="hidden sm:inline">KOPI &amp; SNACK - KITCHEN DISPLAY</span>
                </h1>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-emerald-700 border border-emerald-200 shrink-0">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate hidden xs:block">
                Realtime Kitchen &amp; Barista Dispatch
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Search Box */}
            <div className="relative w-28 xs:w-36 sm:w-52">
              <Flaticon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
              <input
                type="text"
                value={searchTable}
                onChange={(e) => setSearchTable(e.target.value)}
                placeholder="Cari Meja..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-7 pr-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Test Audio Chime Button */}
            <button
              onClick={() => playChime()}
              className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition"
              title="Uji Notifikasi Suara"
            >
              <Flaticon name="volume" className="text-xs text-amber-600" />
              <span>Tes Bel</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled((prev) => !prev)}
              className={`flex items-center gap-1 sm:gap-1.5 rounded-xl border px-2.5 py-1.5 sm:px-3 text-xs font-semibold transition ${
                soundEnabled
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-400"
              }`}
            >
              {soundEnabled ? (
                <Flaticon name="bell" className="text-xs text-emerald-600" />
              ) : (
                <Flaticon name="bell-ring" className="text-xs text-slate-400 opacity-50" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "all"
                ? "bg-amber-500 text-white shadow-xs shadow-amber-500/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Semua Aktif</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("received")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "received"
                ? "bg-amber-500 text-white shadow-xs shadow-amber-500/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Pesanan Baru</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
              {counts.received}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("cooking")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "cooking"
                ? "bg-sky-600 text-white shadow-xs shadow-sky-600/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Sedang Dimasak</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
              {counts.cooking}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ready")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "ready"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-600/30"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Siap Saji</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
              {counts.ready}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              activeTab === "completed"
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Riwayat Selesai</span>
            <span className="rounded-full bg-black/15 px-1.5 py-0.2 text-[10px]">
              {counts.completed}
            </span>
          </button>
        </div>

        {/* Station Filter Sub-Bar */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50 px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">
              Stasiun Kerja:
            </span>
            <div className="flex items-center gap-1 rounded-xl bg-white p-1 border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setStationFilter("all")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  stationFilter === "all"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📋 Semua Stasiun
              </button>
              <button
                type="button"
                onClick={() => setStationFilter("barista")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  stationFilter === "barista"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-amber-700"
                }`}
              >
                <Flaticon name="mug-hot-alt" className="text-xs" />
                <span>Barista (Minuman)</span>
              </button>
              <button
                type="button"
                onClick={() => setStationFilter("kitchen")}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  stationFilter === "kitchen"
                    ? "bg-orange-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-orange-700"
                }`}
              >
                <Flaticon name="restaurant" className="text-xs" />
                <span>Dapur (Snack/Makanan)</span>
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            💡 Klik baris menu pada tiket untuk menandai (coret) item yang sudah selesai diracik.
          </span>
        </div>
      </header>

      {/* Main Order Grid */}
      <main className="p-4 sm:p-6">
        {isLoading ? (
          <div className="grid grid-rows-2 grid-flow-col auto-cols-[88vw] xs:auto-cols-[360px] sm:auto-cols-auto gap-3.5 sm:gap-4 overflow-x-auto admin-order-scroll pb-4 sm:pb-0 sm:grid-rows-none sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 sm:overflow-visible">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white"
              />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 mb-3 shadow-xs">
              <Flaticon name="restaurant" className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Tiket Pesanan</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              {activeTab === "all"
                ? "Belum ada pesanan aktif. Tiket baru akan otomatis muncul saat pesanan masuk/dibayar."
                : `Tidak ada tiket dalam kategori ${activeTab}.`}
            </p>
          </div>
        ) : (
          <>
            {filteredOrders.length >= 2 && (
              <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-500 mb-2.5 px-1">
                <span className="flex items-center gap-1 font-bold text-amber-800">
                  <Flaticon name="restaurant" className="text-xs" />
                  <span>{filteredOrders.length} Tiket Pesanan</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full font-semibold shadow-2xs">
                  <span>2 Card ke bawah • Geser ke kanan</span>
                  <Flaticon name="arrow-right" className="text-[10px]" />
                </span>
              </div>
            )}
            <div
              className={`gap-3.5 sm:gap-4 pb-4 sm:pb-0 overflow-x-auto admin-order-scroll sm:overflow-visible snap-x snap-mandatory sm:snap-none ${
                filteredOrders.length >= 2
                  ? "grid grid-rows-2 grid-flow-col auto-cols-[88vw] xs:auto-cols-[360px] sm:auto-cols-auto sm:grid-rows-none sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              }`}
            >
              {filteredOrders.map((order) => {
                const nextAction = getNextStatus(order.order_status);
                const isNew = order.order_status === "received";
                const elapsedMinutes = getElapsedMinutes(order.created_at);

                // Elapsed time color
                const elapsedBadgeClass =
                  elapsedMinutes < 5
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : elapsedMinutes < 15
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-300 font-bold animate-pulse";

                return (
                  <div
                    key={order.id}
                    className={`flex flex-col justify-between rounded-2xl border bg-white p-3.5 sm:p-4 shadow-sm transition-all snap-start h-full ${
                      isNew
                        ? "border-amber-400 ring-2 ring-amber-400/20 ticket-urgent"
                        : order.order_status === "cooking"
                        ? "border-sky-300"
                        : "border-slate-200"
                    }`}
                  >
                  {/* Ticket Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-base font-black text-slate-900">
                          MEJA {order.table_number}
                        </span>
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-mono font-black text-amber-900 border border-amber-300">
                          ID: {order.customer_id || `CUST-${order.table_number}-${order.order_number.slice(-4)}`}
                        </span>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-600 font-semibold">
                        Pemesan: <strong className="text-slate-900">{order.customer_name || "Pelanggan"}</strong>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <Flaticon name="time-fast" className="text-xs" />
                          <span>{formatOrderTime(order.created_at)}</span>
                        </div>
                        <span className={`rounded px-1.5 py-0.2 text-[10px] border ${elapsedBadgeClass}`}>
                          {elapsedMinutes} mnt lalu
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[11px] font-bold text-slate-400">
                        #{order.order_number.slice(-6)}
                      </span>
                    </div>
                  </div>

                  {/* Items List with Interactive Strike-through Checklist */}
                  <div className="flex-1 space-y-2 py-3">
                    {order.items.map((item, idx) => {
                      const itemKey = `${order.id}-item-${idx}`;
                      const isDone = Boolean(completedItems[itemKey]);
                      const isDrink = isDrinkItem(item.name);

                      return (
                        <div
                          key={idx}
                          onClick={() => toggleItemDone(itemKey)}
                          className={`cursor-pointer rounded-xl border p-2.5 transition-all select-none ${
                            isDone
                              ? "bg-slate-100/90 border-slate-200 opacity-60 line-through"
                              : "bg-slate-50/80 border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/40"
                          }`}
                          title="Klik untuk menandai/mencoret item ini"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md text-[10px] border ${
                                  isDone
                                    ? "bg-emerald-600 text-white border-emerald-600"
                                    : "border-slate-300 bg-white text-transparent"
                                }`}
                              >
                                ✓
                              </span>
                              <span className="text-xs font-black text-slate-900 truncate">
                                {item.qty}x {item.name}
                              </span>
                            </div>
                            <span className="shrink-0 rounded px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200">
                              {isDrink ? "☕ Bar" : "🍟 Dapur"}
                            </span>
                          </div>

                          {/* Modifiers Highlight */}
                          {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                            <div className="mt-1 pl-5.5 space-y-0.5">
                              {item.selected_modifiers.map((mod, mIdx) => (
                                <div
                                  key={mIdx}
                                  className="flex items-center gap-1 text-[11px] font-bold text-amber-700"
                                >
                                  <span>•</span>
                                  <span>{mod.option_name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {item.notes && (
                            <p className="mt-1 pl-5.5 rounded bg-amber-100/70 px-2 py-0.5 text-[10px] italic text-amber-900 font-medium">
                              Note: {item.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Ticket Footer & Actions */}
                  <div className="border-t border-slate-100 pt-3 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Tagihan:</span>
                      <span className="font-bold text-slate-900">
                        {formatRupiah(order.total_amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Thermal Print Button */}
                      <button
                        onClick={() => printReceiptViaBrowser(order)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                        title="Cetak Struk Thermal (ESC/POS)"
                      >
                        <Flaticon name="print" className="text-sm" />
                      </button>

                      {/* Advance Order Status Button */}
                      {nextAction && (
                        <button
                          onClick={() => updateOrderStatus(order.id, nextAction.next)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-white shadow-xs active:scale-98 transition ${
                            order.order_status === "received"
                              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:brightness-105"
                              : order.order_status === "cooking"
                              ? "bg-emerald-600 hover:bg-emerald-700"
                              : "bg-slate-700 hover:bg-slate-800"
                          }`}
                        >
                          <Flaticon name={nextAction.iconName} className="text-xs" />
                          <span>{nextAction.label}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
