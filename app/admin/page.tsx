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

interface Courier {
  id: string;
  name: string;
  phone: string;
  zone: string;
}

const DIENG_COURIERS: Courier[] = [
  { id: "k1", name: "Kurir 1 - Slamet Dieng", phone: "083122046357", zone: "Dieng Kulon & Kompleks Candi" },
  { id: "k2", name: "Kurir 2 - Wahyu Sikunir", phone: "081234567891", zone: "Sembungan & Puncak Sikunir" },
  { id: "k3", name: "Kurir 3 - Budi Telaga", phone: "085678901234", zone: "Telaga Warna & Pengilon" },
  { id: "k4", name: "Kurir 4 - Agus Prau", phone: "087812345678", zone: "Patakbanteng & Jalur Prau" },
  { id: "k5", name: "Kurir 5 - Rian Kejajar", phone: "089612345678", zone: "Kejajar & Jalur Wonosobo" },
];

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
  const [kdsFilter, setKdsFilter] = useState<"all" | "received" | "cooking" | "ready" | "completed" | "cancelled">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [selectedCouriers, setSelectedCouriers] = useState<Record<string, string>>({});
  const [transactionStatusFilter, setTransactionStatusFilter] = useState<"all" | "settlement" | "failed">("all");
  const [selectedOrderForProof, setSelectedOrderForProof] = useState<Order | null>(null);

  // Product modal & CRUD form state
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<KarikaProduct | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    group: "Carica" as "Carica" | "Makanan" | "Camilan" | "Minuman",
    pack: "",
    price: 0,
    stock_qty: 50,
    description: "",
    image: "",
    is_available: true,
  });

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

  // Generate WhatsApp Assignment link for selected Courier
  const getAssignCourierWhatsAppUrl = (order: Order, courier: Courier) => {
    const gmapsUrl = order.coordinates
      ? `https://www.google.com/maps/dir/?api=1&destination=${order.coordinates.lat},${order.coordinates.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_address || "Dieng Wonosobo")}`;

    const itemsText = order.items
      .map((item) => `- ${item.name} (${item.qty} paket)`)
      .join("\n");

    const message = `*TUGAS PENGANTARAN OLEH-OLEH - DIOLEH - OLEH DIENG*
Halo Mas/Mbak ${courier.name}, ada tugas pengantaran pesanan baru:

*DETAIL PESANAN:*
- No. Order: #${order.order_number}
- Pemesan: ${order.customer_name || "Pelanggan"} (${order.customer_phone || "-"})
- Total Belanja: ${formatRupiah(order.total_amount)}
- Status Bayar: ${
      order.payment_status === "settlement"
        ? "SUDAH LUNAS (QRIS) - JANGAN TAGIH KE PEMBELI"
        : `COD / BAYAR DI TEMPAT: ${formatRupiah(order.total_amount)}`
    }

*RUTE & ALAMAT PENGANTARAN:*
- Titik Asal: Sentra Dioleh - oleh Dieng (Titik 0 Km)
- Patokan Alamat: ${order.delivery_address || "Kawasan Dataran Tinggi Dieng"}
- Estimasi Jarak: ~${order.delivery_distance_km ?? 8} km
- Link Rute Google Maps:
${gmapsUrl}

*RINCIAN PAKET OLEH-OLEH:*
${itemsText}

Mohon kurir segera ambil paket di sentra Dioleh - oleh Dieng dan meluncur ke lokasi pembeli. Hubungi pembeli jika sudah dekat lokasi. Terima kasih!`;

    const cleanPhone = courier.phone.replace(/\D/g, "").replace(/^0/, "62");
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Generate WhatsApp Official Receipt link for Buyer
  const getBuyerReceiptWhatsAppUrl = (order: Order) => {
    const cleanPhone = (order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "62");
    if (!cleanPhone) return "#";

    const trackingUrl = typeof window !== "undefined"
      ? `${window.location.origin}/orders/${order.id}`
      : `https://dioleh-oleh-dieng.vercel.app/orders/${order.id}`;

    const itemsText = order.items
      .map((item) => `- ${item.name}\n  ${item.qty} paket x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}`)
      .join("\n");

    const message = `*STRUK PEMBAYARAN RESMI - DIOLEH - OLEH DIENG*
Sentra Oleh-Oleh Khas Dataran Tinggi Dieng & Wonosobo
Titik 0 Km Dieng · Telp/WA Toko: 0831-2204-6357
================================
No. Pesanan : #${order.order_number}
Waktu Pesan : ${formatOrderTime(order.created_at)}
Pelanggan   : ${order.customer_name || "Pelanggan"}
WhatsApp    : ${order.customer_phone || "-"}
Status      : LUNAS (TERVERIFIKASI ADMIN)
Metode      : ${order.payment_type ? order.payment_type.toUpperCase() : "QRIS"}
================================
RINCIAN BELANJA:
${itemsText}
================================
TOTAL PEMBAYARAN : ${formatRupiah(order.total_amount)}
================================
*ALAMAT TUJUAN PENGANTARAN:*
${order.delivery_address || "Kawasan Dataran Tinggi Dieng"}
${order.coordinates ? `Koordinat: ${order.coordinates.lat.toFixed(5)}, ${order.coordinates.lng.toFixed(5)}` : ""}

*STATUS PENGIRIMAN:*
Pesanan Anda telah kami terima & di-ACC dengan baik. Kurir sedang menyiapkan paket oleh-oleh hangat Anda dan segera meluncur ke lokasi!

*PANTAU LIVE STATUS PENGANTARAN:*
${trackingUrl}

Matur nuwun sanget sampun blonjo wonten Dioleh - oleh Dieng! Selamat menikmati liburan di Dieng.`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Generate Unified WhatsApp Confirmation link to Buyer tailored by Payment Type (QRIS vs Cash/COD)
  const getBuyerConfirmationWhatsAppUrl = (order: Order) => {
    const cleanPhone = (order.customer_phone || "").replace(/\D/g, "").replace(/^0/, "62");
    if (!cleanPhone) return "#";

    const trackingUrl = typeof window !== "undefined"
      ? `${window.location.origin}/orders/${order.id}`
      : `https://dioleh-oleh-dieng.vercel.app/orders/${order.id}`;

    const itemsSummary = order.items
      .map((item) => `- ${item.qty}x ${item.name} (${formatRupiah(item.subtotal)})`)
      .join("\n");

    const isCashOrCod = order.payment_type === "cash" || order.payment_type === "cod";

    let message = "";

    if (isCashOrCod) {
      // Template untuk metode bayar Cash / COD di tempat
      message = `Halo Kak *${order.customer_name || "Pelanggan"}*, terima kasih banyak telah memesan di *Dioleh - oleh Dieng*! 🙏

Pesanan Anda dengan nomor *#${order.order_number}* telah kami terima dan terkonfirmasi dengan metode pembayaran *COD (Bayar Tunai di Tempat)* 💵

*RINCIAN PESANAN:*
${itemsSummary}
*Total Tagihan: ${formatRupiah(order.total_amount)}*

*ALAMAT & TITIK PENGANTARAN:*
${order.delivery_address || "Kawasan Penginapan Dataran Tinggi Dieng"}
${order.coordinates ? `Titik Google Maps: https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}` : ""}

Mohon kesediaannya menunggu di titik pengiriman yang telah ditentukan, serta mempersiapkan uang tunai pas sebesar *${formatRupiah(order.total_amount)}* saat kurir kami tiba di lokasi pengantaran ya Kak.

Kurir kami sedang menyiapkan paket oleh-oleh hangat Anda dan segera meluncur ke lokasi. Pantau status live kurir di link ini:
${trackingUrl}

Jika ada patokan tambahan, silakan balas chat ini ya Kak. Terima kasih banyak! 🛵`;
    } else {
      // Template untuk metode bayar QRIS (Sudah bayar / lunas)
      message = `Halo Kak *${order.customer_name || "Pelanggan"}*, terima kasih banyak telah memesan di *Dioleh - oleh Dieng*! 🙏

Pesanan Anda dengan nomor *#${order.order_number}* telah kami verifikasi dan pembayaran via *QRIS (${formatRupiah(order.total_amount)})* telah berhasil diterima (LUNAS) ✅

*RINCIAN PESANAN:*
${itemsSummary}
*Total: ${formatRupiah(order.total_amount)}*

*ALAMAT & TITIK PENGANTARAN:*
${order.delivery_address || "Kawasan Penginapan Dataran Tinggi Dieng"}
${order.coordinates ? `Titik Google Maps: https://www.google.com/maps/search/?api=1&query=${order.coordinates.lat},${order.coordinates.lng}` : ""}

Saat ini pesanan Anda sedang dikemas dengan rapi dan higienis. Kurir kami segera berangkat dalam perjalanan menuju lokasi Anda. Mohon ditunggu kedatangan kurir kami ya Kak! 🛵

Pantau status live perjalanan kurir di link ini:
${trackingUrl}

Jika ada petunjuk arah atau patokan tambahan, silakan balas chat ini ya Kak. Selamat menikmati liburan di Dieng! 🌄`;
    }

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Restore Cancelled Order
  const handleRestoreOrder = async (orderId: string) => {
    if (!confirm("Pulihkan pesanan ini kembali ke antrean aktif?")) return;
    try {
      await updateOrderStatus(orderId, "received");
      alert("Pesanan berhasil dipulihkan ke antrean pesanan baru.");
    } catch (e) {
      console.error("Restore order error:", e);
      alert("Gagal memulihkan pesanan.");
    }
  };

  // Permanent Delete Order
  const handlePermanentDelete = async (orderId: string) => {
    if (!confirm("⚠️ PERINGATAN! Anda akan menghapus pesanan ini secara PERMANEN dari SEMUA database (lokal, Neon, Firestore).\n\nTindakan ini TIDAK DAPAT DIBATALKAN dan data akan hilang selamanya.\n\nLanjutkan?")) {
      return;
    }

    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: orderId, action: "delete" }),
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus pesanan.");
      }

      // Refresh data
      // Polling hook akan otomatis update data
      // Tutup modal jika sedang terbuka
      setSelectedOrderDetail(null);
      alert("Pesanan berhasil dihapus secara permanen.");
    } catch (error) {
      console.error("Error deleting order:", error);
      alert("Gagal menghapus pesanan. Silakan coba lagi.");
    }
  };

  // Product CRUD Form Handlers
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: "",
      group: "Carica",
      pack: "1 paket",
      price: 25000,
      stock_qty: 50,
      description: "",
      image: "/images/hero-dieng.jpg",
      is_available: true,
    });
    setIsAddProductOpen(true);
  };

  const handleOpenEditProduct = (prod: KarikaProduct) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      group: prod.group,
      pack: prod.pack,
      price: prod.price,
      stock_qty: prod.stock_qty || 50,
      description: prod.description,
      image: prod.image,
      is_available: prod.is_available !== false,
    });
    setIsAddProductOpen(true);
  };

  const handleSubmitProductForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || Number(productForm.price) <= 0) {
      alert("Nama produk dan harga wajib diisi dengan benar.");
      return;
    }

    try {
      if (editingProduct) {
        // Edit existing product
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            ...productForm,
          }),
        });
        if (res.ok) {
          await loadCatalogStock();
          setIsAddProductOpen(false);
          setEditingProduct(null);
        } else {
          alert("Gagal memperbarui produk.");
        }
      } else {
        // Add new product
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            ...productForm,
          }),
        });
        if (res.ok) {
          await loadCatalogStock();
          setIsAddProductOpen(false);
        } else {
          alert("Gagal menambahkan produk baru.");
        }
      }
    } catch (err) {
      console.error("Save product error:", err);
      alert("Terjadi kesalahan saat menyimpan produk.");
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}" dari katalog?`)) return;
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Gagal menghapus produk.");
      }
    } catch (err) {
      console.error("Delete product error:", err);
    }
  };

  // Filtered orders for Antrean Pesanan Oleh-Oleh
  const kdsOrders = useMemo(() => {
    return orders.filter((order) => {
      // If filtering for cancelled, only show cancelled
      if (kdsFilter === "cancelled") {
        if (order.payment_status !== "failed") return false;
      } else {
        // Otherwise hide cancelled orders from normal flow
        if (order.payment_status === "failed") return false;
      }

      const matchTab =
        kdsFilter === "all"
          ? order.order_status !== "completed"
          : kdsFilter === "cancelled"
          ? true
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

  // Filtered transactions for report table, Excel & PDF export
  const filteredTransactions = useMemo(() => {
    return orders.filter((o) => {
      // Filter status transaksi
      if (transactionStatusFilter === "settlement" && o.payment_status !== "settlement") return false;
      if (transactionStatusFilter === "failed" && o.payment_status !== "failed") return false;

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
        const day = today.getDay();
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
  }, [orders, dateFilter, customStartDate, customEndDate, transactionStatusFilter]);

  const settledOrders = useMemo(() => {
    return filteredTransactions.filter((o) => o.payment_status === "settlement");
  }, [filteredTransactions]);

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
      cancelled: orders.filter((o) => o.payment_status === "failed").length,
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

  // Ekspor Laporan Excel (.csv dengan BOM UTF-8)
  const handleExportExcel = () => {
    const headers = [
      "No. Pesanan",
      "Waktu Transaksi",
      "Nama Pelanggan",
      "Nomor WhatsApp",
      "Alamat Pengantaran",
      "Titik Maps GPS",
      "Metode Pembayaran",
      "Status Pembayaran",
      "Total Belanja (Rp)",
      "Rincian Item Oleh-Oleh",
    ];

    const rows = filteredTransactions.map((o) => {
      const itemsStr = o.items
        .map((i) => `${i.qty}x ${i.name} (Rp${i.price})`)
        .join("; ")
        .replace(/"/g, '""');
      const mapsCoords = o.coordinates ? `${o.coordinates.lat},${o.coordinates.lng}` : "-";
      return [
        `"${o.order_number}"`,
        `"${new Date(o.created_at).toLocaleString("id-ID")}"`,
        `"${(o.customer_name || "Pelanggan").replace(/"/g, '""')}"`,
        `"${(o.customer_phone || "-").replace(/"/g, '""')}"`,
        `"${(o.delivery_address || `Radius ${o.delivery_distance_km || 8} km`).replace(/"/g, '""')}"`,
        `"${mapsCoords}"`,
        `"${o.payment_type ? o.payment_type.toUpperCase() : "QRIS"}"`,
        `"${o.payment_status === "settlement" ? "Lunas" : o.payment_status === "failed" ? "Dibatalkan" : "Menunggu Bayar"}"`,
        o.total_amount,
        `"${itemsStr}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filterSuffix =
      dateFilter === "custom"
        ? `${customStartDate}_sd_${customEndDate}`
        : dateFilter;
    link.download = `Laporan_Penjualan_Dioleh_Oleh_Dieng_${filterSuffix}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Ekspor Laporan PDF Resmi Berbahasa Indonesia dengan Header & Footer Toko
  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Izinkan pop-up peramban Anda untuk mencetak / menyimpan PDF.");
      return;
    }

    const itemsHtml = filteredTransactions
      .map(
        (o, idx) => `
        <tr>
          <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; font-family: monospace; font-weight: bold;">${o.order_number}</td>
          <td style="padding: 7px; border: 1px solid #cbd5e1;">${new Date(o.created_at).toLocaleString("id-ID")}</td>
          <td style="padding: 7px; border: 1px solid #cbd5e1;">
            <strong>${o.customer_name || "Pelanggan"}</strong><br/>
            <span style="font-size: 11px; color: #475569;">${o.customer_phone || "-"}</span>
          </td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; font-size: 11px;">
            ${o.delivery_address || "Kawasan Dataran Tinggi Dieng"}
          </td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; font-size: 11px;">
            ${o.items.map((i) => `${i.qty}x ${i.name}`).join("<br/>")}
          </td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; text-transform: uppercase; font-size: 11px;">
            ${o.payment_type || "QRIS"}
          </td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: center; font-size: 11px;">
            <span style="padding: 2px 6px; border-radius: 4px; font-weight: bold; background: ${
              o.payment_status === "settlement"
                ? "#dcfce7; color: #166534"
                : o.payment_status === "failed"
                ? "#fee2e2; color: #991b1b"
                : "#fef3c7; color: #92400e"
            }">
              ${o.payment_status === "settlement" ? "LUNAS" : o.payment_status === "failed" ? "DIBATALKAN" : "PENDING"}
            </span>
          </td>
          <td style="padding: 7px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">
            ${formatRupiah(o.total_amount)}
          </td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8"/>
        <title>Laporan Penjualan - Dioleh - oleh Dieng</title>
        <style>
          @page { size: A4 landscape; margin: 12mm; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 15px; font-size: 12px; }
          .header { border-bottom: 3px double #f4ce00; padding-bottom: 12px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-start; }
          .title { font-size: 20px; font-weight: 900; color: #24251f; margin: 0; }
          .subtitle { font-size: 12px; color: #64748b; margin: 2px 0 0 0; }
          .report-info { text-align: right; font-size: 12px; }
          .kpi-box { display: flex; gap: 15px; margin-bottom: 14px; }
          .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 14px; background: #f8fafc; flex: 1; }
          .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .kpi-val { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px; }
          th { background: #292a23; color: #ffffff; padding: 9px 7px; font-size: 10px; text-transform: uppercase; text-align: left; border: 1px solid #334155; }
          .footer { border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">DIOLEH - OLEH DIENG</h1>
            <p class="subtitle">Sentra Oleh-Oleh Khas Dataran Tinggi Dieng &amp; Kabupaten Wonosobo</p>
            <p style="font-size: 11px; color: #475569; margin: 2px 0 0 0;">Titik 0 Km Dieng, Kejajar, Wonosobo, Jawa Tengah · WA Toko: 0831-2204-6357</p>
          </div>
          <div class="report-info">
            <h2 style="font-size: 14px; margin: 0; font-weight: bold; color: #b45309;">LAPORAN REKAPITULASI PENJUALAN</h2>
            <p style="margin: 3px 0 0 0;">Periode: <strong>${getDateFilterLabel()}</strong></p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Dicetak pada: ${new Date().toLocaleString("id-ID")}</p>
          </div>
        </div>

        <div class="kpi-box">
          <div class="kpi-card">
            <div class="kpi-label">Total Transaksi Sesuai Filter</div>
            <div class="kpi-val">${filteredTransactions.length} Pesanan</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Transaksi Berhasil (Lunas)</div>
            <div class="kpi-val" style="color: #15803d;">${settledOrders.length} Pesanan</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Pendapatan Bersih (Omzet)</div>
            <div class="kpi-val" style="color: #15803d;">${formatRupiah(totalOmzet)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 25px; text-align: center;">No</th>
              <th>No. Order</th>
              <th>Waktu</th>
              <th>Pelanggan</th>
              <th>Alamat Antar</th>
              <th>Paket Oleh-Oleh</th>
              <th>Metode</th>
              <th style="text-align: center;">Status</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px;">Tidak ada transaksi pada periode yang dipilih.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Dioleh - oleh Dieng · Dokumen Laporan Rekapitulasi Kasir &amp; Penjualan Resmi</span>
          <span>Dicetak otomatis oleh Sistem Manajemen Kasir Dioleh - oleh Dieng</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
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
              title="Dioleh - oleh Dieng — Beranda"
            >
              <BrandLogoIcon size={24} color="#f4ce00" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-[#24251f] truncate">
                  <span className="sm:hidden">Dioleh - oleh Dieng</span>
                  <span className="hidden sm:inline">DIOLEH - OLEH DIENG • ADMIN OPERASIONAL</span>
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
                { id: "cancelled", label: "Dibatalkan / Void", count: counts.cancelled },
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
              <div className="grid grid-rows-2 grid-flow-col auto-cols-[88vw] xs:auto-cols-[360px] sm:auto-cols-auto gap-3.5 sm:gap-4 overflow-x-auto admin-order-scroll pb-4 sm:pb-0 sm:grid-rows-none sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-72 rounded-2xl bg-white animate-pulse border border-slate-200" />
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
              <>
                {kdsOrders.length >= 2 && (
                  <div className="flex sm:hidden items-center justify-between text-[11px] text-slate-500 mb-2.5 px-1">
                    <span className="flex items-center gap-1 font-bold text-amber-800">
                      <Package className="h-3.5 w-3.5 text-amber-600" />
                      <span>{kdsOrders.length} Pesanan Antrean</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200/70 px-2.5 py-0.5 rounded-full font-semibold shadow-2xs">
                      <span>2 Card ke bawah • Geser ke kanan</span>
                      <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                )}
                <div
                  className={`gap-3.5 sm:gap-4 pb-4 sm:pb-0 overflow-x-auto admin-order-scroll sm:overflow-visible snap-x snap-mandatory sm:snap-none ${
                    kdsOrders.length >= 2
                      ? "grid grid-rows-2 grid-flow-col auto-cols-[88vw] xs:auto-cols-[360px] sm:auto-cols-auto sm:grid-rows-none sm:grid-flow-row sm:grid-cols-2 lg:grid-cols-3"
                      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                  }`}
                >
                  {kdsOrders.map((order) => {
                    const nextAction = getNextAction(order.order_status);
                    const elapsedMinutes = getElapsedMinutes(order.created_at);

                    return (
                      <div
                        key={order.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-md transition snap-start h-full"
                      >
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                          <div className="space-y-1 w-full">
                            <div className="flex items-center justify-between gap-2">
                              <h3 className="text-base font-black text-slate-900 tracking-tight">
                                ORDER #{order.order_number}
                              </h3>
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
                      <div className="pt-3 border-t border-slate-100 space-y-2.5">
                        {order.payment_status === "failed" ? (
                          <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                                <XCircle className="h-4 w-4 text-rose-600" />
                                <span>Pesanan Dibatalkan (Void)</span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 bg-white border border-rose-200 px-2 py-0.5 rounded">
                                Tetap Tersimpan di Sistem
                              </span>
                            </div>
                            <p className="text-[11px] text-rose-600 leading-snug">
                              Pesanan ini dibatalkan namun riwayat tidak hilang. Anda dapat menghubungi pembeli atau memulihkan statusnya kapan saja.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                onClick={() => handleRestoreOrder(order.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black text-white py-2 px-3 text-xs font-bold transition shadow-xs"
                              >
                                <span>↺ Pulihkan Pesanan</span>
                              </button>
                              {order.customer_phone && (
                                <a
                                  href={`https://wa.me/${order.customer_phone.replace(/\D/g, "").replace(/^0/, "62")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center justify-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white p-2 text-xs font-bold transition shadow-xs"
                                  title="Chat WhatsApp Pembeli"
                                >
                                  <Flaticon name="whatsapp" variant="brands" className="text-xs" />
                                  <span>Chat WA</span>
                                </a>
                              )}
                              <button
                                onClick={() => setSelectedOrderDetail(order)}
                                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                title="Lihat Detail Pesanan"
                              >
                                <span>Detail</span>
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(order.id)}
                                className="flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs font-bold text-rose-600 hover:bg-rose-100 transition shadow-2xs"
                                title="Hapus Permanen"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Selector 5 Kurir WhatsApp Dieng */}
                            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-2.5 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sky-900 flex items-center gap-1">
                                  <span>🛵</span>
                                  <span>Pilih Kurir Dieng:</span>
                                </span>
                                <span className="text-[10px] font-bold text-sky-700 bg-white border border-sky-200 px-1.5 py-0.5 rounded">
                                  5 Nomor Siap Antar
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <select
                                  value={selectedCouriers[order.id] || "k1"}
                                  onChange={(e) =>
                                    setSelectedCouriers({
                                      ...selectedCouriers,
                                      [order.id]: e.target.value,
                                    })
                                  }
                                  className="w-full text-[11px] font-semibold bg-white border border-sky-300 rounded-lg p-1.5 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                >
                                  {DIENG_COURIERS.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name} ({c.phone}) - {c.zone}
                                    </option>
                                  ))}
                                </select>

                                <a
                                  href={getAssignCourierWhatsAppUrl(
                                    order,
                                    DIENG_COURIERS.find(
                                      (c) => c.id === (selectedCouriers[order.id] || "k1")
                                    ) || DIENG_COURIERS[0]
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 bg-sky-600 hover:bg-sky-700 text-white font-bold p-1.5 px-2.5 rounded-lg text-xs inline-flex items-center gap-1 transition shadow-xs"
                                  title="Kirim Penugasan & Link Google Maps ke WhatsApp Kurir"
                                >
                                  <Flaticon name="whatsapp" variant="brands" className="text-xs" />
                                  <span>Kirim Kurir</span>
                                </a>
                              </div>
                            </div>

                            <div className="flex justify-between items-center text-xs pt-1">
                              <span className="font-medium text-slate-500">Total Tagihan:</span>
                              <span className="font-black text-amber-600 text-sm">
                                {formatRupiah(order.total_amount)}
                              </span>
                            </div>

                            {order.payment_status !== "settlement" && (
                              <button
                                onClick={() => handleConfirmCash(order.id)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-3 text-xs font-bold transition shadow-xs cursor-pointer"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[3]" />
                                <span>Konfirmasi / ACC Pembayaran Lunas</span>
                              </button>
                            )}

                            {/* Single Unified WhatsApp Confirmation to Buyer */}
                            {order.customer_phone && (
                              <a
                                href={getBuyerConfirmationWhatsAppUrl(order)}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold transition shadow-xs"
                                title="Kirim konfirmasi pesanan via WA ke pembeli sesuai metode pembayaran (QRIS / Tunai COD)"
                              >
                                <Flaticon name="whatsapp" variant="brands" className="text-sm" />
                                <span>Konfirmasi Pembeli via WA</span>
                              </a>
                            )}

                            {/* Tombol Bukti Pembayaran Struk Pembeli */}
                            {order.payment_proof_url && (
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForProof(order)}
                                className="w-full flex items-center justify-between gap-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border-2 border-emerald-400 text-emerald-900 py-2 px-3 text-xs font-bold transition shadow-2xs group"
                                title="Buka Foto Bukti Pembayaran / Struk Transfer Pembeli"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white">
                                    <Flaticon name="picture" className="text-xs" />
                                  </div>
                                  <span className="truncate">Bukti Struk Transfer Pembeli</span>
                                </div>
                                <span className="rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white px-2.5 py-0.5 text-[10px] font-black shrink-0 transition">
                                  Buka Foto ↗
                                </span>
                              </button>
                            )}

                            <div className="flex items-center gap-1.5 pt-0.5">
                              <button
                                onClick={() => setSelectedOrderDetail(order)}
                                className="flex items-center justify-center gap-1 rounded-xl border border-amber-300 bg-amber-50 p-2 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                                title="Buka Pop Up Modal Rincian Lengkap"
                              >
                                <span>Detail</span>
                              </button>

                              {order.payment_proof_url && (
                                <button
                                  onClick={() => setSelectedOrderForProof(order)}
                                  className="flex items-center justify-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 p-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition"
                                  title="Lihat Bukti Pembayaran"
                                >
                                  <Flaticon name="image" className="text-xs" />
                                  <span>Bukti</span>
                                </button>
                              )}

                              <button
                                onClick={() => printReceiptViaBrowser(order)}
                                className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                                title="Cetak Struk Thermal Kasir"
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
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* View 3: All Settled Transactions with Expanded Date Filter & Excel/PDF Export */}
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
                    Ditemukan <strong className="text-slate-800">{filteredTransactions.length} pesanan</strong> ({settledOrders.length} lunas) • Total Omzet Lunas:{" "}
                    <strong className="text-emerald-700 font-bold">{formatRupiah(totalOmzet)}</strong>
                  </p>
                </div>

                {/* Export Excel & PDF Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleExportExcel}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition shadow-2xs active:scale-95"
                    title="Unduh laporan penjualan berformat Excel (.csv UTF-8)"
                  >
                    <Download className="h-4 w-4" />
                    <span>Ekspor Excel</span>
                  </button>

                  <button
                    onClick={handleExportPDF}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 hover:bg-black px-3.5 py-2 text-xs font-bold text-[#f4ce00] transition shadow-2xs active:scale-95 border border-slate-800"
                    title="Cetak atau unduh dokumen PDF resmi bertema Dioleh - oleh Dieng"
                  >
                    <Printer className="h-4 w-4" />
                    <span>Ekspor Laporan PDF</span>
                  </button>
                </div>
              </div>

              {/* Status Filter Chips for Transactions */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-b border-slate-100 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Status Transaksi:
                </span>
                {[
                  { id: "all", label: "Semua Status", count: orders.length },
                  { id: "settlement", label: "Lunas (Berhasil)", count: orders.filter((o) => o.payment_status === "settlement").length },
                  { id: "failed", label: "Dibatalkan / Void", count: orders.filter((o) => o.payment_status === "failed").length },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setTransactionStatusFilter(s.id as any)}
                    className={`rounded-xl px-3 py-1 text-xs font-bold transition flex items-center gap-1.5 ${
                      transactionStatusFilter === s.id
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    <span>{s.label}</span>
                    <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
                      {s.count}
                    </span>
                  </button>
                ))}
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
              {/* Petunjuk Geser Horizontal untuk Kenyamanan Admin */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50/90 via-slate-50 to-white border-b border-slate-200 text-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shadow-2xs">
                    ⇄
                  </span>
                  <span className="font-bold text-slate-800">
                    Tabel Responsif: Geser ke kanan (scroll horizontal) untuk melihat seluruh kolom data transaksi &amp; tombol aksi.
                  </span>
                </div>
                <span className="text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                  Total {filteredTransactions.length} Transaksi
                </span>
              </div>

              {/* Scrollable Container dengan Min-Width */}
              <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-amber-300 scrollbar-track-slate-100 pb-2">
                <table className="w-full text-left text-xs text-slate-600 min-w-[1150px]">
                  <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">No. Order</th>
                      <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
                      <th className="px-4 py-3 min-w-[200px]">Tujuan &amp; Titik Maps</th>
                      <th className="px-4 py-3 whitespace-nowrap">Pemesan &amp; WhatsApp</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status Bayar &amp; Bukti</th>
                      <th className="px-4 py-3 min-w-[180px]">Item Pesanan</th>
                      <th className="px-4 py-3 whitespace-nowrap">Total Nominal</th>
                      <th className="px-4 py-3 whitespace-nowrap">Status Antar</th>
                      <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-8 text-center text-slate-400">
                          Tidak ada transaksi pada filter ini
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((order) => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition">
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
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
                          <td className="px-4 py-3 text-slate-800 whitespace-nowrap">
                            <span className="font-semibold block">{order.customer_name || "-"}</span>
                            {order.customer_phone && (
                              <span className="text-[11px] text-slate-500 font-mono">
                                {order.customer_phone}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="space-y-1">
                              <span
                                className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                                  order.payment_status === "settlement"
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                    : order.payment_status === "failed"
                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                    : "bg-amber-100 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {order.payment_status === "settlement"
                                  ? "Lunas"
                                  : order.payment_status === "failed"
                                  ? "Dibatalkan"
                                  : "Pending"}
                              </span>
                              {order.payment_proof_url && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForProof(order)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded px-1.5 py-0.5 transition cursor-pointer"
                                  title="Lihat foto bukti struk pembayaran pembeli"
                                >
                                  <Flaticon name="picture" className="text-[10px] text-emerald-600" />
                                  <span>Lihat Bukti ↗</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-xs truncate">
                            {order.items.map((i) => `${i.qty}x ${i.name}`).join(", ")}
                          </td>
                          <td className="px-4 py-3 font-black text-amber-600 whitespace-nowrap">
                            {formatRupiah(order.total_amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(order.order_status)}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {order.payment_proof_url && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForProof(order)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-800 transition cursor-pointer"
                                  title="Buka Foto Bukti Struk Pembayaran"
                                >
                                  <Flaticon name="picture" className="h-3 w-3 text-emerald-600" />
                                  <span>Bukti</span>
                                </button>
                              )}
                              {order.payment_status === "failed" ? (
                                <button
                                  onClick={() => handleRestoreOrder(order.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-900 text-white px-2 py-1 text-[10px] font-bold hover:bg-black transition"
                                  title="Pulihkan pesanan yang dibatalkan"
                                >
                                  <span>Pulihkan</span>
                                </button>
                              ) : null}
                              <button
                                onClick={() => printReceiptViaBrowser(order)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-100 transition"
                                title="Cetak Struk"
                              >
                                <Printer className="h-3 w-3" />
                                <span>Struk</span>
                              </button>
                              <button
                                onClick={() => handlePermanentDelete(order.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 transition shadow-2xs"
                                title="Hapus Permanen"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                      Manajemen Produk &amp; Stok Katalog Dioleh - oleh Dieng
                    </h3>
                  </div>
                  <p className="text-xs text-[#727168] mt-1 max-w-2xl">
                    Kelola penuh katalog oleh-oleh Dieng: tambah produk baru, edit nama, foto, deskripsi, harga, atau hapus produk. Perubahan tersinkronisasi langsung ke katalog pembeli.
                  </p>
                </div>

                {/* Stock Stats Pills & Add Product Button */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <Flaticon name="check-circle" className="text-xs text-emerald-600" />
                    <span>{products.filter((p) => p.is_available !== false).length} Tersedia</span>
                  </span>
                  <span className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <Flaticon name="cross-circle" className="text-xs text-rose-600" />
                    <span>{products.filter((p) => p.is_available === false).length} Habis</span>
                  </span>

                  <button
                    onClick={handleOpenAddProduct}
                    className="flex items-center gap-1.5 rounded-xl bg-[#292a23] hover:bg-black text-[#f4ce00] px-3.5 py-1.5 text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Flaticon name="plus" className="text-xs" />
                    <span>+ Tambah Produk Baru</span>
                  </button>
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
                <p>Memuat katalog produk Dioleh - oleh Dieng...</p>
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
                        <div className="p-4 sm:p-5 pt-0 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(product)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2 px-3 text-xs font-bold text-slate-800 transition shadow-2xs"
                              title="Edit Foto, Nama, Deskripsi, Kemasan & Harga"
                            >
                              <Flaticon name="edit" className="text-xs text-[#90802a]" />
                              <span>Edit Produk</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(product.id, product.name)}
                              className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2 px-3 text-xs font-bold text-rose-700 transition"
                              title="Hapus produk ini dari katalog"
                            >
                              <Flaticon name="trash" className="text-xs" />
                              <span>Hapus</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => handleToggleStock(product.id, isAvailable)}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 px-4 text-xs font-bold transition shadow-xs disabled:opacity-50 ${
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

        {/* POP UP MODAL INFORMASI SEPUTAR PESANAN LENGKAP */}
        {selectedOrderDetail && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => setSelectedOrderDetail(null)}
          >
            <div
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 p-4 sm:p-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      ORDER #{selectedOrderDetail.order_number}
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                        selectedOrderDetail.payment_status === "settlement"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-amber-50 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {selectedOrderDetail.payment_status === "settlement" ? "Lunas" : "Belum Lunas"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dibuat pada {formatOrderTime(selectedOrderDetail.created_at)} • Metode:{" "}
                    {selectedOrderDetail.payment_type
                      ? selectedOrderDetail.payment_type.toUpperCase()
                      : "QRIS"}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderDetail(null)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                  title="Tutup Popup"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* Identitas Pembeli & WhatsApp */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Data Pelanggan &amp; WhatsApp:
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {selectedOrderDetail.customer_name || "Pelanggan"}
                      </p>
                      <p className="font-mono text-slate-600 mt-0.5">
                        No. WA: {selectedOrderDetail.customer_phone || "-"}
                      </p>
                    </div>
                    {selectedOrderDetail.customer_phone && (
                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${selectedOrderDetail.customer_phone
                            .replace(/\D/g, "")
                            .replace(/^0/, "62")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition shadow-xs"
                        >
                          <Flaticon name="whatsapp" variant="brands" className="text-xs" />
                          <span>Chat WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alamat & Titik Google Maps Lengkap */}
                <div className="rounded-2xl border border-amber-200 bg-[#fffdf5] p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <Flaticon name="marker" variant="sr" className="text-sm text-amber-600" />
                      <span>Lokasi &amp; Patokan Pengantaran Real:</span>
                    </div>
                    {selectedOrderDetail.delivery_distance_km ? (
                      <span className="bg-white border border-amber-200 px-2.5 py-0.5 rounded-full font-bold text-amber-800 text-[10px]">
                        ~{selectedOrderDetail.delivery_distance_km} km dari Titik 0 Dieng
                      </span>
                    ) : null}
                  </div>

                  <div className="bg-white rounded-xl border border-amber-100 p-3 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Catatan Alamat / Homestay / Patokan:
                    </span>
                    <p className="text-slate-900 font-semibold leading-relaxed text-xs">
                      {selectedOrderDetail.delivery_address ||
                        "Tidak ada catatan patokan tambahan."}
                    </p>
                  </div>

                  {selectedOrderDetail.coordinates && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="font-mono text-[11px] text-slate-600">
                        GPS: {selectedOrderDetail.coordinates.lat.toFixed(6)},{" "}
                        {selectedOrderDetail.coordinates.lng.toFixed(6)}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOrderDetail.coordinates.lat},${selectedOrderDetail.coordinates.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#292a23] hover:bg-black text-[#f4ce00] font-bold px-3 py-1.5 rounded-xl inline-flex items-center gap-1.5 transition shadow-xs"
                      >
                        <span>🧭 Buka Rute Google Maps</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Rincian Produk Belanja */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Rincian Barang Oleh-Oleh:
                  </span>
                  <div className="space-y-2 border-t border-slate-100 pt-2">
                    {selectedOrderDetail.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {item.qty}x {item.name}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            @ {formatRupiah(item.price)}
                          </p>
                          {item.notes && (
                            <p className="text-[10px] text-amber-700 italic bg-amber-50 rounded px-1.5 py-0.5 mt-0.5 inline-block">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                        <span className="font-black text-slate-900 text-xs shrink-0">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm">
                    <span className="font-bold text-slate-700">Total Pembayaran:</span>
                    <span className="font-black text-amber-600 text-base">
                      {formatRupiah(selectedOrderDetail.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Pilihan 5 Kurir WhatsApp */}
                <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                      <span>🛵</span>
                      <span>Penugasan Kurir Pengantar (WhatsApp):</span>
                    </span>
                    <span className="text-[10px] font-bold text-sky-700 bg-white border border-sky-200 px-2 py-0.5 rounded-full">
                      5 Nomor Tersedia
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={selectedCouriers[selectedOrderDetail.id] || "k1"}
                      onChange={(e) =>
                        setSelectedCouriers({
                          ...selectedCouriers,
                          [selectedOrderDetail.id]: e.target.value,
                        })
                      }
                      className="w-full text-xs font-semibold bg-white border border-sky-300 rounded-xl p-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                    >
                      {DIENG_COURIERS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone}) - {c.zone}
                        </option>
                      ))}
                    </select>
                    <a
                      href={getAssignCourierWhatsAppUrl(
                        selectedOrderDetail,
                        DIENG_COURIERS.find(
                          (c) => c.id === (selectedCouriers[selectedOrderDetail.id] || "k1")
                        ) || DIENG_COURIERS[0]
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition shadow-xs shrink-0"
                    >
                      <Flaticon name="whatsapp" variant="brands" className="text-xs" />
                      <span>Kirim Tugas ke Kurir</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Modal Action Footer */}
              <div className="border-t border-slate-100 bg-slate-50 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {selectedOrderDetail.customer_phone && (
                    <a
                      href={getBuyerConfirmationWhatsAppUrl(selectedOrderDetail)}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                      title="Kirim Konfirmasi Pesanan Resmi ke WhatsApp Pembeli"
                    >
                      <Flaticon name="whatsapp" variant="brands" className="text-xs" />
                      <span>Konfirmasi Pembeli via WA</span>
                    </a>
                  )}

                  <button
                    onClick={() => printReceiptViaBrowser(selectedOrderDetail)}
                    className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-2xs"
                    title="Cetak Struk Thermal"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Cetak Struk</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {selectedOrderDetail.payment_status !== "settlement" && (
                    <button
                      onClick={async () => {
                        await handleConfirmCash(selectedOrderDetail.id);
                        setSelectedOrderDetail({
                          ...selectedOrderDetail,
                          payment_status: "settlement",
                        });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                      <span>ACC Pembayaran Lunas</span>
                    </button>
                  )}

                  <button
                    onClick={() => handlePermanentDelete(selectedOrderDetail.id)}
                    className="bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 font-bold px-3 py-2 rounded-xl text-xs inline-flex items-center gap-1.5 transition shadow-2xs"
                    title="Hapus Pesanan Selamanya"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Hapus Permanen</span>
                  </button>

                  <button
                    onClick={() => setSelectedOrderDetail(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* POP UP MODAL TAMBAH & EDIT PRODUK OLEH-OLEH */}
        {isAddProductOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto"
            onClick={() => {
              setIsAddProductOpen(false);
              setEditingProduct(null);
            }}
          >
            <div
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[92vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-[#292a23] px-5 py-4 text-white">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f4ce00] text-black shadow-xs">
                    <Flaticon name="box-alt" className="text-sm" />
                  </span>
                  <div>
                    <h3 className="text-base font-black tracking-tight text-white">
                      {editingProduct ? "Edit Informasi Produk" : "Tambah Produk Baru"}
                    </h3>
                    <p className="text-[11px] text-[#dedad0]">
                      Katalog Dioleh - oleh Dieng Wonosobo
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-xl bg-white/10 hover:bg-white/20 p-2 text-white/80 hover:text-white transition"
                >
                  <Flaticon name="cross" className="text-xs" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmitProductForm} className="overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
                {/* Field 1: Nama Produk & Kategori */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Nama Produk <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Carica Spesial Dieng"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={productForm.group}
                      onChange={(e) => setProductForm({ ...productForm, group: e.target.value as any })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    >
                      <option value="Carica">Carica</option>
                      <option value="Makanan">Makanan</option>
                      <option value="Camilan">Camilan</option>
                      <option value="Minuman">Minuman</option>
                    </select>
                  </div>
                </div>

                {/* Field 2: Kemasan/Isi & Harga Jual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Kemasan / Isi Varian <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 6 cup × 115 g atau 6 bungkus"
                      value={productForm.pack}
                      onChange={(e) => setProductForm({ ...productForm, pack: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Harga Jual Paket (Rp) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      placeholder="Contoh: 25000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-amber-700 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field 3: Stok Kuantitas & Ketersediaan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Stok Fisik Tersedia (Unit/Paket)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={productForm.stock_qty}
                      onChange={(e) => setProductForm({ ...productForm, stock_qty: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Status Ketersediaan
                    </label>
                    <select
                      value={productForm.is_available ? "true" : "false"}
                      onChange={(e) => setProductForm({ ...productForm, is_available: e.target.value === "true" })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    >
                      <option value="true">Tersedia (Bisa Dipesan)</option>
                      <option value="false">Stok Habis (Sold Out)</option>
                    </select>
                  </div>
                </div>

                {/* Field 4: Foto Produk dengan Opsi Preset Cepat */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    URL / Path Foto Produk
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="https://... atau /images/..."
                      value={productForm.image}
                      onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono text-slate-700 focus:bg-white focus:border-[#90802a] focus:outline-none"
                    />
                    {productForm.image && (
                      <div className="h-9 w-9 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <img
                          src={productForm.image}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500">
                    <span className="font-bold">Preset Lokal:</span>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, image: "/images/mie-ongklok.jpg" })}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 text-amber-900 font-semibold"
                    >
                      Mie Ongklok
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, image: "/images/purwaceng.jpg" })}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 text-amber-900 font-semibold"
                    >
                      Purwaceng
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, image: "/images/hero-dieng.jpg" })}
                      className="rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 text-amber-900 font-semibold"
                    >
                      Hero Titik 0 Dieng
                    </button>
                  </div>
                </div>

                {/* Field 5: Deskripsi Produk */}
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                    Deskripsi Produk &amp; Informasi Rasa
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tuliskan keterangan rasa, keunggulan, atau cara penyajian oleh-oleh..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:bg-white focus:border-[#90802a] focus:outline-none"
                  />
                </div>

                {/* Modal Form Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddProductOpen(false);
                      setEditingProduct(null);
                    }}
                    className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2 text-xs font-bold text-slate-700 transition"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-xl bg-[#292a23] hover:bg-black text-[#f4ce00] px-5 py-2 text-xs font-bold transition shadow-xs"
                  >
                    <Flaticon name="check-circle" className="text-xs" />
                    <span>{editingProduct ? "Simpan Perubahan" : "Terbitkan ke Katalog"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Tampilkan Bukti Pembayaran (Payment Proof) */}
        {selectedOrderForProof && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs"
            onClick={() => setSelectedOrderForProof(null)}
          >
            <div
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-white p-4 sm:p-6">
                <div className="space-y-1">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Flaticon name="image" className="text-base text-emerald-600" />
                    Bukti Pembayaran
                  </h2>
                  <p className="text-xs text-slate-500">
                    Order #{selectedOrderForProof.order_number}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrderForProof(null)}
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition"
                  title="Tutup"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto p-4 sm:p-6 flex-1">
                {selectedOrderForProof.payment_proof_url ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/30 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                          <Check className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-emerald-900">
                          Bukti Pembayaran Tersimpan
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800">
                        Diupload pada:{" "}
                        <strong>
                          {selectedOrderForProof.payment_proof_uploaded_at
                            ? new Date(selectedOrderForProof.payment_proof_uploaded_at).toLocaleString("id-ID")
                            : "-"}
                        </strong>
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                      <img
                        src={selectedOrderForProof.payment_proof_url}
                        alt="Bukti Pembayaran"
                        className="w-full h-auto object-contain max-h-96"
                      />
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4 space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          Detail Pesanan
                        </p>
                        <div className="mt-2 space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-600">No. Pesanan:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {selectedOrderForProof.order_number}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Pembeli:</span>
                            <span className="font-bold text-slate-900">
                              {selectedOrderForProof.customer_name || "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Total Bayar:</span>
                            <span className="font-bold text-emerald-600">
                              {formatRupiah(selectedOrderForProof.total_amount)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Metode:</span>
                            <span className="font-bold text-slate-900 uppercase">
                              {selectedOrderForProof.payment_type || "QRIS"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600">Status:</span>
                            <span className="font-bold text-emerald-700">
                              {selectedOrderForProof.payment_status === "settlement" ? "Lunas" : "Menunggu"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <a
                      href={selectedOrderForProof.payment_proof_url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-3 text-sm font-bold text-white transition shadow-md"
                    >
                      <Download className="h-4 w-4" />
                      <span>Unduh Bukti Pembayaran</span>
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                      <AlertCircle className="h-8 w-8" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800">
                      Belum Ada Bukti Pembayaran
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Pembeli belum mengunggah bukti transfer atau struk pembayaran untuk pesanan ini.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
