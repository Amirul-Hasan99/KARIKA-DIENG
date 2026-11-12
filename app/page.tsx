"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";

const heroImage = "/images/hero-dieng.jpg";

const featuredProducts = [
  {
    id: "carica-biasa",
    name: "Carica Manisan Asli",
    pack: "Isi 6 Cup × 115 g",
    price: 22000,
    tag: "Paling Laris",
    image:
      "https://ayopromo.com/show-picture?path=gambar%2Fproduk%2FcCVpzIO5LdcBNAiT9hNdNhWOmOhJh9dsMmMcDi3V.jpg",
    desc: "Potongan pepaya gunung khas Dieng dengan kuah sirup manis alami yang segar dinikmati dingin.",
  },
  {
    id: "carica-premium",
    name: "Carica Premium Spesial",
    pack: "Isi 6 Cup Besar",
    price: 40000,
    tag: "Kemasan Berbagi",
    image:
      "https://down-id.img.susercontent.com/file/id-11134207-7ra0k-mc7nllxauxj618",
    desc: "Pilihan cup ukuran besar berkuah sirup melimpah, favorit keluarga saat berkunjung ke Dieng.",
  },
  {
    id: "mie-ongklok",
    name: "Mie Ongklok Instan",
    pack: "Isi 6 Bungkus",
    price: 78000,
    tag: "Kuliner Legendaris",
    image: "/images/mie-ongklok.jpg",
    desc: "Kuah kental gurih berempah khas Wonosobo lengkap dengan ebi, tahu, dan kucai kering.",
  },
  {
    id: "keripik-jamur",
    name: "Keripik Jamur Tiram",
    pack: "Isi 6 Bungkus",
    price: 150000,
    tag: "Camilan Renyah",
    image:
      "https://raja-wisata.com/wp-content/uploads/2024/09/Keripik-Jamur-Dieng.jpg",
    desc: "Jamur tiram budidaya pegunungan berbalut tepung bumbu renyah, gurih tahan lama.",
  },
];

const deliveryStatusText: Record<string, { label: string; color: string }> = {
  pending: {
    label: "Menunggu Konfirmasi Toko",
    color: "bg-amber-100 text-amber-900 border-amber-300",
  },
  assigned: {
    label: "Kurir Ditugaskan",
    color: "bg-blue-100 text-blue-900 border-blue-300",
  },
  picked_up: {
    label: "Kurir Dalam Perjalanan (Otw Dieng)",
    color: "bg-purple-100 text-purple-900 border-purple-300",
  },
  delivered: {
    label: "Pesanan Telah Tiba",
    color: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
  failed_attempt: {
    label: "Pengantaran Tertunda",
    color: "bg-rose-100 text-rose-900 border-rose-300",
  },
};

export default function HomePage() {
  const [activeOrder, setActiveOrder] = useState<any | null>(null);

  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem("karika_active_order");
        if (!raw) {
          setActiveOrder(null);
          return;
        }
        const parsed = JSON.parse(raw);
        if (!parsed.orderId) return;

        // Fetch fresh status from API
        const res = await fetch(`/api/orders/${encodeURIComponent(parsed.orderId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            const updated = {
              orderId: data.order.id,
              orderNumber: data.order.order_number,
              customerName: data.order.customer_name,
              customerPhone: data.order.customer_phone,
              totalAmount: data.order.total_amount,
              paymentType: data.order.payment_type,
              paymentStatus: data.order.payment_status,
              deliveryStatus: data.order.delivery_status || "pending",
              updatedAt: new Date().toISOString(),
            };
            setActiveOrder(updated);
            localStorage.setItem("karika_active_order", JSON.stringify(updated));
            return;
          }
        }
        setActiveOrder(parsed);
      } catch {}
    };

    void checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 5000);
    return () => clearInterval(interval);
  }, []);

  const dismissActiveOrder = () => {
    localStorage.removeItem("karika_active_order");
    setActiveOrder(null);
  };
  return (
    <div className="min-h-screen bg-[#f8f7f2] text-[#24251f] selection:bg-[#f4ce00] selection:text-black">
      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-30 border-b border-[#e7e4d8] bg-[#f8f7f2]/90 backdrop-blur-md">
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-10">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="flex items-center gap-2.5 group"
              title="Dioleh - oleh Dieng"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#292a23] text-[#f4ce00] shadow-sm transition group-hover:bg-black">
                <BrandLogoIcon size={20} color="#f4ce00" />
              </span>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight text-[#24251f]">
                  Dioleh - oleh <span className="text-[#90802a]">Dieng</span>
                </span>
                <span className="text-[10px] font-semibold text-[#7d7a6e] -mt-1 hidden sm:inline">
                  Sentra Oleh-Oleh Khas Dataran Tinggi
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-7 text-sm font-semibold text-[#5c5a52]">
            <Link href="/catalog" className="hover:text-black transition">
              Katalog Lengkap
            </Link>
            <a href="#alur-pemesanan" className="hover:text-black transition">
              Alur Pemesanan
            </a>
            <a href="#keunggulan" className="hover:text-black transition">
              Keunggulan
            </a>
            <a href="#pilihan-favorit" className="hover:text-black transition">
              Produk Favorit
            </a>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Titik+0+Dieng"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-black transition"
            >
              <Flaticon name="marker" variant="sr" className="text-sm text-[#a28b00]" />
              Area Antar 8 km
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href={activeOrder ? `/orders/${activeOrder.orderId}` : "/orders"}>
              <Button
                variant="outline"
                size="default"
                className={`relative rounded-full border font-bold text-xs sm:text-sm px-4 gap-1.5 shadow-2xs transition ${
                  activeOrder
                    ? "border-amber-300 bg-amber-100/90 text-amber-900 shadow-xs"
                    : "border-[#d8d5c7] bg-white text-[#24251f] hover:bg-[#faf9f5]"
                }`}
              >
                <Flaticon name="truck-side" className="text-sm text-[#90802a]" />
                <span className="hidden xs:inline">Pantau</span> Pesanan
                {activeOrder && (
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping ml-1" />
                )}
              </Button>
            </Link>
            <Link href="/catalog">
              <Button
                variant="secondary"
                size="default"
                className="rounded-full shadow-xs hover:shadow-md transition gap-2 font-bold px-5 bg-[#f4ce00] hover:bg-[#dfba00] text-[#24251f]"
              >
                <Flaticon name="shopping-bag" variant="sr" className="text-base" />
                <span>Beli Oleh-Oleh</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* ACTIVE ORDER LIVE TRACKING BANNER (Device notification) */}
      {activeOrder && (
        <aside aria-label="Status pesanan aktif" className="mx-auto max-w-7xl px-4 pt-4 sm:px-10">
          <div className="rounded-2xl border-2 border-amber-400/40 bg-gradient-to-r from-[#fffcf2] via-white to-[#fbf9ed] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#f4ce00] px-2.5 py-0.5 text-[11px] font-black text-black">
                    <Flaticon name="bell-ring" variant="sr" className="text-xs" />
                    PESANAN AKTIF
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {activeOrder.orderNumber}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
                      deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.color ||
                      "bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    {deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.label ||
                      activeOrder.deliveryStatus}
                  </span>
                  {activeOrder.paymentStatus !== "settlement" && (
                    <span className="rounded-full bg-rose-50 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      Belum Lunas
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#6a685e]">
                  Pesanan a.n. <strong>{activeOrder.customerName || "Pembeli"}</strong> sedang dipantau langsung dari toko Dieng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/orders/${activeOrder.orderId}`}>
                  <Button
                    size="sm"
                    className="rounded-xl bg-[#292a23] hover:bg-black text-white font-bold text-xs gap-1.5"
                  >
                    <Flaticon name="qr" variant="sr" className="text-xs" />
                    <span>Lihat Detail / Bayar QRIS</span>
                  </Button>
                </Link>
                <button
                  onClick={dismissActiveOrder}
                  title="Sembunyikan dari landing page"
                  className="rounded-xl border border-[#dedad0] bg-white p-2 text-xs text-[#7d7a70] hover:bg-[#f5f2e8]"
                >
                  <Flaticon name="cross" className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-10">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Headlines & Call to actions */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl text-[#1e1f1a] leading-[1.08]">
                Dingin udaranya,{" "}
                <span className="text-[#a48600]">
                  hangat &amp; manis
                </span>{" "}
                oleh-olehnya.
              </h1>

              <p className="max-w-2xl text-lg text-[#615f56] leading-relaxed">
                Manisan buah Carica pepaya gunung Dieng dengan sirup segar alami,
                Mie Ongklok gurih berempah, dan keripik jamur renyah. Langsung
                kami antarkan ke villa, homestay, atau hotel Anda di sekitar Dieng
                tanpa repot macet.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link href="/catalog">
                  <Button
                    size="lg"
                    className="rounded-2xl bg-[#282922] text-white hover:bg-black font-bold px-7 shadow-lg shadow-black/10 transition gap-2"
                  >
                    <span>Pilih Oleh-Oleh Sekarang</span>
                    <Flaticon name="arrow-right" variant="rr" className="text-sm" />
                  </Button>
                </Link>

                <a href="#pilihan-favorit">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-2xl border-[#dcd8ca] bg-white font-semibold text-[#4f4d45] hover:bg-[#f4f2e9] gap-2"
                  >
                    <span>Lihat Produk Unggulan</span>
                    <Flaticon name="arrow-small-down" variant="rr" className="text-sm" />
                  </Button>
                </a>
              </div>

              {/* Trust & Guarantee Pill */}
              <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#e8e5db]">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#8a7200] uppercase tracking-wider flex items-center gap-1">
                    <Flaticon name="box-alt" variant="rr" className="text-xs" />
                    Bebas Campur
                  </p>
                  <p className="text-xs font-medium text-[#6b6961]">
                    Minimal 5 paket, pilih varian favorit
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#8a7200] uppercase tracking-wider flex items-center gap-1">
                    <Flaticon name="truck-side" variant="rr" className="text-xs" />
                    Radius 8 Km
                  </p>
                  <p className="text-xs font-medium text-[#6b6961]">
                    Antar ke seluruh penginapan Dieng
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#8a7200] uppercase tracking-wider flex items-center gap-1">
                    <Flaticon name="credit-card" variant="rr" className="text-xs" />
                    QRIS &amp; COD
                  </p>
                  <p className="text-xs font-medium text-[#6b6961]">
                    Bayar digital instan atau tunai
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card with Landmarks */}
            <div className="lg:col-span-5">
              <div className="relative isolate mx-auto w-full max-w-md lg:max-w-none">
                {/* Decorative background glow */}
                <div className="absolute -inset-4 rounded-[2.5rem] bg-gradient-to-tr from-[#f4ce00]/25 via-[#e2d5a3]/30 to-transparent blur-xl -z-10" />

                <div className="relative aspect-[4/5] sm:aspect-[4/4.5] overflow-hidden rounded-[2.25rem] border border-[#d8d4c5] bg-[#222824] shadow-2xl">
                  <Image
                    src={heroImage}
                    alt="Tugu Titik 0 Dieng Wonosobo"
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                  {/* Top Badge on image */}
                  <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/40 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
                      <Flaticon name="compass" variant="rr" className="text-xs text-[#f4ce00]" />
                      Titik 0 Km Dieng
                    </span>
                  </div>

                  {/* Bottom Captions on image */}
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f4ce00]">
                      Kuliner Pegunungan Wonosobo
                    </p>
                    <h3 className="text-2xl font-bold leading-snug">
                      Di jalan pegunungan yang berkabut, selalu ada rasa yang ingin dibawa pulang.
                    </h3>
                    <p className="text-xs text-white/80 leading-relaxed pt-1">
                      Pesan sekarang dan nikmati waktu liburan Anda di Dieng tanpa repot mengantre.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ASYMMETRIC BENTO GRID FEATURE SECTION */}
      <section id="keunggulan" className="py-16 sm:py-24 border-y border-[#e7e4d8] bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-10">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-[#d5d1c2] bg-[#f8f7f2] text-[#867100] font-bold">
              Pelayanan Istimewa
            </Badge>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1e1f1a]">
              Belanja oleh-oleh Dieng jadi lebih santai &amp; praktis.
            </h2>
            <p className="mt-3 text-[#69665c] leading-relaxed">
              Kami menghadirkan pengalaman berbelanja yang disesuaikan untuk kenyamanan wisatawan dan rombongan keluarga di Dataran Tinggi Dieng.
            </p>
          </div>

          {/* Dynamic Bento Grid using Shadcn Cards & Flaticon */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Bento Card 1: Wide 2-Column Focus on Carica Product */}
            <Card className="sm:col-span-2 rounded-3xl border-[#e8e5dc] bg-gradient-to-br from-[#fbf9f1] via-white to-[#f5f2e6] shadow-sm hover:shadow-md transition">
              <CardHeader className="p-7 sm:p-8">
                <div className="flex items-center justify-between">
                  <Badge variant="default" className="bg-[#f4ce00] text-black font-extrabold">
                    Ikon Utama Dieng
                  </Badge>
                  <span className="text-xs font-semibold text-[#8a887d]">
                    Vasconcellea cundinamarcensis
                  </span>
                </div>
                <CardTitle className="mt-3 text-2xl font-bold">
                  100% Buah Carica Asli Pegunungan Dieng
                </CardTitle>
                <CardDescription className="text-base text-[#6b685e] leading-relaxed mt-1">
                  Hanya tumbuh optimal pada ketinggian di atas 1.500 mdpl. Daging buahnya kenyal lembut dengan rasa manis sedikit asam yang menyegarkan dahaga.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 sm:px-8 pb-7">
                <div className="grid gap-4 sm:grid-cols-3 pt-2">
                  <div className="rounded-2xl border border-[#e8e5dc] bg-white p-4">
                    <p className="text-xs font-bold text-[#8a7200] flex items-center gap-1.5">
                      <Flaticon name="leaf" variant="sr" className="text-xs" />
                      Kaya Serat &amp; Enzim
                    </p>
                    <p className="text-xs text-[#706e64] mt-1 leading-relaxed">
                      Membantu pencernaan dan tinggi kandungan vitamin C alami.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#e8e5dc] bg-white p-4">
                    <p className="text-xs font-bold text-[#8a7200] flex items-center gap-1.5">
                      <Flaticon name="heart" variant="sr" className="text-xs" />
                      Gula Asli Tanpa Pengawet
                    </p>
                    <p className="text-xs text-[#706e64] mt-1 leading-relaxed">
                      Kuah sirup manis murni, aman dan lezat disajikan dingin.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#e8e5dc] bg-white p-4">
                    <p className="text-xs font-bold text-[#8a7200] flex items-center gap-1.5">
                      <Flaticon name="box-alt" variant="sr" className="text-xs" />
                      Kemasan Cup Praktis
                    </p>
                    <p className="text-xs text-[#706e64] mt-1 leading-relaxed">
                      Tersedia kemasan plastik maupun kardus isi 6 siap bawa.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="px-7 sm:px-8 pb-7 pt-0 flex justify-between items-center">
                <span className="text-xs font-semibold text-[#706e64]">
                  Tersedia varian Biasa &amp; Premium
                </span>
                <Link href="/catalog">
                  <Button variant="secondary" size="sm" className="rounded-xl font-bold bg-[#292a23] text-white hover:bg-black gap-1.5">
                    <span>Lihat Paket Carica</span>
                    <Flaticon name="angle-small-right" variant="rr" className="text-sm" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Bento Card 2: 1-Column Delivery Coverage */}
            <Card className="rounded-3xl border-[#e8e5dc] bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <CardHeader className="p-7">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#eff9f4] text-[#15803d]">
                  <Flaticon name="truck-side" variant="sr" className="text-xl" />
                </div>
                <CardTitle className="mt-4 text-xl font-bold">
                  Diantar Sampai Pintu Villa &amp; Homestay
                </CardTitle>
                <CardDescription className="text-sm text-[#6b685e] leading-relaxed">
                  Cukup pesan lewat ponsel Anda. Kurir kami mengantar ke penginapan di sekitar Dieng Kulon, Dieng Wetan, Sikunir, hingga Kejajar (radius 8 km).
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 pb-7 pt-0">
                <div className="rounded-2xl bg-[#f8f7f2] p-4 text-xs space-y-1.5 border border-[#ece9df]">
                  <p className="font-bold text-[#24251f] flex items-center gap-1">
                    <Flaticon name="marker" variant="sr" className="text-xs text-[#a28b00]" />
                    Area yang Tercover:
                  </p>
                  <p className="text-[#6d6b62]">
                    Desa Dieng Kulon · Dieng Wetan · Sikunir Sembungan · Patakbanteng · Tieng · Kejajar.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Bento Card 3: 1-Column Mix & Match */}
            <Card className="rounded-3xl border-[#e8e5dc] bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <CardHeader className="p-7">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fdf8e6] text-[#b45309]">
                  <Flaticon name="box-alt" variant="sr" className="text-xl" />
                </div>
                <CardTitle className="mt-4 text-xl font-bold">
                  Bebas Mix Minimum 5 Paket
                </CardTitle>
                <CardDescription className="text-sm text-[#6b685e] leading-relaxed">
                  Tidak harus satu jenis! Anda bisa memadukan 2 Carica, 1 Mie Ongklok instan, 1 Keripik Jamur, dan 1 Purwaceng untuk mencicipi seluruh cita rasa.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 pb-7 pt-0">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#8a7200]">
                  <Flaticon name="check-circle" variant="sr" className="text-sm text-emerald-600" />
                  <span>Sangat cocok untuk rombongan &amp; buah tangan</span>
                </div>
              </CardContent>
            </Card>

            {/* Bento Card 4: 2-Column Payment & Transparency */}
            <Card className="sm:col-span-2 rounded-3xl border-[#e8e5dc] bg-gradient-to-r from-white via-[#fbfbf8] to-[#f4f2e9] shadow-sm hover:shadow-md transition">
              <CardHeader className="p-7 sm:p-8">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#f0f4ff] text-[#2563eb]">
                  <Flaticon name="qr" variant="sr" className="text-xl" />
                </div>
                <CardTitle className="mt-4 text-2xl font-bold">
                  Pembayaran Digital Instan (QRIS) &amp; Tunai di Tempat (COD)
                </CardTitle>
                <CardDescription className="text-base text-[#6b685e] leading-relaxed">
                  Nikmati kemudahan bayar otomatis melalui scan barcode QRIS (semua bank &amp; dompet digital) atau bayar tunai langsung saat pesanan diserahkan oleh kurir.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-7 sm:px-8 pb-7 pt-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-xs py-1">
                    BCA Mobile &amp; Livin&apos;
                  </Badge>
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-xs py-1">
                    GoPay, OVO &amp; DANA
                  </Badge>
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-xs py-1">
                    ShopeePay
                  </Badge>
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-xs py-1">
                    Cash on Delivery (COD)
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FEATURED SIGNATURE PRODUCTS */}
      <section id="pilihan-favorit" className="py-16 sm:py-24 bg-[#f8f7f2]">
        <div className="mx-auto max-w-7xl px-5 sm:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <Badge variant="default" className="bg-[#f4ce00] text-black font-extrabold">
                Koleksi Terpopuler
              </Badge>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1e1f1a]">
                Pilihan Oleh-Oleh Favorit Wisatawan
              </h2>
              <p className="mt-2 text-[#69665c]">
                Produk olahan khas Dieng dan Wonosobo yang paling sering dipesan untuk buah tangan.
              </p>
            </div>
            <Link href="/catalog">
              <Button variant="outline" className="rounded-full border-[#dcd7c8] bg-white font-bold hover:bg-[#ece8dc] gap-2">
                <span>Lihat 9 Menu di Katalog</span>
                <Flaticon name="arrow-right" variant="rr" className="text-sm" />
              </Button>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <Card
                key={p.id}
                className="overflow-hidden rounded-3xl border-[#e8e5dc] bg-white shadow-xs hover:shadow-lg transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#eeece4]">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      unoptimized
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-black/80 text-white backdrop-blur-xs font-semibold text-[11px]">
                        {p.tag}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="p-5 pb-2">
                    <CardTitle className="text-lg font-bold group-hover:text-[#a48600] transition">
                      {p.name}
                    </CardTitle>
                    <p className="text-xs font-semibold text-[#8a887d]">{p.pack}</p>
                    <CardDescription className="text-xs text-[#6e6c62] mt-2 line-clamp-2 leading-relaxed">
                      {p.desc}
                    </CardDescription>
                  </CardHeader>
                </div>

                <CardFooter className="p-5 pt-3 border-t border-[#f1eee4] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#858379] block">Harga Paket</span>
                    <span className="text-lg font-black text-[#24251f]">
                      Rp{p.price.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <Link href="/catalog">
                    <Button
                      size="sm"
                      className="rounded-xl font-bold bg-[#f4ce00] text-black hover:bg-[#dfba00] px-3.5"
                    >
                      Pesan
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ALUR PEMESANAN PRAKTIS */}
      <section id="alur-pemesanan" className="py-16 sm:py-24 border-y border-[#e7e4d8] bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-10">
          <div className="text-center max-w-2xl mx-auto">
            <Badge variant="outline" className="border-[#d5d1c2] bg-[#fdfcf7] text-[#867100] font-bold px-3 py-1 text-xs">
              <Flaticon name="route" className="text-xs mr-1.5" />
              Cara Pesan Mudah
            </Badge>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#1e1f1a]">
              Alur Pemesanan Cepat &amp; Praktis
            </h2>
            <p className="mt-3 text-[#69665c] leading-relaxed text-sm sm:text-base">
              Belanja oleh-oleh khas Dieng tanpa perlu mengantre atau macet di jalan. Cukup 4 langkah dari ponsel Anda, kurir siap mengantar ke depan pintu penginapan.
            </p>
          </div>

          {/* 4 Process Cards */}
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <Card className="relative rounded-3xl border-[#e8e5dc] bg-gradient-to-br from-[#faf8ed] via-white to-[#fbfaf3] p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ce00] text-black font-black text-base shadow-xs">
                    01
                  </span>
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-[11px] font-bold text-[#8a7200]">
                    Bebas Campur
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#24251f] flex items-center gap-2">
                  <Flaticon name="shopping-bag" className="text-base text-[#90802a]" />
                  <span>Pilih Produk</span>
                </h3>
                <p className="mt-2 text-xs text-[#6e6c62] leading-relaxed">
                  Buka katalog dan pilih aneka manisan Carica, Mie Ongklok, Pitos, Keripik Jamur, atau Purwaceng. Minimal pemesanan 5 paket (bebas kombinasikan varian).
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#eee9db]">
                <span className="text-[11px] font-semibold text-[#8a7200] flex items-center gap-1">
                  <Flaticon name="check-circle" className="text-[10px]" />
                  9 Pilihan menu autentik Dieng
                </span>
              </div>
            </Card>

            {/* Step 2 */}
            <Card className="relative rounded-3xl border-[#e8e5dc] bg-white p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#292a23] text-white font-black text-base shadow-xs">
                    02
                  </span>
                  <Badge variant="outline" className="border-[#ded9cb] bg-[#faf9f5] text-[11px] font-bold text-[#8a7200]">
                    Radius 8 KM
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#24251f] flex items-center gap-2">
                  <Flaticon name="marker" className="text-base text-[#90802a]" />
                  <span>Titik Pengantaran</span>
                </h3>
                <p className="mt-2 text-xs text-[#6e6c62] leading-relaxed">
                  Tentukan alamat hotel, villa, atau homestay Anda di sekitar Dieng. Anda bisa memilih pin lokasi Google Maps secara presisi untuk mempermudah kurir.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#efeee9]">
                <span className="text-[11px] font-semibold text-[#8a7200] flex items-center gap-1">
                  <Flaticon name="check-circle" className="text-[10px]" />
                  Dieng Kulon, Wetan, Sikunir tercover
                </span>
              </div>
            </Card>

            {/* Step 3 */}
            <Card className="relative rounded-3xl border-[#e8e5dc] bg-gradient-to-br from-[#faf8ed] via-white to-[#fbfaf3] p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4ce00] text-black font-black text-base shadow-xs">
                    03
                  </span>
                  <Badge variant="outline" className="border-[#ded9cb] bg-white text-[11px] font-bold text-[#8a7200]">
                    QRIS &amp; COD
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#24251f] flex items-center gap-2">
                  <Flaticon name="qr" className="text-base text-[#90802a]" />
                  <span>Pilih Pembayaran</span>
                </h3>
                <p className="mt-2 text-xs text-[#6e6c62] leading-relaxed">
                  Pilih bayar digital instan via barcode QRIS (GoPay, OVO, ShopeePay, m-Banking) atau bayar tunai di tempat (COD) saat kurir sampai di penginapan Anda.
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#eee9db]">
                <span className="text-[11px] font-semibold text-[#8a7200] flex items-center gap-1">
                  <Flaticon name="check-circle" className="text-[10px]" />
                  Tanpa repot transfer manual
                </span>
              </div>
            </Card>

            {/* Step 4 */}
            <Card className="relative rounded-3xl border-[#e8e5dc] bg-white p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#292a23] text-[#f4ce00] font-black text-base shadow-xs">
                    04
                  </span>
                  <Badge variant="outline" className="border-[#ded9cb] bg-[#faf9f5] text-[11px] font-bold text-[#8a7200]">
                    Input No. WA
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#24251f] flex items-center gap-2">
                  <Flaticon name="truck-side" className="text-base text-[#90802a]" />
                  <span>Pantau Pengantaran</span>
                </h3>
                <p className="mt-2 text-xs text-[#6e6c62] leading-relaxed">
                  Setelah checkout, Anda diarahkan ke laman pantau. Jika browser ditutup atau reload, cukup masukkan nomor WhatsApp Anda di menu Pantau Pesanan kapan saja!
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#efeee9]">
                <span className="text-[11px] font-semibold text-[#8a7200] flex items-center gap-1">
                  <Flaticon name="check-circle" className="text-[10px]" />
                  Status tidak hilang saat reload
                </span>
              </div>
            </Card>
          </div>

          {/* Quick Action Navigation Bar inside flow section */}
          <div className="mt-12 rounded-3xl border border-[#e4e1d7] bg-[#faf9f5] p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#292a23] text-[#f4ce00] shrink-0 shadow-xs">
                <Flaticon name="truck-side" className="text-xl" />
              </span>
              <div>
                <h4 className="text-base font-extrabold text-[#24251f]">
                  Sudah Pernah Memesan Sebelumnya?
                </h4>
                <p className="text-xs text-[#727168] mt-0.5">
                  Cek posisi kurir dan status pesanan Anda hanya dengan memasukkan nomor WhatsApp.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link href="/orders" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl border-[#d8d5c7] bg-white hover:bg-[#f5f4ed] font-bold text-xs sm:text-sm px-5 text-[#24251f]">
                  <Flaticon name="search" className="text-xs mr-1.5 text-[#90802a]" />
                  <span>Pantau Pesanan Saya</span>
                </Button>
              </Link>
              <Link href="/catalog" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-xl bg-[#292a23] hover:bg-black font-extrabold text-xs sm:text-sm px-6 text-white shadow-sm">
                  <span>Mulai Belanja</span>
                  <Flaticon name="arrow-right" className="text-xs ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* LOCAL HERITAGE CALLOUT BANNER */}
      <section className="mx-auto max-w-7xl px-5 sm:px-10 pb-16 sm:pb-24">
        <div className="rounded-[2.5rem] bg-gradient-to-r from-[#292a23] to-[#1c1d18] text-white p-8 sm:p-14 shadow-xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#f4ce00]/10 blur-3xl pointer-events-none" />

          <div className="max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold text-[#f4ce00] border border-white/15">
              <Flaticon name="sparkles" variant="sr" className="text-xs text-[#f4ce00]" />
              Langsung dari Pengrajin Lokal
            </span>
            <h2 className="text-3xl font-extrabold sm:text-4xl tracking-tight leading-tight">
              Mendukung UMKM Dieng &amp; Petani Lokal Wonosobo
            </h2>
            <p className="text-sm sm:text-base text-[#cfccc2] leading-relaxed">
              Setiap cup carica dan camilan yang Anda nikmati diproduksi dengan higienis oleh kelompok usaha mikro di kawasan dataran tinggi Dieng. Bersama kami, Anda ikut melestarikan kuliner khas nusantara.
            </p>
            <div className="pt-2">
              <Link href="/catalog">
                <Button
                  size="lg"
                  className="rounded-2xl bg-[#f4ce00] text-black hover:bg-[#dfba00] font-bold px-8 shadow-md gap-2"
                >
                  <span>Buka Menu &amp; Pesan Sekarang</span>
                  <Flaticon name="arrow-right" variant="rr" className="text-sm" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* RICH, ENGAGING FOOTER */}
      <footer className="border-t border-[#e5e1d3] bg-[#f2efe4] text-[#292a23]">
        <div className="mx-auto max-w-7xl px-5 pt-16 pb-12 sm:px-10">
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
            {/* Column 1: Brand & About */}
            <div className="lg:col-span-2 space-y-4">
              <Link href="/" className="inline-flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#292a23] text-[#f4ce00] shadow-xs">
                  <BrandLogoIcon size={18} color="#f4ce00" />
                </span>
                <span className="text-2xl font-black tracking-tight text-[#24251f]">
                  Dioleh - oleh <span className="text-[#90802a]">Dieng</span>
                </span>
              </Link>
              <p className="text-sm text-[#66645a] leading-relaxed max-w-sm">
                Pusat pemesanan oleh-oleh khas dataran tinggi Dieng &amp; Kabupaten Wonosobo. Layanan antar cepat ke penginapan, homestay, dan hotel dalam radius 8 km dari Titik Nol Dieng.
              </p>
              <div className="flex items-center gap-2 pt-2 text-xs font-semibold text-[#545249]">
                <Flaticon name="marker" variant="sr" className="text-xs text-[#938126]" />
                <span>Titik 0 Km Dieng, Kejajar, Wonosobo, Jawa Tengah</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#545249]">
                <Flaticon name="clock" variant="sr" className="text-xs text-[#938126]" />
                <span>Buka Setiap Hari: 07.00 - 21.00 WIB</span>
              </div>
            </div>

            {/* Column 2: Ragam Produk */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1e1f1a]">
                Koleksi Oleh-Oleh
              </h3>
              <ul className="space-y-2 text-sm text-[#66645a]">
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Carica Delicia &amp; Biasa
                  </Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Carica Premium Cup Besar
                  </Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Mie Ongklok Instan
                  </Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Keripik Jamur &amp; Combro
                  </Link>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Minuman Purwaceng Alami
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Layanan & Informasi */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1e1f1a]">
                Bantuan &amp; Info
              </h3>
              <ul className="space-y-2 text-sm text-[#66645a]">
                <li>
                  <Link href="/orders" className="hover:text-black transition font-bold text-[#8a7200] flex items-center gap-1">
                    <Flaticon name="truck-side" className="text-xs" />
                    <span>Pantau Status Pesanan</span>
                  </Link>
                </li>
                <li>
                  <a href="#alur-pemesanan" className="hover:text-black transition">
                    Alur &amp; Cara Pesan
                  </a>
                </li>
                <li>
                  <Link href="/catalog" className="hover:text-black transition">
                    Minimal Belanja (5 Paket)
                  </Link>
                </li>
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Titik+0+Dieng"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-black transition"
                  >
                    Cek Titik 0 Km di Google Maps
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/6287839439540"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[#15803d] font-semibold hover:underline"
                  >
                    <Flaticon name="phone-call" variant="sr" className="text-xs" />
                    WhatsApp CS (0878-3943-9540)
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Metode Pembayaran */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#1e1f1a]">
                Metode Pembayaran
              </h3>
              <p className="text-xs text-[#66645a] leading-relaxed">
                Mendukung QRIS instan seluruh perbankan dan e-Wallet serta Tunai (COD).
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  QRIS
                </span>
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  GoPay
                </span>
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  ShopeePay
                </span>
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  BCA
                </span>
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  Mandiri
                </span>
                <span className="rounded-md bg-white border border-[#e1ded2] px-2 py-1 text-[11px] font-bold text-slate-800">
                  COD Tunai
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Copyright and Security Bar */}
          <div className="mt-12 pt-8 border-t border-[#e2decfa0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7e7b70]">
            <p>
              &copy; {new Date().getFullYear()} Dioleh - oleh Dieng · Sentra Oleh-Oleh Wonosobo. Seluruh hak cipta dilindungi.
            </p>
            <div className="flex items-center gap-4">
              <span>Dataran Tinggi Dieng, Jawa Tengah</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
