"use client";

import React, { useState, useEffect } from "react";
import { MenuItem, ModifierOption, ModifierGroup, SelectedModifier } from "@/types";
import { formatRupiah } from "@/lib/utils";
import Flaticon from "@/components/ui/Flaticon";

interface ModifierDrawerProps {
  menu: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    menu: MenuItem,
    selectedModifiers: SelectedModifier[],
    qty: number,
    notes: string
  ) => void;
}

export default function ModifierDrawer({
  menu,
  isOpen,
  onClose,
  onAddToCart,
}: ModifierDrawerProps) {
  const [selectedMap, setSelectedMap] = useState<Record<string, ModifierOption[]>>({});
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initialize defaults whenever menu opens
  useEffect(() => {
    if (!menu) {
      setSelectedMap({});
      setQty(1);
      setNotes("");
      setValidationError(null);
      return;
    }

    const initial: Record<string, ModifierOption[]> = {};
    for (const group of menu.modifier_groups) {
      if (group.min_select > 0 && group.options.length > 0) {
        // Find default or first
        const defaultOpt = group.options.find((o) => o.is_default) || group.options[0];
        initial[group.id] = [defaultOpt];
      } else {
        initial[group.id] = [];
      }
    }
    setSelectedMap(initial);
    setQty(1);
    setNotes("");
    setValidationError(null);
  }, [menu]);

  if (!isOpen || !menu) return null;

  const handleSelectOption = (group: ModifierGroup, option: ModifierOption) => {
    setSelectedMap((prev) => {
      const current = prev[group.id] || [];

      // Single select (radio)
      if (group.max_select === 1) {
        return {
          ...prev,
          [group.id]: [option],
        };
      }

      // Multi select (checkbox)
      const exists = current.some((o) => o.id === option.id);
      if (exists) {
        return {
          ...prev,
          [group.id]: current.filter((o) => o.id !== option.id),
        };
      } else {
        if (current.length >= group.max_select) {
          return prev;
        }
        return {
          ...prev,
          [group.id]: [...current, option],
        };
      }
    });
    setValidationError(null);
  };

  // Compute total price per unit
  const modifierPriceSum = Object.values(selectedMap)
    .flat()
    .reduce((sum, opt) => sum + (opt.price_modifier || 0), 0);
  const unitPrice = menu.price + modifierPriceSum;
  const totalPrice = unitPrice * qty;

  const handleConfirm = () => {
    // Validate required groups
    for (const group of menu.modifier_groups) {
      const selected = selectedMap[group.id] || [];
      if (selected.length < group.min_select) {
        setValidationError(`Harap pilih minimal ${group.min_select} opsi pada "${group.title}"`);
        return;
      }
    }

    // Flatten selected modifiers
    const allSelectedModifiers: SelectedModifier[] = [];
    for (const group of menu.modifier_groups) {
      const options = selectedMap[group.id] || [];
      for (const opt of options) {
        allSelectedModifiers.push({
          group_id: group.id,
          group_title: group.title,
          option_id: opt.id,
          option_name: opt.name,
          price_modifier: opt.price_modifier,
        });
      }
    }

    onAddToCart(menu, allSelectedModifiers, qty, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-xs sm:items-center p-0 sm:p-4">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Container */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header with details */}
        <div className="relative border-b border-slate-100 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                  {menu.name}
                </h3>
              </div>
              <p className="mt-1 text-xs text-slate-500 line-clamp-2">{menu.description}</p>
              <div className="mt-2 text-sm font-extrabold text-amber-600">
                {formatRupiah(menu.price)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-slate-100 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
              aria-label="Tutup"
            >
              <Flaticon name="cross" className="text-xs" />
            </button>
          </div>
        </div>

        {/* Scrollable Modifier Groups */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {validationError && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              <Flaticon name="exclamation" className="text-sm shrink-0 text-rose-500" />
              <span>{validationError}</span>
            </div>
          )}

          {menu.modifier_groups.map((group) => {
            const selectedOptions = selectedMap[group.id] || [];
            const isSingle = group.max_select === 1;

            return (
              <div key={group.id} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{group.title}</span>
                    {group.min_select > 0 ? (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                        Wajib
                      </span>
                    ) : (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                        Opsional
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {isSingle ? "Pilih 1" : `Maksimal ${group.max_select}`}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {group.options.map((opt) => {
                    const isSelected = selectedOptions.some((o) => o.id === opt.id);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelectOption(group, opt)}
                        className={`flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                          isSelected
                            ? "border-amber-500 bg-amber-50/70 text-slate-900 shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-4 w-4 items-center justify-center ${
                              isSingle ? "rounded-full" : "rounded-md"
                            } border transition-all ${
                              isSelected
                                ? "border-amber-500 bg-amber-500 text-white"
                                : "border-slate-300 bg-white"
                            }`}
                          >
                            {isSelected && <Flaticon name="check" className="text-[10px]" />}
                          </div>
                          <span className="text-xs sm:text-sm font-medium">{opt.name}</span>
                        </div>

                        <span
                          className={`text-xs font-semibold ${
                            opt.price_modifier > 0 ? "text-amber-600 font-bold" : "text-slate-400"
                          }`}
                        >
                          {opt.price_modifier > 0 ? `+${formatRupiah(opt.price_modifier)}` : "Gratis"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Notes input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-700">
              Catatan Tambahan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Saus dipisah, tanpa sayur..."
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 bg-white p-4 pb-safe sm:p-5">
          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                disabled={qty <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent transition"
              >
                <Flaticon name="minus" className="text-[10px]" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-slate-900">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((prev) => prev + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-white transition"
              >
                <Flaticon name="plus" className="text-[10px]" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              type="button"
              onClick={handleConfirm}
              className="flex flex-1 items-center justify-between rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-white font-bold shadow-sm shadow-amber-500/25 hover:brightness-105 active:scale-98 transition-all"
            >
              <span className="text-xs sm:text-sm">Tambah ke Pesanan</span>
              <span className="text-xs font-extrabold bg-white/20 px-2 py-0.5 rounded-md">
                {formatRupiah(totalPrice)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
