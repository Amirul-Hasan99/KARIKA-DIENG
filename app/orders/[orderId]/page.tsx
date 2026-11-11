"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { Flaticon } from "@/components/ui/Flaticon";
import { Order } from "@/types";

const paymentLabels: Record<string, string> = {
  pending: "Menunggu Pembayaran",
  settlement: "Lunas / Pembayaran Berhasil",
  failed: "Pembayaran Gagal",
  expire: "Kedaluwarsa",
};

const deliveryLabels: Record<string, string> = {
  pending: "Menunggu Diproses Toko",
  assigned: "Kurir Ditugaskan",
  picked_up: "Dalam Pengantaran",
  delivered: "Pesanan Telah Tiba",
  failed_attempt: "Pengantaran Tertunda",
};

export default function OrderTrackingPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isSimulating, setIsSimulating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Poll order data
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const r = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
          cache: "no-store",
        });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Pesanan tidak ditemukan.");
        if (active) {
          setOrder(d.order);
          // Sync with localStorage so catalog page shows active order tracking
          try {
            const activeOrderInfo = {
              orderId: d.order.id,
              orderNumber: d.order.order_number,
              customerName: d.order.customer_name,
              customerPhone: d.order.customer_phone,
              totalAmount: d.order.total_amount,
              paymentType: d.order.payment_type,
              paymentStatus: d.order.payment_status,
              deliveryStatus: d.order.delivery_status || "pending",
              updatedAt: new Date().toISOString(),
            };
            localStorage.setItem("karika_active_order", JSON.stringify(activeOrderInfo));
          } catch {}
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Gagal memuat pesanan.");
      }
    };
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [orderId]);

  // Generate QR Code matching buyer's order and total payment
  useEffect(() => {
    if (!order || order.payment_status === "settlement") return;

    const totalAmount = order.total_amount;
    const orderNumber = order.order_number || order.id;

    // Standardized EMVCo QRIS payload representation for Dioleh2 Karika Dieng
    const qrPayload = `00020101021226670016ID.CO.MIDTRANS.WWW011893600503000008988551440014ID.GO.QRIS.WWW0215ID10203040506010303UME520458125303360540${String(
      totalAmount
    )}.005802ID5919DIOLEH2 DIENG6008WONOSOBO62${String(orderNumber.length).padStart(
      2,
      "0"
    )}${orderNumber}6304`;

    QRCode.toDataURL(
      qrPayload,
      {
        width: 320,
        margin: 1.5,
        color: {
          dark: "#1e293b",
          light: "#ffffff",
        },
        errorCorrectionLevel: "M",
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [order]);

  // Countdown timer for QRIS
  useEffect(() => {
    if (order?.payment_status === "settlement") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [order?.payment_status]);

  // Trigger simulated payment
  const handleSimulatePayment = async () => {
    if (!order) return;
    setIsSimulating(true);
    try {
      await fetch("/api/midtrans/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.order_number,
          status_code: "200",
          gross_amount: String(order.total_amount),
          signature_key: "dummy-simulation-key",
          transaction_status: "settlement",
          payment_type: "qris",
          transaction_id: `dummy_qris_${Date.now()}`,
        }),
      });

      // Optimistic local update
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_status: "settlement",
              order_status: "received",
            }
          : null
      );

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    } catch (e) {
      console.warn("Simulation webhook failed:", e);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.order_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const wa = order
    ? `https://wa.me/6287839439540?text=${encodeURIComponent(
        `Halo Karika Dieng, pesanan ${order.order_number} a.n. ${order.customer_name} telah saya buat. Mohon konfirmasi kesiapan paket dan kurir.`
      )}`
    : "#";

  return (
    <main className="min-h-screen bg-[#f8f7f2] px-4 py-8 text-[#292a23] sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#73736b] hover:text-[#292a23] transition"
          >
            <Flaticon name="arrow-left" className="text-xs" />
            <span>Kembali ke katalog</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#938126] flex items-center gap-1.5">
            <Flaticon name="badge-check" variant="sr" className="text-sm text-[#b69b00]" />
            Karika Dieng · Dioleh2
          </span>
        </div>

        {error && !order ? (
          <section className="mt-8 rounded-3xl border border-[#e8e5dc] bg-white p-7 text-center">
            <h1 className="text-2xl font-bold">Pesanan belum ditemukan</h1>
            <p className="mt-2 text-sm text-[#77766f]">{error}</p>
          </section>
        ) : !order ? (
          <div className="mt-8 rounded-3xl border border-[#e8e5dc] bg-white p-10 text-center">
            <Flaticon name="clock" variant="rr" className="mx-auto text-3xl animate-pulse text-[#d1b000]" />
            <p className="mt-3 font-semibold text-lg">Memuat status pesanan…</p>
            <p className="text-xs text-[#77766f] mt-1">Menghubungkan ke sistem Karika Dieng</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {/* Main Order Card */}
            <div className="overflow-hidden rounded-3xl border border-[#e9e7df] bg-white shadow-sm">
              {/* Header Banner */}
              <div
                className={`p-6 sm:p-8 ${
                  order.payment_status === "settlement"
                    ? "bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-b border-emerald-100"
                    : "bg-white border-b border-[#efeee9]"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f4ce00]/25 px-3 py-1 text-xs font-bold text-[#766600]">
                    <Flaticon name="sparkles" variant="sr" className="text-xs text-[#b69b00]" />
                    Pesanan Berhasil Tercatat
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#77766f]">
                      {order.order_number}
                    </span>
                    <button
                      onClick={copyOrderNumber}
                      title="Salin nomor pesanan"
                      className="rounded-md border border-[#e4e1d7] p-1.5 text-[#77766f] hover:bg-[#f8f7f2]"
                    >
                      {copied ? (
                        <Flaticon name="check" variant="rr" className="text-xs text-emerald-600" />
                      ) : (
                        <Flaticon name="copy" variant="rr" className="text-xs" />
                      )}
                    </button>
                  </div>
                </div>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight">
                  Terima kasih, {order.customer_name || "Pelanggan"}!
                </h1>
                <p className="mt-2 text-sm text-[#77766f] leading-relaxed">
                  Pesanan oleh-oleh Dieng Anda kini sedang diproses oleh toko &amp; kurir.
                </p>

                {/* Status Badges */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#f8f7f2] p-4 border border-[#e9e7df]">
                    <p className="text-xs font-medium text-[#77766f]">Status Pembayaran</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <span
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          order.payment_status === "settlement"
                            ? "bg-emerald-500"
                            : "bg-amber-500 animate-ping"
                        }`}
                      />
                      <span className="font-bold text-sm">
                        {paymentLabels[order.payment_status] || order.payment_status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77766f]">
                      {order.payment_type === "cod"
                        ? "Tunai saat pesanan diterima oleh kurir"
                        : order.payment_status === "settlement"
                        ? "Pembayaran telah terverifikasi lunas"
                        : "QRIS · Pindai barcode untuk membayar"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-[#f8f7f2] p-4 border border-[#e9e7df]">
                    <p className="text-xs font-medium text-[#77766f]">Tahap Pengiriman</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Flaticon name="truck-side" variant="sr" className="text-base text-[#938126]" />
                      <span className="font-bold text-sm">
                        {deliveryLabels[order.delivery_status || "pending"] ||
                          order.delivery_status}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#77766f]">
                      Radius {order.delivery_distance_km ?? "–"} km dari Titik 0 Dieng
                    </p>
                  </div>
                </div>
              </div>

              {/* QRIS PAYMENT SECTION (Displayed when QRIS & Pending) */}
              {order.payment_type === "qris" && order.payment_status !== "settlement" && (
                <div className="border-b border-[#efeee9] bg-gradient-to-b from-[#fdfbf3] to-white p-6 sm:p-8">
                  <div className="mx-auto max-w-sm text-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                      <Flaticon name="qr" variant="sr" className="text-xs text-amber-800" />
                      <span>Pembayaran QRIS Pesanan</span>
                    </div>

                    <h2 className="mt-2 text-xl font-bold tracking-tight text-[#292a23]">
                      Scan QRIS untuk Menyelesaikan Pesanan
                    </h2>
                    <p className="mt-1 text-xs text-[#77766f]">
                      Pindai kode QRIS di bawah menggunakan GoPay, ShopeePay, OVO, DANA, BCA
                      Mobile, atau Livin&apos; Mandiri.
                    </p>

                    {/* Official Styled QRIS Card */}
                    <div className="mt-5 overflow-hidden rounded-2xl border-2 border-red-500/20 bg-white shadow-lg text-left">
                      {/* Red QRIS Banner */}
                      <div className="bg-gradient-to-r from-red-600 to-rose-700 px-4 py-2.5 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-white px-2 py-0.5 rounded shadow-xs">
                            <span className="font-black text-red-600 tracking-tighter text-sm">
                              QRIS
                            </span>
                          </div>
                          <span className="text-[10px] font-medium tracking-wide uppercase text-red-100">
                            Standar Pembayaran Nasional
                          </span>
                        </div>
                        <div className="bg-red-800/80 rounded px-1.5 py-0.5 text-[9px] font-bold text-white tracking-wider">
                          GPN
                        </div>
                      </div>

                      {/* Merchant Header */}
                      <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200/80 text-center">
                        <h3 className="text-xs font-black tracking-wide text-slate-900 uppercase">
                          DIOLEH2 DIENG - OLEH-OLEH KHAS DIENG
                        </h3>
                        <div className="flex items-center justify-center gap-2 mt-0.5 text-[10px] text-slate-500">
                          <span>
                            NMID: <strong className="font-mono text-slate-700">ID1020304050601</strong>
                          </span>
                          <span>•</span>
                          <span>Wonosobo</span>
                        </div>
                      </div>

                      {/* QR Display */}
                      <div className="p-4 flex flex-col items-center bg-white">
                        <div className="relative p-2 bg-white rounded-xl border-2 border-slate-200/80 shadow-xs">
                          {qrDataUrl ? (
                            <img
                              src={qrDataUrl}
                              alt={`QRIS ${order.order_number}`}
                              className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                            />
                          ) : (
                            <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                              <Flaticon name="spinner" className="animate-spin text-2xl text-amber-500" />
                              <span className="mt-2 text-xs font-semibold">
                                Membuat QR Code...
                              </span>
                            </div>
                          )}

                          {/* Center Emblem */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="bg-white/95 px-2 py-0.5 rounded border border-red-500 shadow-xs">
                              <span className="text-[10px] font-black tracking-tight text-red-600">
                                QRIS
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="mt-3 text-center">
                          <p className="text-[11px] font-medium text-slate-500">
                            Total Tagihan Sesuai Pesanan
                          </p>
                          <p className="text-2xl font-black text-amber-600 tracking-tight">
                            Rp{order.total_amount.toLocaleString("id-ID")}
                          </p>
                        </div>

                        {/* Mini pill */}
                        <div className="mt-3 w-full rounded-xl bg-slate-50 p-2.5 text-[11px] border border-slate-200/70 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">No. Pesanan:</span>
                            <span className="font-mono font-bold text-slate-800">
                              {order.order_number}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Pelanggan:</span>
                            <span className="font-semibold text-slate-800">
                              {order.customer_name}
                            </span>
                          </div>
                        </div>

                        {/* Countdown */}
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Flaticon name="clock" className="text-xs text-amber-500 animate-pulse" />
                          <span>
                            Batas Waktu Pembayaran:{" "}
                            <strong className="font-mono font-bold text-slate-800">
                              {formattedTime}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Footer supported apps */}
                      <div className="bg-slate-50 px-4 py-2.5 text-center border-t border-slate-100">
                        <p className="text-[9px] text-slate-500 leading-relaxed">
                          BCA Mobile, Livin&apos; Mandiri, BRImo, GoPay, OVO, DANA, ShopeePay &amp; Seluruh
                          Aplikasi Pembayaran QRIS.
                        </p>
                      </div>
                    </div>

                    {/* Simulation & Instant Confirmation Button */}
                    <div className="mt-5 space-y-2">
                      <button
                        onClick={handleSimulatePayment}
                        disabled={isSimulating}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 py-3.5 px-4 text-sm font-bold text-white shadow-md shadow-emerald-600/20 hover:brightness-105 active:scale-98 transition cursor-pointer disabled:opacity-50"
                      >
                        {isSimulating ? (
                          <>
                            <Flaticon name="spinner" className="animate-spin text-sm" />
                            <span>Memverifikasi Pembayaran...</span>
                          </>
                        ) : (
                          <>
                            <Flaticon name="check-circle" variant="sr" className="text-sm" />
                            <span>Konfirmasi / Simulasikan Pembayaran Sukses</span>
                          </>
                        )}
                      </button>
                      <p className="text-[11px] text-slate-500">
                        Klik tombol di atas untuk menyimulasikan konfirmasi pelunasan QRIS langsung ke sistem toko &amp; kurir.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Details */}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="flex items-start gap-3 rounded-2xl border border-[#efeee9] bg-[#fdfcf9] p-4">
                  <Flaticon name="marker" variant="sr" className="mt-0.5 text-base text-[#938126]" />
                  <div className="text-sm">
                    <p className="font-semibold text-xs text-[#77766f] uppercase tracking-wider">
                      Alamat Pengantaran
                    </p>
                    <p className="mt-1 font-medium leading-6 text-[#292a23]">
                      {order.delivery_address}
                    </p>
                    <p className="mt-1 text-xs text-[#77766f]">
                      Kontak Penerima: <strong>{order.customer_phone}</strong> ({order.customer_name})
                    </p>
                    {order.coordinates && (
                      <a
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#766600] hover:underline"
                        target="_blank"
                        rel="noreferrer"
                        href={`https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`}
                      >
                        <Flaticon name="arrow-up-right-from-square" variant="rr" className="text-xs" />
                        <span>Buka Titik Antar di Google Maps</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* Items Breakdown */}
                <div className="border-t border-[#efeee9] pt-5">
                  <p className="mb-3 flex items-center gap-2 font-bold text-sm">
                    <Flaticon name="box-check" variant="sr" className="text-base text-[#938126]" />
                    <span>Rincian Belanja Oleh-Oleh</span>
                  </p>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div
                        key={`${item.menu_id}-${index}`}
                        className="flex justify-between items-center text-sm py-1.5 border-b border-[#f3f2ec] last:border-0"
                      >
                        <div>
                          <span className="font-semibold">{item.name}</span>
                          <span className="ml-2 text-xs text-[#77766f]">
                            ({item.qty} paket × Rp{item.price.toLocaleString("id-ID")})
                          </span>
                        </div>
                        <span className="font-bold shrink-0">
                          Rp{item.subtotal.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-between items-center border-t border-[#efeee9] pt-4 font-bold text-base">
                    <span>Total Tagihan</span>
                    <span className="text-xl text-[#938126]">
                      Rp{order.total_amount.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* WhatsApp Confirmation */}
                <div className="pt-2">
                  <a
                    href={wa}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#168a54] px-5 py-4 text-sm font-bold text-white hover:bg-[#137446] transition shadow-md shadow-emerald-700/20"
                  >
                    <Flaticon name="whatsapp" variant="brands" className="text-base" />
                    <span>Konfirmasi Pesanan ke Toko via WhatsApp</span>
                  </a>
                  <p className="mt-2 text-center text-xs text-[#85857c]">
                    Admin toko akan langsung mengecek kesiapan paket dan mengabari kurir pengantar.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#85857c]">
              Halaman ini memeriksa pembaruan status secara otomatis. Anda juga dapat memantau status pesanan kapan saja langsung dari halaman katalog.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
