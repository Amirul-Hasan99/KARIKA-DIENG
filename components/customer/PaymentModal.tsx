"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/lib/utils";
import QrisDisplay from "./QrisDisplay";
import Flaticon from "@/components/ui/Flaticon";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess?: (result: any) => void;
          onPending?: (result: any) => void;
          onError?: (result: any) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentModal({ isOpen, onClose }: PaymentModalProps) {
  const router = useRouter();
  const {
    tableId,
    tableNumber,
    customerName,
    customerPhone,
    items,
    clearCart,
    getTotalAmount,
    setActiveOrder,
  } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [orderData, setOrderData] = useState<{
    orderId: string;
    orderNumber: string;
    customerId?: string;
    snapToken: string;
    redirectUrl?: string;
    isSimulated?: boolean;
    totalAmount: number;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"qris" | "cash">("qris");
  const [isCashSubmitting, setIsCashSubmitting] = useState(false);

  // Trigger QRIS checkout transaction if QRIS is selected and modal opens
  useEffect(() => {
    if (!isOpen || items.length === 0 || orderData || paymentMethod !== "qris") return;

    const processCheckout = async () => {
      setIsLoading(true);
      setErrorMsg("");

      try {
        const response = await fetch("/api/orders/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableId: tableId || "table-01",
            tableNumber: tableNumber || "01",
            customerName: customerName || "Pelanggan",
            customerPhone: customerPhone || "",
            paymentType: "qris",
            items,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Gagal memproses pesanan.");
        }

        const isMockToken = Boolean(
          data.isSimulated ||
            (data.snapToken && data.snapToken.startsWith("snap-token-"))
        );

        const total = data.totalAmount || getTotalAmount();
        setOrderData({
          orderId: data.orderId,
          orderNumber: data.orderNumber,
          customerId: data.customerId,
          snapToken: data.snapToken,
          redirectUrl: data.redirectUrl,
          isSimulated: isMockToken,
          totalAmount: total,
        });

        // Set persistent active order for tracking
        setActiveOrder({
          id: data.orderId,
          orderNumber: data.orderNumber,
          tableNumber: tableNumber || "01",
          totalAmount: total,
        });

        // Launch Midtrans Snap Popup only if real production/sandbox key is configured and not mock
        if (!isMockToken && typeof window !== "undefined" && window.snap && data.snapToken) {
          try {
            window.snap.pay(data.snapToken, {
              onSuccess: async () => {
                await triggerSimulatedSettlement(data.orderNumber, data.orderId);
                clearCart();
                router.push(`/orders/${data.orderId}`);
              },
              onPending: () => {
                clearCart();
                router.push(`/orders/${data.orderId}`);
              },
              onError: (err: any) => {
                console.error("Snap payment error:", err);
                setErrorMsg("Terjadi kendala pada pembayaran Midtrans.");
              },
              onClose: () => {
                console.log("Snap modal closed by customer.");
              },
            });
          } catch (snapErr) {
            console.warn("Snap.pay launch exception:", snapErr);
          }
        }
      } catch (err: any) {
        setErrorMsg(err?.message || "Koneksi pembayaran bermasalah.");
      } finally {
        setIsLoading(false);
      }
    };

    processCheckout();
  }, [isOpen, paymentMethod]);

  const handleCashCheckout = async () => {
    setIsCashSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: tableId || "table-01",
          tableNumber: tableNumber || "01",
          customerName: customerName || "Pelanggan",
          customerPhone: customerPhone || "",
          paymentType: "cash",
          items,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal memproses pesanan tunai.");
      }

      // Save as active order in local store
      setActiveOrder({
        id: data.orderId,
        orderNumber: data.orderNumber,
        tableNumber: tableNumber || "01",
        totalAmount: data.totalAmount || getTotalAmount(),
      });

      clearCart();
      onClose();
      router.push(`/orders/${data.orderId}`);
    } catch (err: any) {
      setErrorMsg(err?.message || "Gagal membuat pesanan tunai.");
    } finally {
      setIsCashSubmitting(false);
    }
  };

  const triggerSimulatedSettlement = async (orderNumber: string, orderId: string) => {
    try {
      await fetch("/api/midtrans/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderNumber,
          status_code: "200",
          gross_amount: String(orderData?.totalAmount || getTotalAmount()),
          signature_key: "sandbox-simulation-key",
          transaction_status: "settlement",
          payment_type: "qris",
          transaction_id: `sim_qris_${Date.now()}`,
        }),
      });
    } catch (e) {
      console.warn("Simulation webhook failed:", e);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderData) return;
    setIsProcessingPayment(true);
    await triggerSimulatedSettlement(orderData.orderNumber, orderData.orderId);

    // Save as active order
    setActiveOrder({
      id: orderData.orderId,
      orderNumber: orderData.orderNumber,
      tableNumber: tableNumber || "01",
      totalAmount: orderData.totalAmount || getTotalAmount(),
    });

    clearCart();
    setIsProcessingPayment(false);
    onClose();
    router.push(`/orders/${orderData.orderId}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md my-auto overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 text-center shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
        >
          <Flaticon name="cross" className="text-xs" />
        </button>

        {/* Method Selector Tabs */}
        <div className="mb-4 text-left">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Pilih Metode Pembayaran:
          </div>
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setPaymentMethod("qris")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                paymentMethod === "qris"
                  ? "bg-white text-amber-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Flaticon name="smartphone" className="text-sm" />
              <span>QRIS / E-Wallet</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold transition ${
                paymentMethod === "cash"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="text-sm">💵</span>
              <span>Bayar di Kasir</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="py-6 space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-200 text-rose-500">
              <Flaticon name="exclamation" className="text-xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Kendala Pembayaran</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">{errorMsg}</p>
          </div>
        )}

        {/* CASH OPTION VIEW */}
        {paymentMethod === "cash" && (
          <div className="space-y-4 pt-1">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <span>💵 Pembayaran Tunai (Cash)</span>
              </div>
              <p className="text-xs text-emerald-800/90 leading-relaxed">
                Pesanan Anda akan tercatat untuk <strong>Meja {tableNumber || "01"}</strong>. Silakan menuju kasir untuk membayar tunai agar barista langsung meracik pesanan Anda.
              </p>
              <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                <span className="text-emerald-800 font-medium">Total yang harus dibayar:</span>
                <span className="text-base font-black text-emerald-900">{formatRupiah(getTotalAmount())}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={isCashSubmitting}
              onClick={handleCashCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 px-4 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {isCashSubmitting ? (
                <>
                  <Flaticon name="spinner" className="text-sm animate-spin" />
                  <span>Mengirim Pesanan ke Kasir...</span>
                </>
              ) : (
                <>
                  <Flaticon name="check" className="text-sm font-bold" />
                  <span>Kirim Pesanan &amp; Bayar di Kasir</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* QRIS OPTION VIEW */}
        {paymentMethod === "qris" && (
          <>
            {isLoading && !orderData && (
              <div className="py-16 space-y-4">
                <div className="relative mx-auto w-14 h-14 flex items-center justify-center rounded-2xl bg-amber-50 border border-amber-200">
                  <Flaticon name="spinner" className="text-2xl animate-spin text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Menyiapkan Pembayaran QRIS...
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menghubungkan ke gateway Midtrans
                  </p>
                </div>
              </div>
            )}

            {orderData && (
              <div className="space-y-4 pt-1">
                <div className="text-center">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[11px] font-bold text-amber-800">
                    <Flaticon name="sparkles" className="text-xs text-amber-600" />
                    <span>Simulasi Pembayaran Midtrans QRIS</span>
                  </span>
                  <h3 className="text-base font-black text-slate-900 mt-2">
                    Scan QRIS untuk Membayar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pindai QR code di bawah ini menggunakan GoPay, OVO, ShopeePay, atau BCA Mobile.
                  </p>
                </div>

                {/* Authentic QRIS Display Card */}
                <QrisDisplay
                  orderNumber={orderData.orderNumber}
                  totalAmount={orderData.totalAmount}
                  tableNumber={tableNumber || "01"}
                  customerName={customerName || "Pelanggan"}
                  customerId={orderData.customerId}
                />

                {/* Simulation Banner Notice */}
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 text-left">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <Flaticon name="smartphone" className="text-sm text-amber-600" />
                    <span>Mode Simulasi (Development)</span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 mt-1 leading-relaxed">
                    Klik tombol di bawah untuk menyimulasikan pembayaran QRIS berhasil. Pesanan Anda akan langsung diteruskan ke <strong>Panel Admin / Kitchen Display</strong>.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="pt-1 space-y-2">
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleSimulatePayment}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 py-3.5 px-4 text-xs sm:text-sm font-black text-white shadow-lg shadow-emerald-500/25 hover:brightness-105 active:scale-98 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingPayment ? (
                      <>
                        <Flaticon name="spinner" className="text-sm animate-spin" />
                        <span>Memverifikasi QRIS &amp; Mengirim ke Dapur...</span>
                      </>
                    ) : (
                      <>
                        <Flaticon name="check" className="text-sm font-bold" />
                        <span>Simulasikan Scan &amp; Bayar QRIS Sukses</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          Batal / Ubah Pesanan
        </button>
      </div>
    </div>
  );
}
