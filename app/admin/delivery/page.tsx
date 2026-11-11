"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Flaticon } from "@/components/ui/Flaticon";
import { Order } from "@/types";

const deliveries: Record<string, string> = {
  pending: "Menunggu diproses",
  assigned: "Kurir ditugaskan",
  picked_up: "Dalam perjalanan",
  delivered: "Terkirim",
  failed_attempt: "Pengantaran tertunda",
};
const payments: Record<string, string> = {
  pending: "Menunggu pembayaran",
  settlement: "Lunas",
  failed: "Gagal",
  expire: "Kedaluwarsa",
};
const money = (v: number) => `Rp${v.toLocaleString("id-ID")}`;

export default function AdminDeliveryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/orders", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Tidak dapat memuat pesanan.");
      setOrders(d.orders || []);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Terjadi gangguan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 10000);
    return () => clearInterval(t);
  }, [refresh]);

  async function setStatus(order: Order, status: string) {
    const r = await fetch(`/api/orders/${encodeURIComponent(order.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delivery_status: status }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Status tidak dapat disimpan.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? d.order : o)));
  }

  async function confirmCash(order: Order) {
    const r = await fetch("/api/orders/confirm-cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id }),
    });
    const d = await r.json();
    if (!r.ok) {
      setError(d.error || "Pembayaran belum dapat dikonfirmasi.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? d.order : o)));
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-4 py-8 text-[#292a23] sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-[#77766f] hover:text-black transition"
            >
              <Flaticon name="arrow-left" className="text-xs" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Pesanan &amp; Pengiriman Dieng</h1>
            <p className="mt-1 text-sm text-[#77766f]">
              Pantau pembayaran QRIS/COD, koordinat pin Google Maps, dan status pengantaran kurir.
            </p>
          </div>
          <button
            onClick={() => void refresh()}
            className="inline-flex items-center gap-2 rounded-xl border border-[#e4e1d7] bg-white px-4 py-2.5 text-sm font-semibold hover:bg-[#f8f7f2] transition cursor-pointer"
          >
            <Flaticon name="refresh" className="text-xs" />
            <span>Muat Ulang</span>
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700 font-medium">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="rounded-2xl border border-[#e8e6df] bg-white p-6 text-sm text-[#77766f]">
              Memuat daftar pesanan…
            </p>
          ) : orders.length === 0 ? (
            <p className="rounded-2xl border border-[#e8e6df] bg-white p-6 text-sm text-[#77766f]">
              Belum ada pesanan masuk.
            </p>
          ) : (
            orders.map((order) => (
              <article
                key={order.id}
                className="rounded-3xl border border-[#e8e6df] bg-white p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      {order.order_number}
                    </span>
                    <h2 className="mt-2 text-lg font-bold text-[#24251f]">
                      {order.customer_name || "Pembeli"}
                    </h2>
                    <p className="text-xs text-[#77766f]">
                      Kontak: <strong>{order.customer_phone || "Nomor tidak tersedia"}</strong>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        order.payment_status === "settlement"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {payments[order.payment_status] || order.payment_status}
                    </span>
                    <span className="rounded-full bg-[#f2f0e8] px-3 py-1 text-xs font-bold">
                      {order.payment_type === "cod" ? "COD" : "QRIS"}
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 border-t border-[#efeee9] pt-4 sm:grid-cols-[1fr_auto]">
                  <div className="flex gap-3">
                    <Flaticon name="marker" variant="sr" className="mt-0.5 text-base text-[#938126]" />
                    <div>
                      <p className="text-sm font-medium leading-relaxed">
                        {order.delivery_address || "Alamat belum tercatat"}
                      </p>
                      {order.coordinates && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-[#77766f]">
                          <span>
                            {order.coordinates.lat}, {order.coordinates.lng} · {order.delivery_distance_km} km dari Titik 0
                          </span>
                          <a
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-[#655700] hover:underline"
                            href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`}
                          >
                            <Flaticon name="arrow-up-right-from-square" className="text-xs" />
                            <span>Buka di Google Maps</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <p className="text-xs text-[#77766f]">Total Pesanan</p>
                    <p className="mt-0.5 text-lg font-bold text-[#24251f]">{money(order.total_amount)}</p>
                    <p className="mt-0.5 text-xs text-[#77766f]">
                      {order.items.reduce((n, i) => n + i.qty, 0)} paket
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-[#efeee9] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#57564d]">
                    <Flaticon name="truck-side" variant="sr" className="text-sm text-[#82700a]" />
                    <span>Tahap Pengiriman:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {order.payment_type === "cod" && order.payment_status !== "settlement" && (
                      <button
                        onClick={() => void confirmCash(order)}
                        className="rounded-xl bg-[#292a23] hover:bg-black px-3.5 py-2 text-xs font-bold text-white transition"
                      >
                        Konfirmasi Tunai Diterima
                      </button>
                    )}
                    <select
                      aria-label="Status pengiriman"
                      value={order.delivery_status || "pending"}
                      onChange={(e) => void setStatus(order, e.target.value)}
                      className="rounded-xl border border-[#e4e1d7] bg-white px-3.5 py-2 text-xs font-bold outline-none focus:border-[#b69b00]"
                    >
                      {Object.entries(deliveries).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
