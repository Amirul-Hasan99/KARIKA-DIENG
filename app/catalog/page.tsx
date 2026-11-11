"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import DeliveryLocationPicker from "@/components/customer/DeliveryLocationPicker";
import { Flaticon } from "@/components/ui/Flaticon";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { INITIAL_KARIKA_PRODUCTS, KarikaProduct } from "@/lib/karika-products-data";

const rupiah = (n: number) => `Rp${n.toLocaleString("id-ID")}`;
type Product = KarikaProduct;

interface ActiveOrderState {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  deliveryDistanceKm?: number;
  items?: any[];
  totalAmount?: number;
  paymentType?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  updatedAt?: string;
}

const deliveryStatusText: Record<string, { label: string; color: string }> = {
  pending: { label: "Menunggu Konfirmasi Toko", color: "bg-amber-100 text-amber-900 border-amber-300" },
  assigned: { label: "Kurir Ditugaskan", color: "bg-blue-100 text-blue-900 border-blue-300" },
  picked_up: { label: "Kurir Dalam Perjalanan", color: "bg-purple-100 text-purple-900 border-purple-300" },
  delivered: { label: "Pesanan Telah Tiba", color: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  failed_attempt: { label: "Pengantaran Tertunda", color: "bg-rose-100 text-rose-900 border-rose-300" },
};

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>(INITIAL_KARIKA_PRODUCTS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Semua");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [payment, setPayment] = useState<"qris" | "cod">("qris");
  const [createdSuccessOrder, setCreatedSuccessOrder] = useState<ActiveOrderState | null>(null);
  const [countdown, setCountdown] = useState<number>(5);

  // Auto-redirect countdown to tracking page when checkout succeeds
  useEffect(() => {
    if (!createdSuccessOrder) return;
    if (countdown <= 0) {
      location.assign(`/orders/${createdSuccessOrder.orderId}`);
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [createdSuccessOrder, countdown]);

  // Load latest live products & stock from admin API
  useEffect(() => {
    const fetchLiveProducts = async () => {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (err) {
        console.warn("Using offline fallback products:", err);
      }
    };
    void fetchLiveProducts();
  }, []);
  
  // Tracking feature state
  const [activeOrder, setActiveOrder] = useState<ActiveOrderState | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingSearchQuery, setTrackingSearchQuery] = useState("");
  const [trackingSearchResults, setTrackingSearchResults] = useState<any[]>([]);
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);
  const [searchError, setSearchError] = useState("");

  const categories = ["Semua", "Carica", "Makanan", "Camilan", "Minuman"];
  const visible = useMemo(
    () =>
      products.filter(
        (p) =>
          (category === "Semua" || p.group === category) &&
          `${p.name} ${p.description}`.toLowerCase().includes(query.toLowerCase())
      ),
    [category, query]
  );

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = products.reduce((s, p) => s + p.price * (cart[p.id] || 0), 0);

  // Load and sync cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("karika_cart");
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch {}
  }, []);

  const change = (id: string, delta: number) => {
    setCart((c) => {
      const n = { ...c, [id]: Math.max(0, Math.min(99, (c[id] || 0) + delta)) };
      if (!n[id]) delete n[id];
      try {
        localStorage.setItem("karika_cart", JSON.stringify(n));
      } catch {}
      return n;
    });
  };

  // Poll active order from localStorage & backend
  useEffect(() => {
    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem("karika_active_order");
        if (!raw) return;
        const parsed = JSON.parse(raw) as ActiveOrderState;
        if (!parsed.orderId) return;

        // Fetch fresh status from API
        const res = await fetch(`/api/orders/${encodeURIComponent(parsed.orderId)}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (data.order) {
            const updated: ActiveOrderState = {
              orderId: data.order.id,
              orderNumber: data.order.order_number,
              customerName: data.order.customer_name,
              customerPhone: data.order.customer_phone,
              address: data.order.delivery_address || parsed.address,
              coordinates: data.order.coordinates || parsed.coordinates,
              deliveryDistanceKm: data.order.delivery_distance_km ?? parsed.deliveryDistanceKm,
              items: data.order.items || parsed.items,
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

  // Search orders by phone or order number
  const handleSearchOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingSearchQuery.trim()) return;
    setIsSearchingTracking(true);
    setSearchError("");
    setTrackingSearchResults([]);

    try {
      const res = await fetch(`/api/orders/search?q=${encodeURIComponent(trackingSearchQuery.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mencari pesanan.");
      if (!data.orders || data.orders.length === 0) {
        setSearchError("Tidak ditemukan pesanan dengan nomor tersebut.");
      } else {
        setTrackingSearchResults(data.orders);
      }
    } catch (err: any) {
      setSearchError(err?.message || "Gangguan saat mencari pesanan.");
    } finally {
      setIsSearchingTracking(false);
    }
  };

  async function submitOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    const lat = Number(f.get("lat")),
      lng = Number(f.get("lng"));
    try {
      const response = await fetch("/api/orders/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: f.get("name"),
          customerPhone: f.get("phone"),
          address: f.get("address"),
          coordinates: { lat, lng },
          paymentType: payment,
          items: products
            .filter((p) => cart[p.id])
            .map((p) => ({ productId: p.id, qty: cart[p.id] })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Checkout belum dapat diproses.");

      // Save to localStorage so buyer NEVER loses their order status!
      const activeOrderData: ActiveOrderState = {
        orderId: data.orderId,
        orderNumber: data.orderNumber,
        customerName: String(f.get("name")),
        customerPhone: String(f.get("phone")),
        address: String(f.get("address")),
        coordinates: { lat, lng },
        deliveryDistanceKm: Number(data.deliveryDistanceKm || 0),
        totalAmount: total,
        paymentType: payment,
        paymentStatus: "pending",
        deliveryStatus: "pending",
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("karika_active_order", JSON.stringify(activeOrderData));
      localStorage.removeItem("karika_cart");
      setCart({});
      setCheckout(false);
      setBusy(false);
      setCreatedSuccessOrder(activeOrderData);
      setCountdown(5);

      try {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      } catch {}
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout gagal. Coba lagi.");
      setBusy(false);
    }
  }

  const dismissActiveOrder = () => {
    localStorage.removeItem("karika_active_order");
    setActiveOrder(null);
  };

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-[#24251f]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-20 border-b border-[#e9e7dc] bg-[#f8f7f2]/95 backdrop-blur">
        <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#292a23] text-[#f4ce00] shadow-xs">
                <BrandLogoIcon size={16} color="#f4ce00" />
              </span>
              <span className="text-xl font-black tracking-tight text-[#24251f]">
                KARIKA<span className="text-[#90802a] ml-1">DIENG</span>
              </span>
            </Link>
            <Link
              href="/admin/login"
              aria-label="Login admin"
              title="Portal Admin"
              className="grid h-8 w-8 place-items-center rounded-full border border-[#e3e0d5] bg-white text-[#77756f] hover:text-black transition"
            >
              <Flaticon name="lock" className="text-xs" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Pantau Pengiriman Button */}
            <button
              onClick={() => setShowTrackingModal(true)}
              className={`relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition border ${
                activeOrder
                  ? "bg-amber-100/90 text-amber-900 border-amber-300 shadow-xs"
                  : "bg-white text-[#68685f] border-[#e4e1d7] hover:bg-[#f3f0e6]"
              }`}
            >
              <Flaticon name="truck-side" variant="sr" className="text-xs text-[#a28b00]" />
              <span>Pantau Pesanan</span>
              {activeOrder && (
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
              )}
            </button>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Titik+0+Dieng"
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-[#68685f] hover:bg-white sm:flex"
            >
              <Flaticon name="marker" variant="sr" className="text-xs text-[#a28b00]" />
              Area antar 8 km
            </a>

            <button
              onClick={() => setCheckout(true)}
              className="relative inline-flex items-center gap-2 rounded-full bg-[#282922] px-4 py-2.5 text-sm font-semibold text-white hover:bg-black transition cursor-pointer"
            >
              <Flaticon name="shopping-bag" variant="sr" className="text-sm" />
              <span>Keranjang</span>
              {count > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f4ce00] px-1 text-[11px] font-bold text-black">
                  {count}
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* ACTIVE ORDER LIVE TRACKING BANNER (User Request: Jangan hilangkan statusnya di katalog) */}
      {activeOrder && (
        <aside aria-label="Status pesanan aktif" className="mx-auto max-w-7xl px-4 pt-4 sm:px-8">
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
                  title="Sembunyikan dari katalog"
                  className="rounded-xl border border-[#dedad0] bg-white p-2 text-xs text-[#7d7a70] hover:bg-[#f5f2e8]"
                >
                  <Flaticon name="cross" className="text-xs" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Catalog Main View */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-8 sm:pt-10">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#90802a] flex items-center gap-1.5">
              <Flaticon name="sparkles" variant="sr" className="text-xs text-[#90802a]" />
              Oleh-oleh Wonosobo · dikemas isi enam
            </p>
            <h1 className="mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl text-[#24251f]">
              Bawa pulang rasa Dieng.
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-[#727168]">
              Pilih beberapa favorit sekaligus. Kami mengantar ke alamat penginapan dalam radius 8 km dari Titik Nol Dieng.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#858585]">
              <Flaticon name="search" className="text-sm" />
            </span>
            <input
              aria-label="Cari produk"
              placeholder="Cari carica, jamur, ongklok..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-xl border border-[#e1dfd5] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#b69b00]"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === c
                  ? "bg-[#292a23] text-white shadow-xs"
                  : "border border-[#e4e1d7] bg-white text-[#66665e] hover:border-[#aaa58d]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((p) => (
            <article
              key={p.id}
              className="group overflow-hidden rounded-3xl border border-[#e9e7df] bg-white shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <button onClick={() => setSelected(p)} className="block w-full text-left">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#eeece4]">
                  <Image
                    src={p.image}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-800 shadow-xs">
                    Foto referensi
                  </span>
                  {p.is_available === false ? (
                    <span className="absolute top-3 right-3 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-xs">
                      Stok Habis
                    </span>
                  ) : (
                    <span className="absolute bottom-3 right-3 rounded-full bg-[#292a23]/90 px-3 py-1 text-xs font-bold text-white">
                      Paket isi 6
                    </span>
                  )}
                </div>
                <div className="px-5 pt-4">
                  <p className="text-[11px] font-bold uppercase tracking-[.16em] text-[#958329]">
                    {p.group}
                  </p>
                  <h2 className="mt-1 text-lg font-bold text-[#24251f]">{p.name}</h2>
                  <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-[#74736b]">
                    {p.description}
                  </p>
                  <div className="mt-4 flex items-end justify-between border-t border-[#efeee9] py-4">
                    <div>
                      <p className="text-[11px] text-[#85857f]">{p.pack}</p>
                      <p className="mt-0.5 text-xl font-black text-[#24251f]">{rupiah(p.price)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#8a7200]">
                      <span>Detail</span>
                      <Flaticon name="angle-small-right" className="text-sm" />
                    </span>
                  </div>
                </div>
              </button>

              {p.is_available === false ? (
                <div className="flex items-center justify-between border-t border-rose-100 px-5 py-3.5 bg-rose-50/70">
                  <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <Flaticon name="cross-circle" className="text-xs text-rose-600" />
                    Stok Sedang Kosong
                  </span>
                  <span className="text-[10px] uppercase font-bold text-rose-500 bg-white px-2 py-0.5 rounded border border-rose-200">
                    Restock Segera
                  </span>
                </div>
              ) : (
                <div className="flex items-center justify-between border-t border-[#efeee9] px-5 py-3 bg-[#faf9f5]">
                  <span className="text-xs font-semibold text-[#75746d]">Tambah ke pesanan</span>
                  <div className="flex items-center gap-3">
                    <button
                      aria-label={`Kurangi ${p.name}`}
                      onClick={() => change(p.id, -1)}
                      className="grid h-8 w-8 place-items-center rounded-full border border-[#e4e1d7] bg-white hover:bg-[#f8f7f2] transition"
                    >
                      <Flaticon name="minus" className="text-xs" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold">{cart[p.id] || 0}</span>
                    <button
                      aria-label={`Tambah ${p.name}`}
                      onClick={() => change(p.id, 1)}
                      className="grid h-8 w-8 place-items-center rounded-full bg-[#f4ce00] hover:bg-[#dfba00] transition shadow-xs"
                    >
                      <Flaticon name="plus" className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Footer info pill */}
        <div className="mt-10 rounded-2xl border border-[#e9e7df] bg-white p-5 text-center shadow-xs">
          <p className="font-bold text-base text-[#24251f]">
            Belanja minimal 5 paket · boleh campur produk
          </p>
          <p className="mt-1 text-sm text-[#77766f]">
            QRIS atau bayar tunai saat kurir mengantar · area antar maksimal 8 km dari Titik 0 Dieng
          </p>
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selected && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setSelected(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={`Detail ${selected.name}`}
            onClick={(e) => e.stopPropagation()}
            className="relative grid max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-white shadow-2xl md:grid-cols-2"
          >
            <button
              onClick={() => setSelected(null)}
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-xs hover:bg-white"
            >
              <Flaticon name="cross" className="text-xs" />
            </button>
            <div className="relative min-h-64 bg-[#efeee8]">
              <Image
                src={selected.image}
                alt={selected.name}
                fill
                sizes="(max-width:768px) 100vw, 50vw"
                unoptimized
                className="object-cover"
              />
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[#98852b]">
                  {selected.group} · {selected.pack}
                </p>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold">{selected.name}</h2>
                <p className="mt-3 leading-7 text-[#686860] text-sm">{selected.description}</p>
                <p className="mt-4 rounded-xl bg-[#f8f7f2] p-3 text-xs leading-5 text-[#727168] border border-[#e8e6dc]">
                  Foto dan harga merupakan referensi publik produk sejenis. Merek dan kesegaran terjamin dari sentra oleh-oleh Dieng.
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#efeee9] pt-4">
                <div>
                  <p className="text-[11px] text-[#77766f]">Harga per paket</p>
                  <p className="text-2xl font-black text-[#24251f]">{rupiah(selected.price)}</p>
                </div>
                {selected.is_available === false ? (
                  <Button
                    disabled
                    className="rounded-xl bg-slate-200 text-slate-500 font-bold px-5 cursor-not-allowed"
                  >
                    Stok Sedang Habis
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      change(selected.id, 1);
                      setSelected(null);
                    }}
                    className="rounded-xl bg-[#292a23] hover:bg-black text-white font-bold px-5"
                  >
                    + Tambah Keranjang
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* POP-UP MODAL PESANAN BERHASIL */}
      {createdSuccessOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Pesanan Berhasil Dibuat"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 sm:p-8 text-center shadow-2xl border border-emerald-100"
          >
            {/* Animated check badge */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 border border-emerald-200 mb-4 shadow-sm animate-bounce">
              <Flaticon name="check" className="text-3xl font-black text-emerald-600" />
            </div>

            <Badge className="bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold text-xs px-3 py-1 mb-2">
              Pesanan Sukses Diterima Toko
            </Badge>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[#24251f]">
              Pesanan Berhasil Dibuat!
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#727168] leading-relaxed">
              Terima kasih, <strong>{createdSuccessOrder.customerName}</strong>! Pesanan oleh-oleh Anda telah kami catat dan segera disiapkan untuk diantar ke penginapan Anda di Dieng.
            </p>

            {/* Order Details Card */}
            <div className="mt-5 rounded-2xl border border-[#e8e5dc] bg-[#faf9f5] p-4 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727168]">Nomor Pesanan:</span>
                <span className="font-mono font-black text-[#90802a]">
                  #{createdSuccessOrder.orderNumber}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727168]">Total Tagihan:</span>
                <span className="font-black text-[#24251f]">
                  {rupiah(createdSuccessOrder.totalAmount || total)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#727168]">Metode Pembayaran:</span>
                <span className="font-bold text-slate-800 uppercase">
                  {createdSuccessOrder.paymentType === "cash" ? "Bayar Tunai (COD)" : "QRIS Midtrans"}
                </span>
              </div>
              <div className="pt-2 border-t border-[#eae7dc] text-[11px] text-[#727168]">
                <Flaticon name="info" className="text-xs mr-1 text-[#90802a]" />
                Nomor WhatsApp <strong>{createdSuccessOrder.customerPhone}</strong> tersimpan otomatis. Jika reload atau tutup halaman, Anda dapat memantau status pesanan kapan saja dengan mengisi nomor ini di menu <strong>Pantau Pesanan</strong>.
              </div>
            </div>

            {/* Countdown / CTA buttons */}
            <div className="mt-6 space-y-2.5">
              <Link href={`/orders/${createdSuccessOrder.orderId}`}>
                <Button className="w-full h-12 rounded-2xl bg-[#292a23] hover:bg-black font-extrabold text-sm text-white shadow-md transition gap-2">
                  <span>Lihat Pembayaran &amp; Pantau Pengantaran</span>
                  <Flaticon name="arrow-right" className="text-xs" />
                </Button>
              </Link>
              <p className="text-[11px] text-[#8c8980]">
                Otomatis dialihkan ke halaman pantau dalam <strong>{countdown} detik</strong>...
              </p>
            </div>
          </section>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkout && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-3 sm:p-5 backdrop-blur-xs"
          onClick={() => !busy && setCheckout(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Keranjang dan checkout"
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[94vh] w-full max-w-xl overflow-auto rounded-3xl bg-white p-5 sm:p-7 shadow-2xl"
          >
            <button
              onClick={() => setCheckout(false)}
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full hover:bg-[#f4f3ee]"
            >
              <Flaticon name="cross" className="text-xs" />
            </button>

            <h2 className="text-2xl font-extrabold text-[#24251f]">Keranjang & Pengantaran</h2>
            <p className="mt-1 text-xs text-[#77766f]">
              Oleh-oleh pilihan Anda · minimum pembelian 5 paket
            </p>

            <div className="mt-5 space-y-3 max-h-48 overflow-y-auto pr-1">
              {products
                .filter((p) => cart[p.id])
                .map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-[#efeee9] pb-3"
                  >
                    <div>
                      <p className="font-bold text-sm text-[#24251f]">{p.name}</p>
                      <p className="text-xs text-[#7a7971]">
                        {p.pack} · {rupiah(p.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => change(p.id, -1)}
                        className="grid h-7 w-7 place-items-center rounded-full border bg-white hover:bg-[#f8f7f2]"
                      >
                        <Flaticon name="minus" className="text-[10px]" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold">{cart[p.id]}</span>
                      <button
                        onClick={() => change(p.id, 1)}
                        className="grid h-7 w-7 place-items-center rounded-full bg-[#f4ce00] hover:bg-[#dfba00]"
                      >
                        <Flaticon name="plus" className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {count === 0 ? (
              <p className="py-7 text-center text-sm text-[#77766f]">
                Keranjang masih kosong. Tambahkan produk favorit dari katalog di atas.
              </p>
            ) : (
              <>
                <div className="mt-4 flex justify-between font-bold text-base border-t border-[#efeee9] pt-3">
                  <span>Total ({count} paket)</span>
                  <span className="text-xl text-[#938126]">{rupiah(total)}</span>
                </div>

                <form className="mt-5 space-y-4" onSubmit={submitOrder}>
                  {/* Step 1: Info Pembeli */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#63625b] mb-1.5">
                      Kontak Pemesan
                    </label>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      <input
                        name="name"
                        required
                        minLength={2}
                        placeholder="Nama Lengkap Pembeli"
                        className="h-11 rounded-xl border border-[#dedbd0] px-3.5 text-sm outline-none focus:border-[#b69b00] bg-[#faf9f5]"
                      />
                      <input
                        name="phone"
                        required
                        minLength={9}
                        placeholder="Nomor WhatsApp (08...)"
                        className="h-11 rounded-xl border border-[#dedbd0] px-3.5 text-sm outline-none focus:border-[#b69b00] bg-[#faf9f5]"
                      />
                    </div>
                  </div>

                  {/* Step 2: Titik Maps Terintegrasi (Alamat Pasti) */}
                  <div className="rounded-2xl border border-amber-200/90 bg-[#fffdf5] p-3.5 shadow-xs">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f4ce00] text-[11px] font-black text-black">
                          1
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#63530f]">
                          Titik Pasti Pengantaran (Google Maps)
                        </p>
                      </div>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 border border-amber-200">
                        Wajib · Koordinat Akurat
                      </span>
                    </div>
                    <p className="mb-2.5 text-[11px] text-[#7a7457] leading-relaxed">
                      Geser atau ketuk peta di bawah agar kurir Karika Dieng sampai tepat di lokasi Anda.
                    </p>

                    <DeliveryLocationPicker />
                  </div>

                  {/* Step 3: Detail Alamat Tambahan / Patokan */}
                  <div className="rounded-2xl border border-[#dedbd0] bg-white p-3.5">
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#292a23] text-[11px] font-bold text-white">
                          2
                        </span>
                        <p className="text-xs font-bold uppercase tracking-wider text-[#57564f]">
                          Detail Patokan Tambahan (Pendukung)
                        </p>
                      </div>
                      <span className="text-[10px] text-[#88877e]">
                        Keterangan homestay/ruangan
                      </span>
                    </div>
                    <textarea
                      name="address"
                      required
                      minLength={5}
                      placeholder="Contoh: Homestay Dieng Pass Lt. 2 kamar No. 5, atau di samping gapura desa..."
                      className="min-h-18 w-full rounded-xl border border-[#dedbd0] p-3 text-sm outline-none focus:border-[#b69b00] bg-[#faf9f5]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setPayment("qris")}
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        payment === "qris"
                          ? "border-[#b69b00] bg-[#fffbea] shadow-xs"
                          : "border-[#e0ddd2] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Flaticon name="qr" variant="sr" className="text-xs text-[#a28b00]" />
                        <span>QRIS Instan</span>
                      </div>
                      <span className="text-xs text-[#77766f] block mt-0.5">
                        Scan GoPay, BCA, Mandiri
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPayment("cod")}
                      className={`rounded-xl border p-3 text-left text-sm transition ${
                        payment === "cod"
                          ? "border-[#b69b00] bg-[#fffbea] shadow-xs"
                          : "border-[#e0ddd2] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        <Flaticon name="money" variant="sr" className="text-xs text-[#a28b00]" />
                        <span>Tunai (COD)</span>
                      </div>
                      <span className="text-xs text-[#77766f] block mt-0.5">
                        Bayar saat kurir mengantar
                      </span>
                    </button>
                  </div>

                  {count < 5 && (
                    <p className="rounded-xl bg-[#fff8d9] p-3 text-xs leading-5 text-[#6d5d16] font-medium border border-amber-200">
                      Tambahkan {5 - count} paket lagi untuk memenuhi batas minimal 5 paket. Anda bebas mencampur carica, mie ongklok, jamur, dsb.
                    </p>
                  )}

                  {error && (
                    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 font-medium">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={count < 5 || busy}
                    className="w-full rounded-2xl bg-[#292a23] hover:bg-black py-4 text-sm font-bold text-white shadow-md disabled:bg-[#aaa99f] gap-2"
                  >
                    {busy ? (
                      <>
                        <Flaticon name="spinner" className="animate-spin text-sm" />
                        <span>Memproses pesanan &amp; membuat QRIS…</span>
                      </>
                    ) : (
                      <>
                        <Flaticon name="check-circle" variant="sr" className="text-sm" />
                        <span>Pesan Sekarang · {rupiah(total)}</span>
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {/* TRACKING MODAL (Search & Monitor active deliveries without login) */}
      {showTrackingModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={() => setShowTrackingModal(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Pantau Status Pengiriman"
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white p-6 shadow-2xl space-y-5"
          >
            <button
              onClick={() => setShowTrackingModal(false)}
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full hover:bg-[#f4f3ee]"
            >
              <Flaticon name="cross" className="text-xs" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                <Flaticon name="truck-side" variant="sr" className="text-xs text-[#a28b00]" />
                <span>Pelacakan Pengiriman Dieng</span>
              </div>
              <h2 className="mt-2 text-2xl font-extrabold text-[#24251f]">Pantau Pesanan Anda</h2>
              <p className="text-xs text-[#77766f] mt-1">
                Lacak status konfirmasi toko, persiapan paket, dan pengantaran kurir secara real-time.
              </p>
            </div>

            {/* Currently Active Local Order */}
            {activeOrder && (
              <div className="rounded-2xl border-2 border-[#b69b00]/30 bg-[#fdfbf3] p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8a7200]">Pesanan di Perangkat Ini</span>
                  <span className="font-mono text-xs font-bold">{activeOrder.orderNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">Status Pengantaran:</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.color || "bg-slate-100"
                    }`}
                  >
                    {deliveryStatusText[activeOrder.deliveryStatus || "pending"]?.label ||
                      activeOrder.deliveryStatus}
                  </span>
                </div>
                <div className="pt-2">
                  <Link href={`/orders/${activeOrder.orderId}`}>
                    <Button size="sm" className="w-full rounded-xl bg-[#292a23] hover:bg-black text-white font-bold gap-2 text-xs">
                      <Flaticon name="arrow-up-right-from-square" className="text-xs" />
                      <span>Buka Halaman Pesanan &amp; QRIS Lengkap</span>
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Search form for other orders by WhatsApp / Order number */}
            <div className="pt-2 border-t border-[#efeee9] space-y-3">
              <p className="text-xs font-bold text-[#24251f]">
                Lacak dengan Nomor WhatsApp atau No. Pesanan:
              </p>
              <form onSubmit={handleSearchOrder} className="flex gap-2">
                <input
                  value={trackingSearchQuery}
                  onChange={(e) => setTrackingSearchQuery(e.target.value)}
                  placeholder="Contoh: 08123456789 atau ord_..."
                  className="h-10 flex-1 rounded-xl border border-[#dedbd0] px-3 text-xs outline-none focus:border-[#b69b00]"
                />
                <Button type="submit" size="sm" disabled={isSearchingTracking} className="rounded-xl font-bold bg-[#f4ce00] text-black hover:bg-[#dfba00] px-4">
                  {isSearchingTracking ? "Mencari…" : "Cari"}
                </Button>
              </form>

              {searchError && (
                <p className="text-xs text-rose-600 font-medium bg-rose-50 p-2.5 rounded-xl">
                  {searchError}
                </p>
              )}

              {trackingSearchResults.length > 0 && (
                <div className="space-y-2 max-h-44 overflow-y-auto pt-1">
                  {trackingSearchResults.map((ord: any) => (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-[#e8e6df] bg-white text-xs"
                    >
                      <div>
                        <p className="font-mono font-bold">{ord.order_number}</p>
                        <p className="text-[11px] text-[#77766f]">
                          {ord.customer_name} · {rupiah(ord.total_amount)}
                        </p>
                      </div>
                      <Link href={`/orders/${ord.id}`}>
                        <Button size="sm" variant="outline" className="text-[11px] h-8 rounded-lg">
                          Buka
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
