"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { Category, MenuItem, SelectedModifier } from "@/types";
import { formatRupiah } from "@/lib/utils";
import ModifierDrawer from "@/components/customer/ModifierDrawer";
import CartDrawer from "@/components/customer/CartDrawer";
import PaymentModal from "@/components/customer/PaymentModal";
import CheckOrderModal from "@/components/customer/CheckOrderModal";
import {
  Search,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  Utensils,
  Package,
  Coffee,
  PlusCircle,
  Tag,
  ChevronRight,
  SlidersHorizontal,
  Cookie,
  Flame,
  Receipt,
  Clock,
} from "lucide-react";

function MenuImage({
  src,
  alt,
  isAvailable,
}: {
  src: string;
  alt: string;
  isAvailable: boolean;
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <Image
      src={
        hasError
          ? "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80"
          : imgSrc
      }
      alt={alt}
      fill
      sizes="112px"
      onError={() => setHasError(true)}
      className={`object-cover transition-transform duration-300 ${
        isAvailable ? "group-hover:scale-105" : "grayscale"
      }`}
    />
  );
}

export default function TableOrderPage() {
  const router = useRouter();
  const params = useParams();
  const rawTableId = (params?.tableId as string) || "table-01";
  const tableNum = rawTableId.replace(/[^0-9]/g, "") || "01";

  const {
    items,
    setTable,
    addItem,
    updateQty,
    removeItem,
    customerName,
    customerPhone,
    setCustomerInfo,
    getTotalAmount,
    getTotalItems,
    lastActiveOrderId,
    lastActiveOrderNumber,
    recentOrders,
  } = useCartStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMenu, setSelectedMenu] = useState<MenuItem | null>(null);
  const [isModifierOpen, setIsModifierOpen] = useState<boolean>(false);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isCheckOrderOpen, setIsCheckOrderOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Desktop sidebar customer name state
  const [desktopName, setDesktopName] = useState(customerName || "");
  const [desktopPhone, setDesktopPhone] = useState(customerPhone || "");
  const [desktopError, setDesktopError] = useState("");

  // Initialize table context
  useEffect(() => {
    setTable(rawTableId, tableNum);
  }, [rawTableId, tableNum, setTable]);

  // Fetch initial catalog
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/seed");
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || []);
          setMenus(data.menus || []);
        }
      } catch (err) {
        console.error("Failed to load menus:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter menus
  const filteredMenus = useMemo(() => {
    return menus.filter((item) => {
      const matchCategory =
        activeCategory === "all" || item.category_id === activeCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [menus, activeCategory, searchQuery]);

  const handleOpenModifier = (menu: MenuItem) => {
    setSelectedMenu(menu);
    setIsModifierOpen(true);
  };

  const handleAddDirect = (menu: MenuItem) => {
    if (menu.modifier_groups && menu.modifier_groups.length > 0) {
      handleOpenModifier(menu);
    } else {
      addItem(menu, [], 1, "");
    }
  };

  const handleAddToCart = (
    menu: MenuItem,
    selectedModifiers: SelectedModifier[],
    qty: number,
    notes: string
  ) => {
    addItem(menu, selectedModifiers, qty, notes);
  };

  const totalItems = getTotalItems();
  const totalAmount = getTotalAmount();

  // Helper for category icons
  const renderCategoryIcon = (catId: string) => {
    switch (catId) {
      case "cat-coffee":
        return <Coffee className="h-4 w-4" strokeWidth={1.75} />;
      case "cat-manual":
        return <Sparkles className="h-4 w-4" strokeWidth={1.75} />;
      case "cat-non-coffee":
        return <Flame className="h-4 w-4" strokeWidth={1.75} />;
      case "cat-savory-snack":
        return <Utensils className="h-4 w-4" strokeWidth={1.75} />;
      case "cat-sweet-snack":
        return <Cookie className="h-4 w-4" strokeWidth={1.75} />;
      default:
        return <Coffee className="h-4 w-4" strokeWidth={1.75} />;
    }
  };

  const handleDesktopCheckout = () => {
    if (!desktopName.trim()) {
      setDesktopError("Harap masukkan nama pemesan.");
      return;
    }
    setCustomerInfo(desktopName.trim(), desktopPhone.trim());
    setDesktopError("");
    setIsPaymentOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3.5 py-2.5 sm:px-6 lg:px-8 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Tombol Back untuk Kembali ke Pemilihan Meja */}
            <Link
              href="/"
              className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs hover:border-amber-300 active:scale-95 transition"
              title="Kembali ke Pemilihan Meja"
            >
              <ArrowLeft className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-slate-700" strokeWidth={2.2} />
            </Link>

            <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/20">
              <Coffee className="h-4.5 w-4.5 sm:h-5 sm:w-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 truncate">
                  KOPI &amp; SNACK BAR
                </span>
                <span className="hidden sm:inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200 shrink-0">
                  Self-Order
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Pesan langsung dari meja Anda</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsCheckOrderOpen(true)}
              className="relative flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 sm:px-3 text-xs font-bold text-slate-700 shadow-2xs transition"
              title="Cek & Pantau Pesanan Anda"
            >
              <Receipt className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">Cek Pesanan</span>
              <span className="sm:hidden">Status</span>
              {lastActiveOrderId && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {/* Interactive Table Badge: Clicking navigates to Order Status if active, or opens check modal */}
            <button
              type="button"
              onClick={() => {
                if (lastActiveOrderId) {
                  router.push(`/orders/${lastActiveOrderId}`);
                } else {
                  setIsCheckOrderOpen(true);
                }
              }}
              className={`group flex items-center gap-1.5 sm:gap-2 rounded-xl border px-2.5 py-1 sm:px-3.5 sm:py-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer text-left ${
                lastActiveOrderId
                  ? "border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100 hover:border-amber-400 ring-2 ring-amber-400/25 shadow-xs"
                  : "border-amber-200/80 bg-amber-50/80 hover:bg-amber-100/70"
              }`}
              title={
                lastActiveOrderId
                  ? "Klik untuk melihat status pembayaran & pengerjaan pesanan Anda"
                  : "Nomor meja Anda (Klik untuk cek riwayat)"
              }
            >
              {lastActiveOrderId ? (
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
              ) : (
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              )}

              <div className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <span className="hidden xs:block text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-700">
                    {lastActiveOrderId ? "Pantau Status" : "Meja Anda"}
                  </span>
                  {lastActiveOrderId && (
                    <ArrowRight className="h-3 w-3 text-amber-600 group-hover:translate-x-0.5 transition-transform" />
                  )}
                </div>
                <span className="text-xs sm:text-sm font-black text-slate-900 leading-none block">
                  MEJA {tableNum}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Active Order Alert Banner if customer has ongoing order */}
        {lastActiveOrderId && (
          <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-3.5 py-2 sm:py-2.5 shadow-sm border-t border-amber-500/30">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2.5 text-xs sm:text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                </span>
                <div className="min-w-0 truncate">
                  <span className="font-bold">Pesanan Anda Sedang Diproses! </span>
                  <span className="text-amber-100 hidden sm:inline">
                    {lastActiveOrderNumber ? `(#${lastActiveOrderNumber}) ` : ""}Pantau racikan barista &amp; koki real-time.
                  </span>
                </div>
              </div>
              <Link
                href={`/orders/${lastActiveOrderId}`}
                className="flex items-center gap-1.5 rounded-lg bg-white text-slate-900 font-bold px-3 py-1 text-xs shadow-xs hover:bg-amber-50 active:scale-95 transition shrink-0"
              >
                <span>Pantau Pesanan</span>
                <ArrowRight className="h-3 w-3 text-amber-600" />
              </Link>
            </div>
          </div>
        )}

        {/* Search & Categories Bar */}
        <div className="border-t border-slate-100 bg-white px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={1.75} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu makanan, minuman, topping..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                  activeCategory === "all"
                    ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30 font-bold"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                <span>Semua Menu</span>
              </button>

              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30 font-bold"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    {renderCategoryIcon(cat.id)}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 pb-32 lg:pb-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
          {/* Menu Catalog Section */}
          <div className="lg:col-span-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {activeCategory === "all"
                    ? "Daftar Menu Pilihan"
                    : categories.find((c) => c.id === activeCategory)?.name || "Menu"}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menampilkan {filteredMenus.length} menu siap disajikan
                </p>
              </div>
            </div>

            {/* Menu Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
                  />
                ))}
              </div>
            ) : filteredMenus.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
                  <UtensilsCrossed className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Menu tidak ditemukan</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Coba cari dengan kata kunci lain atau pilih kategori yang berbeda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredMenus.map((menu) => {
                  const isAvailable = menu.is_available !== false;
                  return (
                    <div
                      key={menu.id}
                      onClick={() => {
                        if (isAvailable) handleOpenModifier(menu);
                      }}
                      className={`group relative flex overflow-hidden rounded-2xl border p-3 transition-all ${
                        isAvailable
                          ? "cursor-pointer border-slate-200/90 bg-white shadow-sm hover:border-amber-400 hover:shadow-md"
                          : "cursor-not-allowed border-slate-200 bg-slate-50/80 opacity-70"
                      }`}
                    >
                      {/* Image */}
                      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        <MenuImage
                          src={menu.image_url}
                          alt={menu.name}
                          isAvailable={isAvailable}
                        />
                        {!isAvailable ? (
                          <span className="absolute inset-x-1 bottom-1 rounded-md bg-rose-600/95 py-0.5 text-center text-[10px] font-black uppercase tracking-wider text-white shadow-sm">
                            Habis (Sold Out)
                          </span>
                        ) : menu.tags && menu.tags[0] ? (
                          <span className="absolute left-1.5 top-1.5 rounded-md bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[9px] font-bold text-amber-800 border border-amber-200 shadow-xs">
                            {menu.tags[0]}
                          </span>
                        ) : null}
                      </div>

                      {/* Details */}
                      <div className="ml-3 flex flex-1 flex-col justify-between py-0.5">
                        <div>
                          <h3
                            className={`text-sm font-bold line-clamp-1 transition-colors ${
                              isAvailable
                                ? "text-slate-900 group-hover:text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {menu.name}
                          </h3>
                          <p className="mt-1 text-[11px] leading-snug text-slate-500 line-clamp-2">
                            {menu.description}
                          </p>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                          <span
                            className={`text-sm font-extrabold ${
                              isAvailable ? "text-slate-900" : "text-slate-400"
                            }`}
                          >
                            {formatRupiah(menu.price)}
                          </span>

                          {isAvailable ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModifier(menu);
                              }}
                              className="flex h-8 items-center gap-1 rounded-xl bg-amber-50 border border-amber-200/70 px-3 text-xs font-bold text-amber-700 hover:bg-amber-500 hover:text-white hover:border-amber-500 active:scale-95 transition-all shadow-xs"
                            >
                              <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                              <span>Pilih</span>
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-xl bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                              Habis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop Persistent Sidebar (Tablet & Desktop POS Style) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-28">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                    <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Ringkasan Pesanan</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {totalItems} item
                </span>
              </div>

              {/* Items List */}
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-2">
                    <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700">Keranjang masih kosong</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Silakan klik "Pilih" pada menu untuk menambahkan.
                  </p>
                </div>
              ) : (
                <div className="mt-3 divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {items.map((cartItem) => (
                    <div key={cartItem.id} className="py-3 text-xs">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-2">
                          <p className="font-bold text-slate-900">{cartItem.name}</p>
                          {cartItem.selected_modifiers.length > 0 && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {cartItem.selected_modifiers.map((m) => m.option_name).join(", ")}
                            </p>
                          )}
                          {cartItem.notes && (
                            <p className="text-[10px] text-amber-700 italic mt-0.5">
                              "{cartItem.notes}"
                            </p>
                          )}
                          <p className="font-semibold text-amber-600 mt-1">
                            {formatRupiah(cartItem.subtotal)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1">
                          <button
                            onClick={() => updateQty(cartItem.id, cartItem.qty - 1)}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900 transition"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-800">
                            {cartItem.qty}
                          </span>
                          <button
                            onClick={() => updateQty(cartItem.id, cartItem.qty + 1)}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:bg-white hover:text-slate-900 transition"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Customer Inputs & Summary */}
              {items.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Nama Pemesan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={desktopName}
                      onChange={(e) => setDesktopName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    {desktopError && (
                      <p className="text-[10px] font-medium text-rose-500 mt-1">{desktopError}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Subtotal Pesanan</span>
                    <span className="font-semibold text-slate-900">{formatRupiah(totalAmount)}</span>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-sm font-bold text-slate-900">Total Pembayaran</span>
                    <span className="text-base font-black text-amber-600">
                      {formatRupiah(totalAmount)}
                    </span>
                  </div>

                  <button
                    onClick={handleDesktopCheckout}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-xs font-bold text-white shadow-sm shadow-amber-500/30 hover:brightness-105 active:scale-98 transition"
                  >
                    <span>Lanjut ke Pembayaran</span>
                    <ArrowRight className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
          <div className="mx-auto flex max-w-md items-center justify-between rounded-2xl bg-white border border-amber-300/80 p-3 text-slate-900 shadow-xl shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
                <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
                <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-medium leading-none">
                  Total Pesanan
                </p>
                <p className="text-sm font-black text-slate-900 leading-tight mt-0.5">
                  {formatRupiah(totalAmount)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm active:scale-95 transition-all"
            >
              <span>Lihat Pesanan</span>
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Floating Active Order Bar (When cart is empty but active order exists) */}
      {totalItems === 0 && lastActiveOrderId && (
        <div className="fixed bottom-4 left-4 right-4 z-40 lg:hidden">
          <Link
            href={`/orders/${lastActiveOrderId}`}
            className="mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl bg-slate-900/95 text-white border border-amber-500/40 p-3 shadow-2xl backdrop-blur-md active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400 leading-none">
                  Pesanan Aktif Sedang Diracik
                </p>
                <p className="text-xs font-bold text-white truncate mt-0.5">
                  {lastActiveOrderNumber ? `#${lastActiveOrderNumber} • ` : ""}Sentuh untuk Pantau Status
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-amber-500 hover:bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs shrink-0">
              <span>Pantau</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>
      )}

      {/* Modals & Drawers */}
      <ModifierDrawer
        menu={selectedMenu}
        isOpen={isModifierOpen}
        onClose={() => setIsModifierOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsPaymentOpen(true);
        }}
      />

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
      />

      <CheckOrderModal
        isOpen={isCheckOrderOpen}
        onClose={() => setIsCheckOrderOpen(false)}
        currentTableNumber={tableNum}
      />
    </div>
  );
}
