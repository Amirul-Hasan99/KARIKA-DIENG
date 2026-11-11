import { KarikaProduct, INITIAL_KARIKA_PRODUCTS, KARIKA_CATEGORIES } from "./karika-products-data";
import { getMenuStockMap, setMenuItemAvailability } from "./order-store";

export * from "./karika-products-data";

// In-memory price & meta store override (server-side)
declare global {
  var __globalProductOverrides: Map<string, Partial<KarikaProduct>> | undefined;
}

if (!global.__globalProductOverrides) {
  global.__globalProductOverrides = new Map<string, Partial<KarikaProduct>>();
}

export function getAllKarikaProducts(): KarikaProduct[] {
  const stockMap = getMenuStockMap();
  const overrides = global.__globalProductOverrides || new Map();

  return INITIAL_KARIKA_PRODUCTS.map((prod) => {
    const override = overrides.get(prod.id) || {};
    const stockAvailable = stockMap[prod.id] !== undefined ? stockMap[prod.id] : prod.is_available;

    return {
      ...prod,
      ...override,
      is_available: override.is_available !== undefined ? override.is_available : stockAvailable,
    };
  });
}

export function updateKarikaProduct(
  id: string,
  updates: Partial<Pick<KarikaProduct, "price" | "is_available" | "stock_qty" | "name" | "pack" | "description">>
): KarikaProduct | null {
  const current = INITIAL_KARIKA_PRODUCTS.find((p) => p.id === id);
  if (!current) return null;

  if (!global.__globalProductOverrides) {
    global.__globalProductOverrides = new Map();
  }

  const existing = global.__globalProductOverrides.get(id) || {};
  const merged = { ...existing, ...updates };
  global.__globalProductOverrides.set(id, merged);

  if (updates.is_available !== undefined) {
    setMenuItemAvailability(id, updates.is_available);
  }

  return {
    ...current,
    ...merged,
    is_available: merged.is_available !== undefined ? merged.is_available : current.is_available,
  };
}
