import { Category, Table, MenuItem } from "@/types";
import { INITIAL_KARIKA_PRODUCTS } from "./karika-products-data";

export const initialCategories: Category[] = [
  { id: "cat-carica", name: "Carica Dieng", sort_order: 1, icon: "sparkles" },
  { id: "cat-makanan", name: "Makanan Khas", sort_order: 2, icon: "restaurant" },
  { id: "cat-camilan", name: "Camilan Renyah", sort_order: 3, icon: "cookie" },
  { id: "cat-minuman", name: "Minuman Herbal", sort_order: 4, icon: "mug-hot-alt" },
];

export const initialTables: Table[] = Array.from({ length: 12 }, (_, i) => {
  const num = (i + 1).toString().padStart(2, "0");
  return {
    id: `table-${num}`,
    table_number: `${num}`,
    status: "available",
    qr_url: `/table/table-${num}`,
  };
});

const groupToCategoryMap: Record<string, string> = {
  Carica: "cat-carica",
  Makanan: "cat-makanan",
  Camilan: "cat-camilan",
  Minuman: "cat-minuman",
};

export const initialMenus: MenuItem[] = INITIAL_KARIKA_PRODUCTS.map((prod) => ({
  id: prod.id,
  category_id: groupToCategoryMap[prod.group] || "cat-carica",
  name: prod.name,
  description: `${prod.pack} • ${prod.description}`,
  price: prod.price,
  image_url: prod.image,
  is_available: prod.is_available,
  tags: [prod.group, prod.pack],
  modifier_groups: [],
}));
