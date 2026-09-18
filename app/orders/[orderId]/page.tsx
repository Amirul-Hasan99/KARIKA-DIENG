"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types";
import { formatRupiah, formatOrderTime, playCustomerNotificationSound } from "@/lib/utils";
import { printReceiptViaBrowser } from "@/lib/thermal-printer";
import { useCartStore } from "@/store/useCartStore";
import confetti from "canvas-confetti";
import {
  Clock,
  CheckCircle,
  ChefHat,
  Coffee,
  Utensils,
  Receipt,
  ArrowLeft,
  QrCode,
  Sparkles,
  Bell,
  BellOff,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Flame,
} from "lucide-react";

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.orderId as string;
  const setActiveOrder = useCartStore((s) => s.setActiveOrder);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [notificationToast, setNotificationToast] = useState<{
    title: string;
    message: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  const prevStatusRef = useRef<OrderStatus | null>(null);

  // Helper to handle status changes and notify the customer
  const handleStatusNotification = (newStatus: OrderStatus, prevStatus: OrderStatus | null) => {
    if (!prevStatus || prevStatus === newStatus) return;

    if (newStatus === "cooking") {
      if (soundEnabled) playCustomerNotificationSound("cooking");
      setNotificationToast({
        title: "☕ Pesanan Mulai Diracik & Dimasak!",
        message: "Barista sedang menyeduh kopi dan koki dapur sedang memasak snack Anda.",
        type: "info",
      });
    } else if (newStatus === "ready") {
      if (soundEnabled) playCustomerNotificationSound("ready");
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      setNotificationToast({
        title: "🎉 HORE! Pesanan Anda Sudah JADI!",
        message: "Semua hidangan sudah siap! Silakan ambil di counter bar atau tunggu diantar.",
        type: "success",
      });
    } else if (newStatus === "completed") {
      if (soundEnabled) playCustomerNotificationSound("completed");
      setNotificationToast({
        title: "✅ Pesanan Telah Selesai",
        message: "Pesanan telah diserahkan. Selamat menikmati santapan Anda!",
        type: "info",
      });
    }

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setNotificationToast(null);
    }, 6000);
  };

  // Firestore real-time listener with fallback
  useEffect(() => {
    if (!orderId) return;

    let unsubscribe: () => void = () => {};

    try {
      const orderDocRef = doc(db, "orders", orderId);
      unsubscribe = onSnapshot(
        orderDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Order;
            const fullOrder = { ...data, id: snap.id };

            if (prevStatusRef.current && prevStatusRef.current !== fullOrder.order_status) {
              handleStatusNotification(fullOrder.order_status, prevStatusRef.current);
            }
            prevStatusRef.current = fullOrder.order_status;

            setOrder(fullOrder);
            setIsLoading(false);
            setActiveOrder({
              id: fullOrder.id,
              orderNumber: fullOrder.order_number,
              tableNumber: fullOrder.table_number,
              totalAmount: fullOrder.total_amount,
            });
          }
        },
        async (error) => {
          console.warn("Firestore onSnapshot error, falling back to polling:", error);
          fetchOrderFallback();
        }
      );
    } catch (e) {
      console.warn("Firestore listener setup failed:", e);
      fetchOrderFallback();
    }

    // Polling fallback every 2.5 seconds
    const interval = setInterval(fetchOrderFallback, 2500);

    async function fetchOrderFallback() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            const fetchedOrder: Order = data.order;

            if (prevStatusRef.current && prevStatusRef.current !== fetchedOrder.order_status) {
              handleStatusNotification(fetchedOrder.order_status, prevStatusRef.current);
            }
            prevStatusRef.current = fetchedOrder.order_status;

            setOrder(fetchedOrder);
            setIsLoading(false);
            setActiveOrder({
              id: fetchedOrder.id,
              orderNumber: fetchedOrder.order_number,
              tableNumber: fetchedOrder.table_number,
              totalAmount: fetchedOrder.total_amount,
            });
          }
        }
      } catch (err) {
        console.error("Order polling error:", err);
      }
    }

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [orderId, soundEnabled]);

  const handleCopyCustomerId = (id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-amber-500 border-t-transparent mb-3" />
        <p className="text-xs font-bold text-slate-700">Memuat status pesanan Anda...</p>
        <p className="text-[11px] text-slate-400 mt-1">Sinkronisasi data dapur realtime</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center text-slate-900">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-400 mb-4 shadow-sm">
          <Clock className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <h2 className="text-base font-bold text-slate-800">Pesanan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Nomor ID pesanan mungkin tidak valid atau belum tersimpan di sistem.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600 transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    );
  }

  // Determine active buyer ID
  const buyerId = order.customer_id || `CUST-${order.table_number}-${order.order_number.slice(-4)}`;

  // Sequential Order Flow Steps
  const stages = [
    {
      key: "received",
      stepNumber: "1",
      title: "Pesanan Diterima (Antrean)",
      subtitle: "Pesanan masuk antrean barista & dapur",
      explanation: "Pembayaran QRIS telah terverifikasi lunas. Tiket pesanan otomatis terkirim dan masuk antrean pengerjaan barista dan koki dapur.",
      isDone: ["cooking", "ready", "completed"].includes(order.order_status),
      isActive: order.order_status === "received",
      icon: Receipt,
      accentColor: "text-amber-600 bg-amber-50 border-amber-300",
    },
    {
      key: "cooking",
      stepNumber: "2",
      title: "Sedang Diseduh & Dimasak",
      subtitle: "Barista & koki sedang meracik menu",
      explanation: "Barista sedang aktif menggiling biji kopi pilihan dan menyeduh minuman Anda, koki dapur sedang menggoreng camilan Anda hangat-hangat!",
      isDone: ["ready", "completed"].includes(order.order_status),
      isActive: order.order_status === "cooking",
      icon: Coffee,
      accentColor: "text-sky-600 bg-sky-50 border-sky-300",
    },
    {
      key: "ready",
      stepNumber: "3",
      title: "Pesanan Jadi & Siap Diambil!",
      subtitle: "Silakan ambil di counter bar",
      explanation: "Kopi dan snack Anda sudah selesai disajikan dengan sempurna! Silakan menuju counter barista dengan menyebutkan ID Pembeli Anda, atau tunggu pesanan diantar langsung ke meja.",
      isDone: order.order_status === "completed",
      isActive: order.order_status === "ready",
      icon: Sparkles,
      accentColor: "text-emerald-600 bg-emerald-50 border-emerald-300",
    },
    {
      key: "completed",
      stepNumber: "4",
      title: "Pesanan Selesai",
      subtitle: "Telah disajikan ke pelanggan",
      explanation: "Semua hidangan telah diserahkan. Terima kasih telah memesan, selamat menikmati santapan Anda!",
      isDone: order.order_status === "completed",
      isActive: order.order_status === "completed",
      icon: CheckCircle2,
      accentColor: "text-slate-600 bg-slate-50 border-slate-300",
    },
  ];

  const currentStageIndex = stages.findIndex((s) => s.key === order.order_status);
  const currentStage = stages[currentStageIndex >= 0 ? currentStageIndex : 0];
  const progressPercent =
    order.order_status === "completed"
      ? 100
      : order.order_status === "ready"
      ? 75
      : order.order_status === "cooking"
      ? 50
      : 25;

  return (
    <main className="min-h-screen bg-slate-100/70 pb-20 text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href={`/table/${order.table_id}`}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            <span>Pesan Menu Lain</span>
          </Link>

          <div className="flex items-center gap-2">
            {/* Sound chime toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playCustomerNotificationSound("cooking");
              }}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border transition ${
                soundEnabled
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-400 border-slate-200"
              }`}
              title={soundEnabled ? "Notifikasi Suara Aktif" : "Notifikasi Suara Mati"}
            >
              {soundEnabled ? (
                <>
                  <Bell className="h-3 w-3 text-amber-600 animate-bounce" />
                  <span>Suara: ON</span>
                </>
              ) : (
                <>
                  <BellOff className="h-3 w-3" />
                  <span>Suara: OFF</span>
                </>
              )}
            </button>

            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              MEJA {order.table_number}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Notification Toast Alert */}
      {notificationToast && (
        <div className="fixed top-14 inset-x-4 z-50 mx-auto max-w-md animate-in fade-in slide-in-from-top-4 duration-300">
          <div
            className={`rounded-2xl p-4 shadow-2xl border flex items-start gap-3 ${
              notificationToast.type === "success"
                ? "bg-emerald-600 text-white border-emerald-700"
                : "bg-slate-900 text-white border-slate-800"
            }`}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5 text-amber-300" />
            </div>
            <div className="flex-1">
              <h4 className="text-xs font-black tracking-wide">{notificationToast.title}</h4>
              <p className="text-[11px] text-white/90 mt-0.5 leading-snug">{notificationToast.message}</p>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-lg p-4 space-y-4">
        {/* 0. PENDING CASH NOTICE BANNER */}
        {order.payment_type === "cash" && order.payment_status === "pending" && (
          <div className="rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-4.5 text-emerald-950 shadow-md">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold text-xl shadow-sm">
                💵
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-sm font-black text-emerald-900">
                    Menunggu Pembayaran di Kasir
                  </h3>
                  <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    Tunai (Cash)
                  </span>
                </div>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  Silakan menuju meja kasir dan sebutkan <strong>ID Pembeli ({buyerId})</strong> atau <strong>Meja {order.table_number}</strong>.
                </p>
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-white/70 px-3 py-2 border border-emerald-200 text-xs">
                  <span className="text-emerald-800 font-medium">Total Tagihan:</span>
                  <span className="text-base font-black text-emerald-950">
                    {formatRupiah(order.total_amount)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-700 mt-1.5 font-medium">
                  ⚡ Setelah kasir mengonfirmasi, pesanan Anda akan otomatis diteruskan ke barista!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick SLA & Service Indicator */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs shadow-xs">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-slate-500">Estimasi Jadi:</span>
            <span className="font-bold text-slate-900">
              {order.order_status === "ready" || order.order_status === "completed"
                ? "Sudah Siap!"
                : "± 8 - 12 Menit"}
            </span>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200">
            Dine-In • Meja {order.table_number}
          </span>
        </div>

        {/* 1. KARTU IDENTITAS PEMBELI & NOMOR PESANAN */}
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-5 text-white shadow-md shadow-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/20 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-100">
                Kartu Pesanan Pelanggan
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-100">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatOrderTime(order.created_at)}</span>
            </div>
          </div>

          {/* Prominent Buyer ID */}
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/15 backdrop-blur-md p-3.5 border border-white/20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-100">
                ID Pembeli Anda
              </p>
              <p className="text-xl sm:text-2xl font-mono font-black tracking-tight text-white mt-0.5">
                {buyerId}
              </p>
              <p className="text-[10px] text-amber-100/90 mt-0.5">
                Pemesan: <strong className="text-white">{order.customer_name || "Pelanggan"}</strong> • Meja {order.table_number}
              </p>
            </div>

            <button
              onClick={() => handleCopyCustomerId(buyerId)}
              className="flex items-center gap-1 rounded-xl bg-white/25 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-white/35 active:scale-95 transition"
              title="Salin ID Pembeli"
            >
              {copiedId ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-300" />
                  <span className="text-[10px]">Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="text-[10px]">Salin</span>
                </>
              )}
            </button>
          </div>

          <p className="mt-2.5 text-[11px] text-amber-100 leading-snug">
            💡 Tunjukkan <strong>ID Pembeli ({buyerId})</strong> kepada barista saat mengambil hidangan di counter bar.
          </p>
        </div>

        {/* 2. LIVE STATUS CARD: SEDANG DIAPAKAN PESANAN ANDA? */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700">
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                Live Kitchen Dispatch
              </span>
              <h2 className="mt-1.5 text-lg sm:text-xl font-black text-slate-900">
                {order.order_status === "ready"
                  ? "Pesanan Jadi & Siap Diambil! 🎉"
                  : order.order_status === "cooking"
                  ? "Sedang Diseduh & Dimasak 🔥"
                  : order.order_status === "completed"
                  ? "Pesanan Telah Selesai ✅"
                  : "Pesanan Masuk di Antrean Dapur 📋"}
              </h2>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              {order.order_status === "cooking" ? (
                <Coffee className="h-6 w-6 animate-pulse" />
              ) : order.order_status === "ready" ? (
                <Sparkles className="h-6 w-6 text-emerald-600" />
              ) : order.order_status === "completed" ? (
                <CheckCircle2 className="h-6 w-6 text-slate-600" />
              ) : (
                <Receipt className="h-6 w-6" />
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-500">Progres Pemrosesan</span>
              <span className="font-mono text-amber-600">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Live Explanation Box */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-black text-slate-900">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span>Status Terkini: {currentStage.title}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              {currentStage.explanation}
            </p>
          </div>

          {/* Runtut 4-Stage Stepper */}
          <div className="pt-2 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Alur Runtut Proses Dapur
            </h4>

            <div className="space-y-3">
              {stages.map((stage, idx) => {
                const Icon = stage.icon;
                return (
                  <div key={stage.key} className="flex items-start gap-3">
                    {/* Step badge indicator */}
                    <div className="relative flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-black transition-all ${
                          stage.isDone
                            ? "border-emerald-500 bg-emerald-500 text-white shadow-xs"
                            : stage.isActive
                            ? "border-amber-500 bg-amber-500 text-white shadow-md shadow-amber-500/30 scale-110 animate-pulse"
                            : "border-slate-200 bg-slate-100 text-slate-400"
                        }`}
                      >
                        {stage.isDone ? (
                          <CheckCircle2 className="h-4 w-4" strokeWidth={2.5} />
                        ) : (
                          <span>{stage.stepNumber}</span>
                        )}
                      </div>
                      {idx < stages.length - 1 && (
                        <div
                          className={`my-1 h-6 w-0.5 transition-colors ${
                            stage.isDone ? "bg-emerald-500" : "bg-slate-200"
                          }`}
                        />
                      )}
                    </div>

                    {/* Step details */}
                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <p
                          className={`text-xs font-bold ${
                            stage.isActive
                              ? "text-amber-700"
                              : stage.isDone
                              ? "text-slate-900"
                              : "text-slate-400"
                          }`}
                        >
                          {stage.title}
                        </p>
                        {stage.isActive && (
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 uppercase tracking-wide">
                            Sedang Berlangsung
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{stage.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 3. RINCIAN MENU & STRUK PESANAN */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <Utensils className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
              <span>Rincian Menu Kopi &amp; Snack</span>
            </h3>
            <span className="font-mono text-xs font-bold text-slate-700">
              {order.order_number}
            </span>
          </div>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">
                    {item.qty}x {item.name}
                  </p>
                  {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                    <div className="mt-0.5 space-y-0.5 pl-2">
                      {item.selected_modifiers.map((mod, mIdx) => (
                        <p key={mIdx} className="text-[11px] text-slate-500">
                          • {mod.option_name}
                          {mod.price_modifier > 0 && (
                            <span className="text-amber-700 font-medium ml-1">
                              (+{formatRupiah(mod.price_modifier)})
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                  )}
                  {item.notes && (
                    <p className="text-[10px] text-slate-400 italic mt-0.5 pl-2">
                      Catatan: &ldquo;{item.notes}&rdquo;
                    </p>
                  )}
                </div>

                <span className="font-bold text-slate-900 font-mono">
                  {formatRupiah(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Metode Pembayaran</span>
              <span className="font-bold uppercase text-slate-800">
                {order.payment_type || "QRIS / MIDTRANS"}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Status Pembayaran</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 uppercase">
                <CheckCircle2 className="h-3 w-3" />
                Lunas ({order.payment_status})
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
              <span>Total Pembayaran</span>
              <span className="text-base text-amber-600 font-black font-mono">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Thermal Receipt Print button */}
          <button
            onClick={() => printReceiptViaBrowser(order)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-98 transition cursor-pointer"
          >
            <Receipt className="h-4 w-4 text-slate-600" strokeWidth={1.75} />
            <span>Cetak Struk Pembayaran / Bukti Transaksi</span>
          </button>
        </div>
      </div>
    </main>
  );
}
