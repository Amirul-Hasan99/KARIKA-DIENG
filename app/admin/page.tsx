"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { BrandLogoIcon } from "@/components/ui/BrandLogo";
import { useKitchenOrders } from "@/hooks/useKitchenOrders";
import { Order, OrderStatus, MenuItem, Category } from "@/types";
import { formatOrderTime, formatRupiah } from "@/lib/utils";
import { printReceiptViaBrowser } from "@/lib/thermal-printer";
import {
  Coffee,
  ChefHat,
  Bell,
  BellOff,
  Printer,
  CheckCircle2,
  Clock,
  ArrowRight,
  Search,
  Volume2,
  Utensils,
  AlertCircle,
  ExternalLink,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Sparkles,
  QrCode,
  Store,
  Download,
  XCircle,
  Check,
  Package,
  Layers,
  Calendar,
  MapPin,
} from "@/components/ui/FlaticonCompat";
import Flaticon from "@/components/ui/Flaticon";
import { KarikaProduct, INITIAL_KARIKA_PRODUCTS, KARIKA_CATEGORIES } from "@/lib/karika-products-data";

export default function AdminDashboardPage() {
  const {
    orders,
    isLoading,
    soundEnabled,
    setSoundEnabled,
    updateOrderStatus,
    playChime,
  } = useKitchenOrders();

  const [activeTab, setActiveTab] = useState<"kds" | "transactions" | "stock">("kds");
  const [kdsFilter, setKdsFilter] = useState<"all" | "received" | "cooking" | "ready" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  type DateFilterType =
    | "all"
    | "today"
    | "yesterday"
    | "this_week"
    | "this_year"
    | "custom";

  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split("T")[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Product & Stock management state (Unified Karika Dieng Catalog)
  const [products, setProducts] = useState<KarikaProduct[]>(INITIAL_KARIKA_PRODUCTS);
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>("Semua");
  const [isStockLoading, setIsStockLoading] = useState(false);
  const [updatingProductId, setUpdatingProductId] = useState<string | null>(null);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Fetch products for stock tab
  useEffect(() => {
    if (activeTab === "stock") {
      loadCatalogStock();
    }
  }, [activeTab]);

  const loadCatalogStock = async () => {
    setIsStockLoading(true);
    try {
      const res = await fetch("/api/products", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      }
    } catch (e) {
      console.error("Failed to load catalog products:", e);
    } finally {
      setIsStockLoading(false);
    }
  };

  const handleToggleStock = async (productId: string, currentAvailable: boolean) => {
    setUpdatingProductId(productId);
    const newStatus = !currentAvailable;

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, is_available: newStatus } : p))
    );

    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, is_available: newStatus }),
      });
    } catch (e) {
      console.error("Error toggling product stock:", e);
      // Rollback if error
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, is_available: currentAvailable } : p))
      );
    } finally {
      setUpdatingProductId(null);
    }
  };

  const handleSavePrice = async (productId: string) => {
    if (editPriceVal <= 0) return;
    setUpdatingProductId(productId);

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, price: editPriceVal } : p))
    );

    try {
      await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: productId, price: editPriceVal }),
      });
      setEditingPriceId(null);
    } catch (e) {
      console.error("Error updating price:", e);
    } finally {
      setUpdatingProductId(null);
    }
  };

  // Cash pending orders
  const cashPendingOrders = useMemo(() => {
    return orders.filter(
      (o) => o.payment_type === "cash" && o.payment_status === "pending"
    );
  }, [orders]);

  // Confirm cash payment
  const handleConfirmCash = async (orderId: string) => {
    try {
      const res = await fetch("/api/orders/confirm-cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        if (soundEnabled) playChime();
      }
    } catch (e) {
      console.error("Confirm cash error:", e);
    }
  };

  // Cancel / Void order
  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan pesanan ini?")) return;
    try {
      await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: "Dibatalkan kasir" }),
      });
    } catch (e) {
      console.error("Cancel order error:", e);
    }
  };

  // Filtered orders for Antrean Pesanan Oleh-Oleh
  const kdsOrders = useMemo(() => {
    return orders.filter((order) => {
      // Show all active orders that are not failed / cancelled
      if (order.payment_status === "failed") return false;

      const matchTab =
        kdsFilter === "all"
          ? order.order_status !== "completed"
          : order.order_status === kdsFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch =
        q === "" ||
        order.order_number.toLowerCase().includes(q) ||
        (order.customer_name && order.customer_name.toLowerCase().includes(q)) ||
        (order.customer_phone && order.customer_phone.includes(q)) ||
        (order.delivery_address && order.delivery_address.toLowerCase().includes(q));

      return matchTab && matchSearch;
    });
  }, [orders, kdsFilter, searchQuery]);

  // Helper for human-readable filter label
  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case "all":
        return "Semua Transaksi";
      case "today":
        return "Hari Ini";
      case "yesterday":
        return "Kemarin";
      case "this_week":
        return "Minggu Ini";
      case "this_year":
        return `Tahun ${new Date().getFullYear()}`;
      case "custom":
        return `${customStartDate || "Awal"} s/d ${customEndDate || "Akhir"}`;
      default:
        return "Semua";
    }
  };

  // All settled transactions for summary and history with date filter
  const settledOrders = useMemo(() => {
    return orders.filter((o) => {
      if (o.payment_status !== "settlement") return false;

      if (dateFilter === "all") return true;

      const orderDate = new Date(o.created_at);
      if (isNaN(orderDate.getTime())) return false;

      const today = new Date();

      if (dateFilter === "today") {
        return (
          orderDate.getDate() === today.getDate() &&
          orderDate.getMonth() === today.getMonth() &&
          orderDate.getFullYear() === today.getFullYear()
        );
      }

      if (dateFilter === "yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        return (
          orderDate.getDate() === yesterday.getDate() &&
          orderDate.getMonth() === yesterday.getMonth() &&
          orderDate.getFullYear() === yesterday.getFullYear()
        );
      }

      if (dateFilter === "this_week") {
        const startOfWeek = new Date(today);
        const day = today.getDay(); // 0 is Sunday, 1 is Monday
        const diff = (day === 0 ? -6 : 1) - day;
        startOfWeek.setDate(today.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      }

      if (dateFilter === "this_year") {
        return orderDate.getFullYear() === today.getFullYear();
      }

      if (dateFilter === "custom") {
        if (customStartDate) {
          const start = new Date(`${customStartDate}T00:00:00`);
          if (orderDate < start) return false;
        }
        if (customEndDate) {
          const end = new Date(`${customEndDate}T23:59:59.999`);
          if (orderDate > end) return false;
        }
        return true;
      }

      return true;
    });
  }, [orders, dateFilter, customStartDate, customEndDate]);

  const totalOmzet = useMemo(() => {
    return settledOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  }, [settledOrders]);

  const counts = useMemo(() => {
    const validOrders = orders.filter((o) => o.payment_status !== "failed");
    return {
      allActive: validOrders.filter((o) => o.order_status !== "completed").length,
      received: validOrders.filter((o) => o.order_status === "received").length,
      cooking: validOrders.filter((o) => o.order_status === "cooking").length,
      ready: validOrders.filter((o) => o.order_status === "ready").length,
      completed: validOrders.filter((o) => o.order_status === "completed").length,
    };
  }, [orders]);

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
            <AlertCircle className="h-3 w-3" strokeWidth={2} /> Pesanan Baru
          </span>
        );
      case "cooking":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-300">
            <Package className="h-3 w-3" strokeWidth={2} /> Sedang Dikemas
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="h-3 w-3" strokeWidth={2} /> Siap Kirim Kurir
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
            Selesai / Terantar
          </span>
        );
    }
  };

  const getNextAction = (current: OrderStatus): { next: OrderStatus; label: string; color: string } | null => {
    switch (current) {
      case "received":
        return { next: "cooking", label: "1. Mulai Kemas & Packing", color: "bg-sky-600 hover:bg-sky-700 text-white" };
      case "cooking":
        return { next: "ready", label: "2. Kemas Selesai (Siap Antar)", color: "bg-emerald-600 hover:bg-emerald-700 text-white" };
      case "ready":
        return { next: "completed", label: "3. Selesaikan Pengiriman", color: "bg-slate-800 hover:bg-slate-900 text-white" };
      default:
        return null;
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "No. Order",
      "Tujuan Pengantaran",
      "Titik Maps",
      "Pelanggan / Kontak",
      "Waktu Pemesanan",
      "Status Bayar",
      "Metode Pembayaran",
      "Total (IDR)",
      "Rincian Paket Oleh-Oleh",
    ];

    const rows = settledOrders.map((o) => {
      const itemsStr = o.items
        .map((i) => `${i.qty}x ${i.name}`)
        .join("; ")
        .replace(/"/g, '""');
      const mapsCoords = o.coordinates ? `${o.coordinates.lat},${o.coordinates.lng}` : "-";
      return [
        `"${o.order_number}"`,
        `"${(o.delivery_address || `Pengantaran Radius ${o.delivery_distance_km || 8} km`).replace(/"/g, '""')}"`,
        `"${mapsCoords}"`,
        `"${(o.customer_name || "Pelanggan").replace(/"/g, '""')} (${o.customer_phone || "-"})"`,
        `"${new Date(o.created_at).toLocaleString("id-ID")}"`,
        `"${o.payment_status}"`,
        `"${o.payment_type || "digital"}"`,
        o.total_amount,
        `"${itemsStr}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const filterSuffix =
      dateFilter === "custom"
        ? `${customStartDate}_sd_${customEndDate}`
        : dateFilter;
    link.setAttribute(
      "download",
      `Laporan_Penjualan_${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#e9e7df] bg-white/95 px-3.5 py-2.5 sm:px-6 sm:py-3.5 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link
              href="/"
              className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#292a23] to-[#454639] text-[#f4ce00] shadow-md shadow-black/10 hover:opacity-95 transition"
              title="Karika Dieng — Beranda"
            >
              <BrandLogoIcon size={24} color="#f4ce00" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-[#24251f] truncate">
                  <span className="sm:hidden">Admin Karika</span>
                  <span className="hidden sm:inline">KARIKA DIENG • ADMIN OPERASIONAL</span>
                </h1>
                <span className="hidden sm:inline-flex rounded-full bg-[#f4ce00]/20 px-2.5 py-0.5 text-[10px] font-black text-[#857200] border border-[#f4ce00]/40 shrink-0">
                  DIENG WONOSOBO
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-[#727168] truncate max-w-[190px] xs:max-w-xs sm:max-w-none">
                Pusat Pengelolaan Produk, Transaksi &amp; Pengantaran 8 KM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Audio chime toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playChime();
              }}
              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold transition border ${
                soundEnabled
                  ? "bg-[#faf8ed] text-[#857200] border-[#ecd983] hover:bg-[#f6f2d9]"
                  : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
              }`}
              title={soundEnabled ? "Notifikasi Suara Aktif" : "Notifikasi Suara Mati"}
            >
              {soundEnabled ? (
                <>
                  <Flaticon name="bell" className="text-xs text-[#857200]" />
                  <span className="hidden sm:inline">Bel: ON</span>
                </>
              ) : (
                <>
                  <Flaticon name="bell-ring" className="text-xs text-slate-400" />
                  <span className="hidden sm:inline">Bel: OFF</span>
                </>
              )}
            </button>

            <Link
              href="/catalog"
              className="flex items-center gap-1.5 rounded-xl border border-[#e4e1d7] bg-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#24251f] hover:bg-[#faf9f5] transition"
            >
              <Flaticon name="shop" className="text-xs text-[#90802a]" />
              <span>Katalog</span>
            </Link>
            <Link
              href="/admin/delivery"
              className="flex items-center gap-1.5 rounded-xl border border-[#ecd983] bg-[#faf8ed] px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-[#857200] hover:bg-[#f6f2d9] transition"
            >
              <Flaticon name="truck-side" className="text-xs text-[#857200]" />
              <span className="hidden sm:inline">Pantau Pengantaran</span>
              <span className="sm:hidden">Kurir</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                try { await fetch("/api/admin/logout", { method: "POST" }); } catch {}
                window.location.replace("/admin/login");
              }}
              className="flex items-center gap-1.5 rounded-xl bg-[#292a23] hover:bg-black px-3 py-2 text-xs font-bold text-white transition"
            >
              <Flaticon name="exit" className="text-xs" />
              <span className="hidden xs:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* KPI Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 truncate mr-2">
                Total Omzet ({getDateFilterLabel()})
              </span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
              {formatRupiah(totalOmzet)}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5 block">
              Dari {settledOrders.length} pesanan lunas
            </span>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">Pesanan Baru Masuk</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-amber-900">
              {counts.received}
            </p>
            <span className="text-[10px] text-amber-700 mt-0.5 block">
              Menunggu diproses toko
            </span>
          </div>

          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-800">Sedang Dikemas</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-sky-900">
              {counts.cooking}
            </p>
            <span className="text-[10px] text-sky-700 mt-0.5 block">
              Proses packing oleh-oleh
            </span>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">Siap Kirim Kurir</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <p className="mt-2 text-xl sm:text-2xl font-black text-emerald-950">
              {counts.ready}
            </p>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              Siap menuju lokasi pembeli
            </span>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab("kds")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "kds"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Antrean Pesanan</span>
              <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] text-white">
                {counts.allActive}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "transactions"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>Laporan Transaksi</span>
              <span className="rounded-full bg-slate-200 px-1.5 py-0.2 text-[10px] text-slate-700">
                {settledOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("stock")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
                activeTab === "stock"
                  ? "bg-[#292a23] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Flaticon name="box-alt" className="text-xs" />
              <span>Kelola Produk &amp; Stok</span>
              <span className="rounded-full bg-[#f4ce00] px-1.5 py-0.2 text-[10px] text-black font-extrabold">
                {products.length}
              </span>
            </button>
          </div>

          {/* Search Box */}
          {activeTab !== "stock" && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari no. order / nama pembeli / no. WA..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* View 1: Order & Delivery Queue (Antrean Pesanan Oleh-Oleh) */}
        {activeTab === "kds" && (
          <div>
            {/* Status Filter Chips */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {[
                { id: "all", label: "Semua Pesanan Aktif", count: counts.allActive },
                { id: "received", label: "Pesanan Baru", count: counts.received },
                { id: "cooking", label: "Sedang Dikemas", count: counts.cooking },
                { id: "ready", label: "Siap Kirim Kurir", count: counts.ready },
                { id: "completed", label: "Riwayat Terkirim", count: counts.completed },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setKdsFilter(chip.id as any)}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition whitespace-nowrap ${
                    kdsFilter === chip.id
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span>{chip.label}</span>
                  <span className="rounded-full bg-black/10 px-1.5 py-0.2 text-[10px]">
                    {chip.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Orders Cards Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-2xl bg-white animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : kdsOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
                  <Package className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Tidak ada antrean pesanan aktif</h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Pesanan oleh-oleh baru dari pembeli akan otomatis muncul di sini secara real-time.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {kdsOrders.map((order) => {
                  const nextAction = getNextAction(order.order_status);
                  const elapsedMinutes = getElapsedMinutes(order.created_at);

                  return (
                    <div
                      key={order.id}
                      className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs hover:shadow-md transition"
                    >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-base font-black text-slate-900">
                                ORDER #{order.order_number}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {getStatusBadge(order.order_status)}
                                <span
                                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                                    order.payment_status === "settlement"
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                      : "bg-amber-50 text-amber-800 border border-amber-300"
                                  }`}
                                >
                                  {order.payment_status === "settlement" ? "Lunas" : "Belum Lunas"}
                                </span>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
                              <span>{formatOrderTime(order.created_at)}</span>
                              <span>•</span>
                              <span className="text-amber-700 font-bold">
                                {elapsedMinutes} mnt lalu
                              </span>
                              <span>•</span>
                              <span className="uppercase">{order.payment_type || "QRIS"}</span>
                            </div>

                            <div className="text-xs text-slate-700 pt-0.5">
                              Pemesan: <strong>{order.customer_name || "Pelanggan"}</strong>{" "}
                              {order.customer_phone && (
                                <span className="text-slate-500 font-mono">({order.customer_phone})</span>
                              )}
                            </div>

                            {/* Alamat & Titik Maps Terintegrasi (Real Input Google Maps & Detail Tambahan) */}
                            <div className="mt-2.5 rounded-xl border border-amber-200/90 bg-[#fffdf7] p-3 text-xs space-y-2 shadow-2xs">
                              {/* 1. Titik Google Maps Pasti */}
                              <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-amber-100 pb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span className="font-bold text-slate-800">Titik Pasti Kurir (Google Maps):</span>
                                </div>
                                {order.coordinates ? (
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.coordinates.lat},${order.coordinates.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 transition"
                                  >
                                    <span>🧭 Buka Rute Kurir ({order.coordinates.lat.toFixed(5)}, {order.coordinates.lng.toFixed(5)})</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-[11px] text-slate-400">Koordinat tidak tersedia</span>
                                )}
                              </div>

                              {/* 2. Detail Patokan Alamat Real dari Form Checkout */}
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Patokan / Alamat Tambahan Pembeli:
                                </span>
                                <p className="font-semibold text-slate-900 bg-white p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                                  {order.delivery_address && order.delivery_address.trim() !== ""
                                    ? order.delivery_address
                                    : "Tidak ada catatan patokan tambahan."}
                                </p>
                              </div>

                              {/* 3. Estimasi Jarak & WhatsApp Kontak Langsung */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-600">
                                <span>
                                  Jarak Tempuh: <strong className="text-slate-900">{order.delivery_distance_km ? `~${order.delivery_distance_km} km` : "Radius 8 km"}</strong> dari Toko Dieng
                                </span>
                                {order.customer_phone && (
                                  <a
                                    href={`https://wa.me/${order.customer_phone.replace(/\D/g, "").replace(/^0/, "62")}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1 hover:underline"
                                  >
                                    <span>Chat WA Pembeli</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="py-3 space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="rounded-xl bg-slate-50 p-2.5 text-xs">
                              <div className="flex justify-between font-bold text-slate-900">
                                <span>{item.qty}x {item.name}</span>
                                <span>{formatRupiah(item.subtotal)}</span>
                              </div>

                              {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {item.selected_modifiers.map((mod, mIdx) => (
                                    <span
                                      key={mIdx}
                                      className="rounded bg-amber-100/80 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900"
                                    >
                                      {mod.option_name}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {item.notes && (
                                <p className="mt-1 text-[10px] text-amber-700 italic bg-amber-50 rounded px-1.5 py-0.5">
                                  Catatan: &ldquo;{item.notes}&rdquo;
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-3 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium text-slate-500">Total Tagihan:</span>
                          <span className="font-black text-amber-600 text-sm">
                            {formatRupiah(order.total_amount)}
                          </span>
                        </div>

                        {order.payment_status !== "settlement" && (
                          <button
                            onClick={() => handleConfirmCash(order.id)}
                            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold transition shadow-xs"
                          >
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                            <span>Konfirmasi Pembayaran Lunas</span>
                          </button>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => printReceiptViaBrowser(order)}
                            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                            title="Cetak Struk Thermal"
                          >
                            <Printer className="h-4 w-4 text-slate-600" />
                          </button>

                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                            title="Batalkan Pesanan (Void)"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>

                          {nextAction && (
                            <button
                              onClick={() => updateOrderStatus(order.id, nextAction.next)}
                              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition shadow-xs ${nextAction.color}`}
                            >
                              <span>{nextAction.label}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 3: All Settled Transactions with Expanded Date Filter & CSV Export */}
        {activeTab === "transactions" && (
          <div className="space-y-4">
            {/* Header & Filter Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">
                      Rekap Penjualan &amp; Riwayat Pesanan
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      {getDateFilterLabel()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Ditemukan <strong className="text-slate-800">{settledOrders.length} transaksi lunas</strong> • Total Omzet:{" "}
                    <strong className="text-emerald-700 font-bold">{formatRupiah(totalOmzet)}</strong>
                  </p>
                </div>

                {/* Export CSV Button */}
                <button
                  onClick={handleExportCSV}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2 text-xs font-bold text-white transition shadow-2xs active:scale-95 shrink-0"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Laporan CSV</span>
                </button>
              </div>

              {/* Filter Controls: Presets + Date Range Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Preset Filters */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl text-xs">
                  <button
                    onClick={() => setDateFilter("all")}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "all"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setDateFilter("today")}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "today"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    onClick={() => setDateFilter("yesterday")}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "yesterday"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Kemarin
                  </button>
                  <button
                    onClick={() => setDateFilter("this_week")}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "this_week"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Minggu Ini
                  </button>
                  <button
                    onClick={() => setDateFilter("this_year")}
                    className={`rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "this_year"
                        ? "bg-white text-slate-900 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Tahunan ({new Date().getFullYear()})
                  </button>
                  <button
                    onClick={() => setDateFilter("custom")}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-bold transition ${
                      dateFilter === "custom"
                        ? "bg-amber-500 text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Rentang Tanggal</span>
                  </button>
                </div>

                {/* Custom Date Range Picker */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Dari:</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => {
                        setCustomStartDate(e.target.value);
                        setDateFilter("custom");
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-semibold text-slate-700">Sampai:</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => {
                        setCustomEndDate(e.target.value);
                        setDateFilter("custom");
                      }}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {dateFilter === "custom" && (
                    <button
                      onClick={() => {
                        const todayStr = new Date().toISOString().split("T")[0];
                        setCustomStartDate(todayStr);
                        setCustomEndDate(todayStr);
                      }}
                      className="text-[11px] font-bold text-amber-700 hover:underline px-1"
                    >
                      Hari Ini
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No. Order</th>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Tujuan &amp; Titik Maps</th>
                    <th className="px-4 py-3">Pemesan &amp; WhatsApp</th>
                    <th className="px-4 py-3">Metode</th>
                    <th className="px-4 py-3">Item Pesanan</th>
                    <th className="px-4 py-3">Total Nominal</th>
                    <th className="px-4 py-3">Status Pengiriman</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {settledOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Tidak ada transaksi pada filter ini
                      </td>
                    </tr>
                  ) : (
                    settledOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {order.order_number}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatOrderTime(order.created_at)}
                        </td>
                        <td className="px-4 py-3 max-w-xs">
                          <p className="font-semibold text-slate-900 text-xs">
                            {order.delivery_address || `Pengantaran Dieng (Radius 8 km)`}
                          </p>
                          {order.coordinates ? (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${order.coordinates.lat},${order.coordinates.lng}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-amber-700 hover:underline font-bold inline-flex items-center gap-0.5 mt-0.5"
                            >
                              <span>Buka Maps ({order.coordinates.lat.toFixed(4)}, {order.coordinates.lng.toFixed(4)})</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">Titik Kawasan Dieng</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-800">
                          <span className="font-semibold block">{order.customer_name || "-"}</span>
                          {order.customer_phone && (
                            <span className="text-[11px] text-slate-500 font-mono">
                              {order.customer_phone}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                              order.payment_type === "cash"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-sky-100 text-sky-800"
                            }`}
                          >
                            {order.payment_type === "cash" ? "Tunai (Cash)" : "QRIS"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                          {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 font-black text-amber-600">
                          {formatRupiah(order.total_amount)}
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(order.order_status)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => printReceiptViaBrowser(order)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                          >
                            <Printer className="h-3 w-3" />
                            <span>Struk</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* View 4: Stock & Product Management (Kelola Produk & Stok Karika Dieng) */}
        {activeTab === "stock" && (
          <div className="space-y-5">
            {/* Control Panel & Filters */}
            <div className="rounded-3xl border border-[#e9e7df] bg-white p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#faf8ed] text-[#857200] border border-[#ecd983]">
                      <Flaticon name="box-alt" className="text-sm" />
                    </div>
                    <h3 className="text-base font-extrabold text-[#24251f]">
                      Manajemen Produk &amp; Stok Katalog Karika Dieng
                    </h3>
                  </div>
                  <p className="text-xs text-[#727168] mt-1 max-w-2xl">
                    Produk di bawah ini tersinkronisasi 100% dengan katalog pembeli. Jika stok fisik habis atau harga berubah, ubah status di sini dan katalog pembeli akan langsung terupdate real-time.
                  </p>
                </div>

                {/* Stock Stats Pills */}
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Flaticon name="check-circle" className="text-xs text-emerald-600" />
                    <span>{products.filter((p) => p.is_available !== false).length} Tersedia</span>
                  </span>
                  <span className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <Flaticon name="cross-circle" className="text-xs text-rose-600" />
                    <span>{products.filter((p) => p.is_available === false).length} Habis</span>
                  </span>
                </div>
              </div>

              {/* Category Filter Chips */}
              <div className="mt-4 pt-4 border-t border-[#efeee9] flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs font-bold text-[#85857f] uppercase tracking-wider mr-1">
                  Kategori:
                </span>
                {["Semua", "Carica", "Makanan", "Camilan", "Minuman"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setProductCategoryFilter(cat)}
                    className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      productCategoryFilter === cat
                        ? "bg-[#292a23] text-white shadow-xs"
                        : "bg-[#faf9f5] border border-[#e4e1d7] text-[#66665e] hover:bg-white"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {isStockLoading ? (
              <div className="py-16 text-center text-xs text-slate-400">
                <Flaticon name="spinner" className="text-2xl animate-spin text-[#90802a] mx-auto mb-2" />
                <p>Memuat katalog produk Karika Dieng...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products
                  .filter(
                    (p) =>
                      productCategoryFilter === "Semua" || p.group === productCategoryFilter
                  )
                  .map((product) => {
                    const isAvailable = product.is_available !== false;
                    const isUpdating = updatingProductId === product.id;
                    const isEditingPrice = editingPriceId === product.id;

                    return (
                      <div
                        key={product.id}
                        className={`rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                          isAvailable
                            ? "bg-white border-[#e9e7df] shadow-xs hover:shadow-md"
                            : "bg-[#faf9f6] border-rose-200 opacity-85"
                        }`}
                      >
                        <div>
                          {/* Image Thumbnail & Status Badge */}
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#eeece4]">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                              <span className="rounded-full bg-[#292a23]/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-xs">
                                {product.group}
                              </span>
                              <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold text-slate-800 shadow-xs">
                                {product.pack}
                              </span>
                            </div>

                            <span
                              className={`absolute top-2.5 right-2.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs ${
                                isAvailable
                                  ? "bg-emerald-600 text-white"
                                  : "bg-rose-600 text-white"
                              }`}
                            >
                              {isAvailable ? "Tersedia" : "Stok Habis"}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-4 sm:p-5">
                            <h4 className="text-base font-extrabold text-[#24251f]">
                              {product.name}
                            </h4>
                            <p className="mt-1 text-xs text-[#74736b] line-clamp-2 leading-relaxed">
                              {product.description}
                            </p>

                            {/* Price & Edit Block */}
                            <div className="mt-4 pt-3 border-t border-[#efeee9] flex items-center justify-between">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#958329]">
                                  Harga Jual (Paket)
                                </span>
                                {isEditingPrice ? (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <input
                                      type="number"
                                      value={editPriceVal}
                                      onChange={(e) => setEditPriceVal(Number(e.target.value))}
                                      className="w-28 rounded-lg border border-[#f4ce00] px-2 py-1 text-xs font-bold text-[#24251f] outline-none"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSavePrice(product.id)}
                                      className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingPriceId(null)}
                                      className="rounded-lg bg-slate-200 px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-300"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-lg font-black text-[#24251f]">
                                      {formatRupiah(product.price)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingPriceId(product.id);
                                        setEditPriceVal(product.price);
                                      }}
                                      className="text-[10px] font-bold text-[#8a7200] hover:underline"
                                    >
                                      [Ubah]
                                    </button>
                                  </div>
                                )}
                              </div>

                              <span className="text-[11px] font-semibold text-slate-400">
                                {product.pack}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Action Footer */}
                        <div className="p-4 sm:p-5 pt-0">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleStock(product.id, isAvailable)}
                            className={`w-full flex items-center justify-center gap-2 rounded-2xl py-2.5 px-4 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
                              isAvailable
                                ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20"
                            }`}
                          >
                            {isUpdating ? (
                              <>
                                <Flaticon name="spinner" className="text-xs animate-spin" />
                                <span>Menyimpan ke Katalog...</span>
                              </>
                            ) : isAvailable ? (
                              <>
                                <Flaticon name="cross-circle" className="text-xs" />
                                <span>Tandai Habis (Sold Out)</span>
                              </>
                            ) : (
                              <>
                                <Flaticon name="check-circle" className="text-xs" />
                                <span>Aktifkan Kembali ke Katalog</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
