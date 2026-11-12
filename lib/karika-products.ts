import fs from "fs";
import path from "path";
import { KarikaProduct, INITIAL_KARIKA_PRODUCTS, KARIKA_CATEGORIES } from "./karika-products-data";
import { getMenuStockMap, setMenuItemAvailability } from "./order-store";

export * from "./karika-products-data";

const PRODUCTS_FILE_PATH = path.join(process.cwd(), "data", "products.json");

function ensureProductsFile(): KarikaProduct[] {
  try {
    const dir = path.dirname(PRODUCTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(PRODUCTS_FILE_PATH)) {
      const raw = fs.readFileSync(PRODUCTS_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read products.json, using fallback:", e);
  }

  // Write initial products if file doesn't exist
  try {
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(INITIAL_KARIKA_PRODUCTS, null, 2), "utf-8");
  } catch {}
  return [...INITIAL_KARIKA_PRODUCTS];
}

function saveProductsFile(products: KarikaProduct[]) {
  try {
    const dir = path.dirname(PRODUCTS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE_PATH, JSON.stringify(products, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save products.json:", e);
  }
}

export function getAllKarikaProducts(): KarikaProduct[] {
  const products = ensureProductsFile();
  const stockMap = getMenuStockMap();

  return products.map((prod) => {
    const stockAvailable = stockMap[prod.id] !== undefined ? stockMap[prod.id] : prod.is_available;
    return {
      ...prod,
      is_available: prod.is_available !== undefined ? prod.is_available : stockAvailable,
    };
  });
}

export function createKarikaProduct(productData: {
  name: string;
  group: "Carica" | "Makanan" | "Camilan" | "Minuman";
  pack: string;
  price: number;
  description: string;
  image?: string;
  stock_qty?: number;
  is_available?: boolean;
}): KarikaProduct {
  const products = ensureProductsFile();
  const idSlug = productData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const id = `${idSlug}-${Date.now().toString(36)}`;

  const newProduct: KarikaProduct = {
    id,
    name: productData.name,
    group: productData.group,
    pack: productData.pack || "1 paket",
    price: Number(productData.price) || 0,
    description: productData.description || "",
    image: productData.image || "/images/hero-dieng.jpg",
    stock_qty: productData.stock_qty !== undefined ? Number(productData.stock_qty) : 50,
    is_available: productData.is_available !== undefined ? Boolean(productData.is_available) : true,
  };

  products.push(newProduct);
  saveProductsFile(products);
  setMenuItemAvailability(newProduct.id, newProduct.is_available);
  return newProduct;
}

export function updateKarikaProduct(
  id: string,
  updates: Partial<KarikaProduct>
): KarikaProduct | null {
  const products = ensureProductsFile();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = products[index];
  const merged: KarikaProduct = {
    ...current,
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : current.price,
    stock_qty: updates.stock_qty !== undefined ? Number(updates.stock_qty) : current.stock_qty,
    is_available: updates.is_available !== undefined ? Boolean(updates.is_available) : current.is_available,
  };

  products[index] = merged;
  saveProductsFile(products);

  if (updates.is_available !== undefined) {
    setMenuItemAvailability(id, updates.is_available);
  }

  return merged;
}

export function deleteKarikaProduct(id: string): boolean {
  const products = ensureProductsFile();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length === products.length) {
    return false;
  }
  saveProductsFile(filtered);
  return true;
}
