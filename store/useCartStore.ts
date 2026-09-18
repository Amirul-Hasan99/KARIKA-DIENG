import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CartItem, MenuItem, SelectedModifier } from "@/types";

export interface RecentOrderInfo {
  id: string;
  orderNumber: string;
  tableNumber: string;
  totalAmount: number;
  createdAt: string;
}

interface CartStore {
  tableId: string | null;
  tableNumber: string | null;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  lastActiveOrderId: string | null;
  lastActiveOrderNumber: string | null;
  recentOrders: RecentOrderInfo[];

  // Actions
  setTable: (tableId: string, tableNumber: string) => void;
  setCustomerInfo: (name: string, phone?: string) => void;
  addItem: (
    menu: MenuItem,
    selectedModifiers: SelectedModifier[],
    qty?: number,
    notes?: string
  ) => void;
  removeItem: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  setActiveOrder: (order: {
    id: string;
    orderNumber: string;
    tableNumber: string;
    totalAmount: number;
  }) => void;
  clearActiveOrder: () => void;

  // Computed
  getTotalAmount: () => number;
  getTotalItems: () => number;
}

// Generate unique deterministic cart item ID based on menu ID and selected modifiers
export function generateCartItemId(
  menuId: string,
  modifiers: SelectedModifier[]
): string {
  const sortedMods = [...modifiers].sort((a, b) =>
    `${a.group_id}-${a.option_id}`.localeCompare(`${b.group_id}-${b.option_id}`)
  );
  const modSignature = sortedMods
    .map((m) => `${m.group_id}:${m.option_id}`)
    .join("|");
  return `${menuId}__${modSignature}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      tableId: null,
      tableNumber: null,
      customerName: "",
      customerPhone: "",
      items: [],
      lastActiveOrderId: null,
      lastActiveOrderNumber: null,
      recentOrders: [],

      setActiveOrder: (order) => {
        const now = new Date().toISOString();
        const existing = get().recentOrders || [];
        const filtered = existing.filter((o) => o.id !== order.id);
        const updatedRecent: RecentOrderInfo[] = [
          {
            id: order.id,
            orderNumber: order.orderNumber,
            tableNumber: order.tableNumber,
            totalAmount: order.totalAmount,
            createdAt: now,
          },
          ...filtered,
        ].slice(0, 5); // Keep up to 5 recent orders

        set({
          lastActiveOrderId: order.id,
          lastActiveOrderNumber: order.orderNumber,
          recentOrders: updatedRecent,
        });
      },

      clearActiveOrder: () => {
        set({ lastActiveOrderId: null, lastActiveOrderNumber: null });
      },

      setTable: (tableId: string, tableNumber: string) => {
        const currentTable = get().tableId;
        // If switching to a different table, reset cart items to avoid table confusion
        if (currentTable && currentTable !== tableId) {
          set({ tableId, tableNumber, items: [] });
        } else {
          set({ tableId, tableNumber });
        }
      },

      setCustomerInfo: (name: string, phone: string = "") => {
        set({ customerName: name, customerPhone: phone });
      },

      addItem: (
        menu: MenuItem,
        selectedModifiers: SelectedModifier[],
        qty: number = 1,
        notes: string = ""
      ) => {
        const cartItemId = generateCartItemId(menu.id, selectedModifiers);
        const currentItems = get().items;

        const modifierTotal = selectedModifiers.reduce(
          (sum, mod) => sum + (mod.price_modifier || 0),
          0
        );
        const itemPrice = menu.price + modifierTotal;

        const existingIndex = currentItems.findIndex(
          (item) => item.id === cartItemId
        );

        if (existingIndex > -1) {
          // Increment quantity of existing item
          const updatedItems = [...currentItems];
          const existing = updatedItems[existingIndex];
          const newQty = existing.qty + qty;
          updatedItems[existingIndex] = {
            ...existing,
            qty: newQty,
            subtotal: newQty * existing.item_price,
            notes: notes || existing.notes,
          };
          set({ items: updatedItems });
        } else {
          // Add new line item
          const newItem: CartItem = {
            id: cartItemId,
            menu_id: menu.id,
            name: menu.name,
            base_price: menu.price,
            item_price: itemPrice,
            qty,
            image_url: menu.image_url,
            selected_modifiers: selectedModifiers,
            subtotal: qty * itemPrice,
            notes,
          };
          set({ items: [...currentItems, newItem] });
        }
      },

      removeItem: (cartItemId: string) => {
        set({
          items: get().items.filter((item) => item.id !== cartItemId),
        });
      },

      updateQty: (cartItemId: string, qty: number) => {
        if (qty <= 0) {
          get().removeItem(cartItemId);
          return;
        }

        const updatedItems = get().items.map((item) => {
          if (item.id === cartItemId) {
            return {
              ...item,
              qty,
              subtotal: qty * item.item_price,
            };
          }
          return item;
        });

        set({ items: updatedItems });
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotalAmount: () => {
        return get().items.reduce((sum, item) => sum + item.subtotal, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.qty, 0);
      },
    }),
    {
      name: "gacoan-cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tableId: state.tableId,
        tableNumber: state.tableNumber,
        customerName: state.customerName,
        customerPhone: state.customerPhone,
        items: state.items,
        lastActiveOrderId: state.lastActiveOrderId,
        lastActiveOrderNumber: state.lastActiveOrderNumber,
        recentOrders: state.recentOrders,
      }),
    }
  )
);
