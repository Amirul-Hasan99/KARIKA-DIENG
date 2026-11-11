"use client";

import React, { useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import { formatRupiah } from "@/lib/utils";
import Flaticon from "@/components/ui/Flaticon";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export default function CartDrawer({ isOpen, onClose, onCheckout }: CartDrawerProps) {
  const {
    items,
    tableId,
    tableNumber,
    setTable,
    customerName,
    customerPhone,
    setCustomerInfo,
    updateQty,
    removeItem,
    clearCart,
    getTotalAmount,
  } = useCartStore();

  const [nameInput, setNameInput] = useState(customerName || "");
  const [phoneInput, setPhoneInput] = useState(customerPhone || "");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const total = getTotalAmount();

  const handleProceedCheckout = () => {
    if (!nameInput.trim()) {
      setErrorMsg("Harap masukkan nama pemesan untuk memanggil pesanan Anda.");
      return;
    }
    setCustomerInfo(nameInput.trim(), phoneInput.trim());
    setErrorMsg("");
    onCheckout();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white border-l border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Flaticon name="shopping-bag" className="text-base" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Keranjang Pesanan</h2>
              <p className="text-xs text-slate-500">
                Meja <span className="font-bold text-slate-900">{tableNumber || "01"}</span> • {items.length} Menu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <Flaticon name="cross" className="text-xs" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mb-3">
                <Flaticon name="shopping-bag" className="text-2xl" />
              </div>
              <p className="text-sm font-bold text-slate-800">Keranjang masih kosong</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Pilih menu favorit Anda dari katalog untuk mulai memesan.
              </p>
            </div>
          ) : (
            <>
              {/* Customer Info Form */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                <div className="text-xs font-bold text-slate-700">
                  Informasi Pemesan
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Flaticon name="user" className="absolute left-3 top-2.5 text-sm text-slate-400" />
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => {
                        setNameInput(e.target.value);
                        setErrorMsg("");
                      }}
                      placeholder="Nama Lengkap / Panggilan *"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="relative">
                    <Flaticon name="phone-call" className="absolute left-3 top-2.5 text-sm text-slate-400" />
                    <input
                      type="tel"
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="Nomor WhatsApp (Opsional)"
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Table Selector */}
                  <div className="relative">
                    <Flaticon name="shop" className="absolute left-3 top-2.5 text-sm text-slate-400" />
                    <select
                      value={tableNumber || "01"}
                      onChange={(e) => {
                        const num = e.target.value;
                        setTable(`table-${num}`, num);
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {Array.from({ length: 12 }, (_, i) => {
                        const num = (i + 1).toString().padStart(2, "0");
                        return (
                          <option key={num} value={num}>
                            Meja {num} {num === tableNumber ? "(Meja Saat Ini)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {errorMsg && (
                  <p className="text-[11px] font-medium text-rose-500 mt-1">{errorMsg}</p>
                )}
              </div>

              {/* Items List */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Daftar Menu</span>
                  <button
                    onClick={clearCart}
                    className="text-slate-400 hover:text-rose-500 font-normal transition text-[11px]"
                  >
                    Kosongkan
                  </button>
                </div>

                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-xl border border-slate-200/90 bg-white p-3 space-y-2 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">{item.name}</h4>
                        <div className="text-xs font-semibold text-amber-600">
                          {formatRupiah(item.item_price)}
                        </div>

                        {/* Modifiers Pill Display */}
                        {item.selected_modifiers && item.selected_modifiers.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.selected_modifiers.map((m, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 border border-slate-200"
                              >
                                {m.option_name}
                                {m.price_modifier > 0 && (
                                  <span className="ml-1 text-amber-700 font-semibold">
                                    (+{formatRupiah(m.price_modifier)})
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}

                        {item.notes && (
                          <p className="mt-1 text-[10px] italic text-slate-400">
                            Catatan: "{item.notes}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-slate-300 hover:text-rose-500 transition"
                        title="Hapus"
                      >
                        <Flaticon name="trash" className="text-xs" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          onClick={() => updateQty(item.id, item.qty - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white transition"
                        >
                          <Flaticon name="minus" className="text-[10px]" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-slate-800">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, item.qty + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-white transition"
                        >
                          <Flaticon name="plus" className="text-[10px]" />
                        </button>
                      </div>

                      <span className="text-xs font-bold text-slate-900">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-slate-100 bg-white p-5 pb-safe space-y-3">
            <div className="space-y-1 text-xs text-slate-500">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} item)</span>
                <span className="font-semibold text-slate-900">{formatRupiah(total)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pajak & Layanan</span>
                <span className="text-emerald-600 font-medium">Termasuk (Net)</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Bayar</span>
                <span className="text-base text-amber-600 font-black">{formatRupiah(total)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedCheckout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-xs sm:text-sm font-bold text-white shadow-sm shadow-amber-500/30 hover:brightness-105 active:scale-98 transition-all"
            >
              <span>Bayar via QRIS / Midtrans</span>
              <Flaticon name="arrow-right" className="text-sm" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
