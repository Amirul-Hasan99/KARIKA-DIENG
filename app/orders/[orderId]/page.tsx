"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";
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
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUploadError, setProofUploadError] = useState("");
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [previewProofModalOpen, setPreviewProofModalOpen] = useState(false);

  // Load saved payment proof from localStorage
  useEffect(() => {
    if (!orderId) return;
    try {
      const savedProof = localStorage.getItem(`karika_proof_${orderId}`);
      if (savedProof) {
        setPaymentProof(savedProof);
      }
    } catch {}
  }, [orderId]);

  // Upload proof to backend server & admin store
  const uploadProofFile = async (dataUrl: string, currentOrder?: Order | null) => {
    const targetOrder = currentOrder || order;
    if (!targetOrder) return;
    setIsUploadingProof(true);
    setProofUploadError("");
    try {
      const uploadRes = await fetch("/api/orders/upload-payment-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: targetOrder.id,
          paymentProof: dataUrl,
        }),
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json();
        throw new Error(errorData.error || "Gagal mengunggah bukti");
      }

      const uploadData = await uploadRes.json();
      const updatedUrl = uploadData.proofUrl || dataUrl;

      setOrder((prev) =>
        prev
          ? {
              ...prev,
              payment_proof_url: updatedUrl,
              payment_proof_uploaded_at: new Date().toISOString(),
            }
          : null
      );
      setPaymentProof(updatedUrl);
      setUploadSuccessMsg("✓ Bukti struk transfer berhasil tersimpan dan diteruskan ke Admin!");
      setTimeout(() => setUploadSuccessMsg(""), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat upload bukti";
      setProofUploadError(msg);
      console.error("Payment proof upload error:", err);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleFileProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Silakan pilih file gambar (JPG, PNG, atau WEBP)");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setPaymentProof(result);
      try {
        localStorage.setItem(`karika_proof_${orderId}`, result);
      } catch {}
      // Otomatis kirim ke backend saat file dipilih
      await uploadProofFile(result);
    };
    reader.readAsDataURL(file);
  };

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
          if (d.order.payment_proof_url && !paymentProof) {
            setPaymentProof(d.order.payment_proof_url);
          }
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
        if (active) {
          // Check local device backup before giving up
          try {
            const raw = localStorage.getItem("karika_active_order");
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.orderId === orderId || parsed.orderNumber === orderId) {
                setOrder({
                  id: parsed.orderId,
                  order_number: parsed.orderNumber,
                  table_id: "delivery",
                  table_number: "delivery",
                  customer_name: parsed.customerName || "Pelanggan",
                  customer_phone: parsed.customerPhone || "",
                  delivery_address: parsed.address || "Kawasan Dieng (Radius 8 km)",
                  delivery_distance_km: 2.5,
                  total_amount: parsed.totalAmount || 0,
                  payment_status: parsed.paymentStatus || "pending",
                  order_status: "received",
                  delivery_status: parsed.deliveryStatus || "pending",
                  payment_type: parsed.paymentType || "qris",
                  items: parsed.items || [
                    {
                      menu_id: "carica-biasa",
                      name: "Pesanan Oleh-Oleh Dieng",
                      price: parsed.totalAmount || 0,
                      qty: 1,
                      selected_modifiers: [],
                      subtotal: parsed.totalAmount || 0,
                    },
                  ],
                  created_at: parsed.updatedAt || new Date().toISOString(),
                  updated_at: parsed.updatedAt || new Date().toISOString(),
                } as any);
                setError("");
                return;
              }
            }
          } catch {}
          setError(e instanceof Error ? e.message : "Gagal memuat pesanan.");
        }
      }
    };
    void load();
    // Fast polling every 2 seconds for instant real-time synchronization with admin updates
    const timer = setInterval(() => void load(), 2000);
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

  const handleConfirmPayment = async () => {
    if (!order) return;
    
    setProofUploadError("");
    setIsUploadingProof(true);

    try {
      if (paymentProof) {
        const uploadRes = await fetch("/api/orders/upload-payment-proof", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            paymentProof,
          }),
        });

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Gagal upload bukti");
        }

        const uploadData = await uploadRes.json();
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                payment_proof_url: uploadData.proofUrl,
                payment_proof_uploaded_at: new Date().toISOString(),
              }
            : null
        );
      }

      setTimeout(() => {
        if (wa && wa !== "#") {
          window.open(wa, "_blank");
        }
      }, 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat upload";
      setProofUploadError(msg);
      console.error("Payment confirmation error:", err);
    } finally {
      setIsUploadingProof(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  const wa = order
    ? (() => {
        const adminPhone = "6283122046357";
        const isSettled = order.payment_status === "settlement";
        const paymentLabel =
          order.payment_type === "cod"
            ? "COD (Bayar Tunai saat Kurir Tiba)"
            : isSettled
            ? "QRIS (SUDAH DIBAYAR / LUNAS)"
            : "QRIS (Menunggu Verifikasi Toko)";

        const itemsList = order.items
          .map(
            (i) =>
              `- ${i.name} (${i.qty} paket) - Rp${i.subtotal.toLocaleString(
                "id-ID"
              )}`
          )
          .join("\n");

        const mapsLink = order.coordinates
          ? `https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}`
          : "Sesuai titik penginapan Dieng";

        const proofText = paymentProof
          ? "- Bukti Transfer: SUDAH SAYA LAMPIRKAN DI BAWAH (Foto Struk Terlampir)"
          : "- Bukti Transfer: Siap saya kirimkan ke chat ini";

        const msg = `Halo Admin Dioleh - oleh Dieng, saya ingin konfirmasi pesanan saya:

*DATA PESANAN:*
- No. Order: #${order.order_number}
- Nama: ${order.customer_name || "Pelanggan"}
- No. WhatsApp: ${order.customer_phone || "-"}
- Total Belanja: Rp${order.total_amount.toLocaleString("id-ID")}
- Metode Bayar: ${paymentLabel}
- Status Pembayaran: ${isSettled ? "LUNAS (TERVERIFIKASI)" : "BELUM LUNAS / COD"}
${proofText}

*ALAMAT & TITIK PENGANTARAN:*
- Patokan/Alamat: ${order.delivery_address || "-"}
- Titik Google Maps: ${mapsLink}
- Radius Jarak: ~${order.delivery_distance_km ?? 8} km dari Titik 0 Dieng

*RINCIAN PAKET OLEH-OLEH:*
${itemsList}

Mohon segera di-ACC dan diproses kurir pengantarannya ya Admin. Terima kasih banyak!`;

        return `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;
      })()
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
            <span>Katalog</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8d5c7] bg-white px-3 py-1 text-xs font-bold text-[#24251f] hover:bg-[#faf9f5] transition shadow-2xs"
            >
              <Flaticon name="search" className="text-xs text-[#90802a]" />
              <span>Cari dengan No. WA</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#292a23] text-[#f4ce00] shadow-xs" title="Dioleh - oleh Dieng">
                <BrandLogoIcon size={14} color="#f4ce00" />
              </span>
              <span className="text-xs font-black tracking-tight text-[#24251f] hidden sm:inline">
                Dioleh - oleh <span className="text-[#90802a] ml-0.5">Dieng</span>
              </span>
            </div>
          </div>
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
            <p className="text-xs text-[#77766f] mt-1">Menghubungkan ke sistem Dioleh - oleh Dieng</p>
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
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#77766f]">
                      NO. PESANAN: #{order.order_number}
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

                {/* Real-time 4-Stage Delivery Tracking Stepper */}
                <div className="mt-6 rounded-2xl border border-amber-200/80 bg-white p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <p className="text-xs font-bold text-[#24251f] uppercase tracking-wider">
                        Live Tracking Status Pengantaran
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      Real-time Sinkron Admin
                    </span>
                  </div>

                  {/* 4 Steps Indicator */}
                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    {[
                      { step: 1, label: "1. Diterima Toko", sub: "Antrean Masuk" },
                      { step: 2, label: "2. Dikemas", sub: "Proses Packing" },
                      { step: 3, label: "3. Kurir OTW", sub: "Menuju Titik Maps" },
                      { step: 4, label: "4. Selesai", sub: "Pesanan Tiba" },
                    ].map((s) => {
                      const currentStep = (() => {
                        if (order.delivery_status === "delivered" || order.order_status === "completed") return 4;
                        if (order.delivery_status === "picked_up" || order.order_status === "ready") return 3;
                        if (order.delivery_status === "assigned" || order.order_status === "cooking") return 2;
                        return 1;
                      })();

                      const isPassed = currentStep > s.step;
                      const isCurrent = currentStep === s.step;

                      return (
                        <div key={s.step} className="flex flex-col items-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-black transition-all ${
                              isPassed
                                ? "bg-emerald-600 text-white shadow-xs"
                                : isCurrent
                                ? "bg-[#f4ce00] text-black ring-4 ring-amber-100 shadow-md scale-105"
                                : "bg-slate-100 text-slate-400 border border-slate-200"
                            }`}
                          >
                            {isPassed ? "✓" : s.step}
                          </div>
                          <p
                            className={`mt-2 text-xs font-bold leading-tight ${
                              isCurrent
                                ? "text-[#24251f]"
                                : isPassed
                                ? "text-emerald-700"
                                : "text-slate-400"
                            }`}
                          >
                            {s.label}
                          </p>
                          <span
                            className={`text-[10px] mt-0.5 hidden xs:inline ${
                              isCurrent
                                ? "text-amber-800 font-semibold"
                                : "text-slate-400"
                            }`}
                          >
                            {s.sub}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Line */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-600 transition-all duration-500"
                      style={{
                        width:
                          order.delivery_status === "delivered" || order.order_status === "completed"
                            ? "100%"
                            : order.delivery_status === "picked_up" || order.order_status === "ready"
                            ? "75%"
                            : order.delivery_status === "assigned" || order.order_status === "cooking"
                            ? "50%"
                            : "25%",
                      }}
                    />
                  </div>

                  {/* Dynamic Status Banner Description */}
                  <div className="mt-3.5 rounded-xl bg-[#faf9f5] p-3 text-xs border border-[#eae7dc] flex items-center gap-2">
                    <Flaticon name="info" variant="sr" className="text-sm text-[#90802a] shrink-0" />
                    <p className="text-[#5c5a52] leading-relaxed">
                      {order.delivery_status === "delivered" || order.order_status === "completed"
                        ? "🎉 Pesanan telah sukses sampai dan diserahkan ke pembeli. Selamat menikmati oleh-oleh khas Dieng!"
                        : order.delivery_status === "picked_up" || order.order_status === "ready"
                        ? "🛵 Kurir Karika Dieng sedang meluncur dalam perjalanan menuju titik koordinat Google Maps Anda."
                        : order.delivery_status === "assigned" || order.order_status === "cooking"
                        ? "🎁 Paket oleh-oleh Anda sedang dikemas dan dipacking rapi oleh tim Karika Dieng."
                        : "📦 Toko Karika Dieng telah menerima pesanan Anda. Sedang menunggu antrean pengemasan."}
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
                    <div className="mt-5 space-y-3">
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

                      {/* Area Upload Bukti Transfer QRIS */}
                      <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/70 p-4 text-left space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                            <Flaticon name="picture" className="text-xs text-amber-700" />
                            <span>Unggah Foto Bukti Transfer / Struk QRIS:</span>
                          </span>
                          {paymentProof && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                              ✓ Bukti Tersimpan
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-amber-900/80 leading-relaxed">
                          Pilih screenshot m-banking atau foto bukti transfer Anda agar otomatis terlampir saat konfirmasi ke WhatsApp admin.
                        </p>

                        <div className="flex items-center gap-2">
                          <label className="flex-1 cursor-pointer flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-100/50 py-2 px-3 text-xs font-bold text-amber-950 transition shadow-2xs">
                            <Flaticon name="camera" className="text-xs text-amber-700" />
                            <span>{paymentProof ? "Ganti Foto Bukti" : "Ambil Foto / Pilih Struk"}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileProofChange}
                              className="hidden"
                            />
                          </label>

                          {paymentProof && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentProof(null);
                                try {
                                  localStorage.removeItem(`karika_proof_${orderId}`);
                                } catch {}
                              }}
                              className="rounded-xl border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                              title="Hapus Bukti"
                            >
                              Hapus
                            </button>
                          )}
                        </div>

                        {paymentProof && (
                          <div className="mt-2 relative rounded-xl overflow-hidden border border-amber-200 bg-white p-2">
                            <img
                              src={paymentProof}
                              alt="Bukti Transfer QRIS"
                              className="w-full max-h-48 object-contain rounded-lg"
                            />
                            <p className="mt-1 text-[10px] text-center text-slate-500 font-medium">
                              Foto bukti transfer siap dikirimkan ke WhatsApp admin toko.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Details */}
              <div className="p-6 sm:p-8 space-y-5">
                <div className="overflow-hidden rounded-2xl border border-amber-200/90 bg-[#fffdf5] shadow-xs">
                  {/* Header Bar */}
                  <div className="flex items-center justify-between border-b border-amber-100 bg-[#fff9e6] px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Flaticon name="marker" variant="sr" className="text-base text-[#938126]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63530f]">
                        Titik Pengantaran &amp; Alamat
                      </span>
                    </div>
                    {order.delivery_distance_km ? (
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">
                        Jarak: ~{order.delivery_distance_km} km dari Toko Dieng
                      </span>
                    ) : null}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Primary GPS Coordinates Point (Google Maps Integrated) */}
                    <div className="rounded-xl border border-amber-200 bg-white p-3.5 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                            <p className="text-xs font-bold text-[#24251f]">
                              Titik Pasti Kurir (Google Maps Terintegrasi)
                            </p>
                          </div>
                          {order.coordinates ? (
                            <p className="mt-1 font-mono text-[11px] text-[#7a7457]">
                              Koordinat GPS: {order.coordinates.lat.toFixed(6)}, {order.coordinates.lng.toFixed(6)}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-[#7a7457]">
                              Kawasan Dieng (Radius 8 km)
                            </p>
                          )}
                        </div>

                        {order.coordinates && (
                          <div className="flex items-center gap-2">
                            <a
                              target="_blank"
                              rel="noreferrer"
                              href={`https://www.google.com/maps/dir/?api=1&destination=${order.coordinates.lat},${order.coordinates.lng}`}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#292a23] px-3.5 py-2 text-xs font-bold text-[#f4ce00] hover:bg-black transition shadow-xs"
                            >
                              <Flaticon name="marker" variant="sr" className="text-xs" />
                              <span>🧭 Rute Navigasi Google Maps</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Secondary Benchmark / Detail Notes */}
                    <div className="rounded-xl border border-[#dedbd0] bg-[#faf9f5] p-3.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#63625b]">
                        Detail Patokan Alamat Tambahan (Pendukung):
                      </p>
                      <p className="mt-1.5 font-medium text-sm leading-6 text-[#292a23]">
                        {order.delivery_address || "Tidak ada catatan tambahan."}
                      </p>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-amber-100/80 pt-3 text-xs text-[#63625b]">
                      <div>
                        Penerima: <strong className="text-[#24251f] font-bold">{order.customer_name}</strong>
                        <span className="mx-2">•</span>
                        WhatsApp: <strong className="text-[#24251f] font-bold">{order.customer_phone}</strong>
                      </div>
                      <a
                        href={wa}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition shadow-2xs"
                      >
                        <Flaticon name="phone-call" variant="sr" className="text-xs text-emerald-600" />
                        <span>Hubungi Admin via WhatsApp</span>
                      </a>
                    </div>
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

                {/* FORM UPLOAD BUKTI STRUK TRANSFER / PEMBAYARAN PEMBELI */}
                <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-gradient-to-br from-[#fdfbf3] via-amber-50/40 to-white p-4 sm:p-5 text-left space-y-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#292a23] to-[#454639] text-[#f4ce00] shadow-2xs">
                        <Flaticon name="camera" className="text-sm" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#24251f]">
                          Form Upload Bukti Struk Transfer Pembeli
                        </h4>
                        <p className="text-[11px] text-[#7a7457]">
                          Unggah foto/screenshot bukti pembayaran untuk verifikasi kilat admin Dioleh - oleh Dieng
                        </p>
                      </div>
                    </div>

                    {(order.payment_proof_url || paymentProof) && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full shadow-2xs">
                        <Flaticon name="check-circle" variant="sr" className="text-xs text-emerald-600" />
                        <span>Struk Tersimpan di Sistem</span>
                      </span>
                    )}
                  </div>

                  {uploadSuccessMsg && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                      <Flaticon name="check-circle" variant="sr" className="text-xs text-emerald-600" />
                      <span>{uploadSuccessMsg}</span>
                    </div>
                  )}

                  {proofUploadError && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold flex items-center gap-2">
                      <Flaticon name="exclamation" className="text-xs text-rose-600" />
                      <span>{proofUploadError}</span>
                    </div>
                  )}

                  {/* Jika Struk Sudah Ada (Preview & Opsi Ganti) */}
                  {(order.payment_proof_url || paymentProof) ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden border border-amber-200 bg-white p-3 shadow-2xs max-w-sm mx-auto">
                        <div className="relative group cursor-pointer" onClick={() => setPreviewProofModalOpen(true)}>
                          <img
                            src={order.payment_proof_url || paymentProof!}
                            alt="Preview Struk Transfer"
                            className="w-full max-h-56 object-contain rounded-xl bg-slate-50 border border-slate-100"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-xl flex items-center justify-center text-white text-xs font-bold gap-1.5">
                            <Flaticon name="eye" className="text-sm" />
                            <span>Klik untuk Perbesar</span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <Flaticon name="check-circle" variant="sr" className="text-xs" />
                            <span>Terkirim ke Admin Toko</span>
                          </span>
                          <span className="font-mono text-[10px] text-slate-400">
                            {order.payment_proof_uploaded_at
                              ? new Date(order.payment_proof_uploaded_at).toLocaleString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Baru saja diunggah"}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <label className="cursor-pointer flex items-center gap-1.5 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 py-2 px-3.5 text-xs font-bold text-amber-950 transition shadow-2xs">
                          <Flaticon name="camera" className="text-xs text-amber-700" />
                          <span>{isUploadingProof ? "Mengunggah..." : "Ganti Foto Struk"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploadingProof}
                            onChange={handleFileProofChange}
                            className="hidden"
                          />
                        </label>

                        <button
                          type="button"
                          onClick={() => setPreviewProofModalOpen(true)}
                          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3.5 text-xs font-bold text-slate-700 transition shadow-2xs"
                        >
                          <Flaticon name="eye" className="text-xs text-slate-500" />
                          <span>Lihat Foto Penuh</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Jika Belum Ada Struk (Form Pilih File) */
                    <div className="space-y-2">
                      <label className="cursor-pointer flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 bg-white hover:bg-amber-50/60 py-6 px-4 text-center transition group">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 group-hover:scale-105 transition text-amber-800 shadow-2xs">
                          <Flaticon name="camera" className="text-xl" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[#24251f]">
                            {isUploadingProof ? "Sedang Mengunggah Bukti Struk..." : "Klik untuk Pilih Foto / Screenshot Struk Transfer"}
                          </p>
                          <p className="text-[11px] text-[#7a7457] mt-0.5">
                            Mendukung kamera HP, screenshot mobile banking, QRIS, atau slip ATM (JPG, PNG, WEBP)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingProof}
                          onChange={handleFileProofChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[11px] text-center text-slate-400">
                        Setelah dipilih, foto struk otomatis tersimpan ke pesanan dan diteruskan ke kartu order admin.
                      </p>
                    </div>
                  )}
                </div>

                {/* WhatsApp Confirmation */}
                <div className="pt-2">
                  {proofUploadError && (
                    <div className="mb-3 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex items-start gap-2">
                      <Flaticon name="exclamation" className="text-sm shrink-0 mt-0.5" />
                      <span>{proofUploadError}</span>
                    </div>
                  )}
                  <button
                    onClick={handleConfirmPayment}
                    disabled={isUploadingProof}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#168a54] px-5 py-4 text-sm font-bold text-white hover:bg-[#137446] transition shadow-md shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingProof ? (
                      <>
                        <Flaticon name="spinner" className="animate-spin text-base" />
                        <span>Mengunggah & Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Flaticon name="whatsapp" variant="brands" className="text-base" />
                        <span>
                          {paymentProof
                            ? "Konfirmasi Pembayaran & Kirim Bukti ke Admin WhatsApp (0831-2204-6357)"
                            : "Konfirmasi Pembayaran ke Admin WhatsApp (0831-2204-6357)"}
                        </span>
                      </>
                    )}
                  </button>
                  <p className="mt-2 text-center text-xs text-[#85857c]">
                    Admin toko akan langsung mengecek kesiapan paket dan mengabari kurir pengantar.
                  </p>
                </div>
              </div>
            </div>

            {/* Reload & Re-open Help Card */}
            <div className="rounded-3xl border border-[#e4e1d7] bg-[#faf9f5] p-5 text-xs text-[#727168] flex items-start gap-3 shadow-2xs">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-[#90802a] shrink-0 mt-0.5">
                <Flaticon name="info" className="text-sm" />
              </span>
              <div>
                <p className="font-bold text-[#24251f] text-sm">
                  Ingin cek status pesanan ini lagi jika web ditutup?
                </p>
                <p className="mt-1 leading-relaxed text-xs">
                  Nomor WhatsApp Anda (<strong>{order.customer_phone}</strong>) sudah tersimpan di sistem. Jika Anda reload halaman atau menutup browser, Anda dapat memantau kembali pengantaran cukup dengan membuka menu <strong>Pantau Pesanan</strong> dan mengisi nomor telepon Anda.
                </p>
                <div className="mt-3">
                  <Link
                    href={`/orders?phone=${encodeURIComponent(order.customer_phone || "")}`}
                    className="inline-flex items-center gap-1.5 font-bold text-[#90802a] hover:underline"
                  >
                    <span>Uji Cari Pesanan dengan Nomor HP</span>
                    <Flaticon name="arrow-right" className="text-[10px]" />
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#85857c]">
              Halaman ini memeriksa pembaruan status secara otomatis. Anda juga dapat memantau status pesanan kapan saja langsung dari halaman katalog.
            </p>
          </div>
        )}

        {/* MODAL PREVIEW FOTO STRUK PEMBELI */}
        {previewProofModalOpen && (order?.payment_proof_url || paymentProof) && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
            onClick={() => setPreviewProofModalOpen(false)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 p-4 bg-slate-50">
                <div className="flex items-center gap-2">
                  <Flaticon name="picture" className="text-sm text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Bukti Struk Transfer Pembeli</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewProofModalOpen(false)}
                  className="rounded-full p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
                >
                  <Flaticon name="cross" className="text-xs" />
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-900/5">
                <img
                  src={order?.payment_proof_url || paymentProof!}
                  alt="Struk Transfer Penuh"
                  className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-xs"
                />
              </div>

              <div className="p-3 border-t border-slate-100 bg-white flex items-center justify-between text-xs">
                <span className="text-slate-500 font-mono text-[11px]">
                  Order: #{order?.order_number}
                </span>
                <button
                  type="button"
                  onClick={() => setPreviewProofModalOpen(false)}
                  className="rounded-xl bg-slate-900 text-white font-bold px-4 py-2 hover:bg-black transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
