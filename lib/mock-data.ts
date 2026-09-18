import { Category, Table, MenuItem } from "@/types";

export const initialCategories: Category[] = [
  { id: "cat-coffee", name: "Espresso & Coffee", sort_order: 1, icon: "Coffee" },
  { id: "cat-manual", name: "Manual & Cold Brew", sort_order: 2, icon: "Sparkles" },
  { id: "cat-non-coffee", name: "Non-Coffee & Tea", sort_order: 3, icon: "CupSoda" },
  { id: "cat-savory-snack", name: "Savory Snacks", sort_order: 4, icon: "Utensils" },
  { id: "cat-sweet-snack", name: "Sweet & Pastries", sort_order: 5, icon: "Cookie" },
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

export const initialMenus: MenuItem[] = [
  // 1. ESPRESSO & COFFEE
  {
    id: "menu-kopi-susu-gula-aren",
    category_id: "cat-coffee",
    name: "Kopi Susu Gula Aren",
    description: "Espresso double shot harum, fresh milk gurih creamy, dan gula aren organik murni dengan aroma khas nusantara.",
    price: 18000,
    image_url: "https://images.unsplash.com/photo-1541167760496-1628856ab772?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Best Seller", "Signature"],
    modifier_groups: [
      {
        id: "mod-temp-aren",
        title: "Pilihan Suhu (Wajib)",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "ice-cold", name: "Dingin Segar (Iced)", price_modifier: 0, is_default: true },
          { id: "hot-warm", name: "Hangat Nikmat (Hot)", price_modifier: 0 },
        ],
      },
      {
        id: "mod-milk-aren",
        title: "Pilihan Susu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "milk-fresh", name: "Fresh Milk Creamy", price_modifier: 0, is_default: true },
          { id: "milk-oat", name: "Oatmilk (Plant-based)", price_modifier: 6000 },
          { id: "milk-almond", name: "Almond Milk", price_modifier: 7000 },
        ],
      },
      {
        id: "mod-sugar-aren",
        title: "Level Manis (Gula Aren)",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "sugar-normal", name: "Normal Sweet (100%)", price_modifier: 0, is_default: true },
          { id: "sugar-less", name: "Less Sugar (50%)", price_modifier: 0 },
          { id: "sugar-none", name: "Tanpa Gula (0%)", price_modifier: 0 },
        ],
      },
      {
        id: "mod-extra-aren",
        title: "Extra Add-ons (Opsional)",
        min_select: 0,
        max_select: 2,
        options: [
          { id: "add-shot", name: "Extra Espresso Shot", price_modifier: 5000 },
          { id: "add-jelly", name: "Coffee Jelly Kenyal", price_modifier: 4000 },
        ],
      },
    ],
  },
  {
    id: "menu-caffe-latte",
    category_id: "cat-coffee",
    name: "Caffe Latte",
    description: "Espresso arabica lembut berpadu steamed milk dengan microfoam sutra halus. Sempurna untuk pecinta kopi creamy.",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Favorit"],
    modifier_groups: [
      {
        id: "mod-latte-temp",
        title: "Penyajian (Wajib)",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "latte-hot", name: "Hot Latte (dengan Latte Art)", price_modifier: 0, is_default: true },
          { id: "latte-iced", name: "Iced Latte Segar", price_modifier: 0 },
        ],
      },
      {
        id: "mod-latte-milk",
        title: "Pilihan Susu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "milk-dairy", name: "Fresh Dairy Milk", price_modifier: 0, is_default: true },
          { id: "milk-oat", name: "Oatmilk Barista", price_modifier: 6000 },
        ],
      },
      {
        id: "mod-latte-syrup",
        title: "Pilihan Sirup Flavour",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "syrup-vanilla", name: "Syrup French Vanilla", price_modifier: 4000 },
          { id: "syrup-caramel", name: "Syrup Salted Caramel", price_modifier: 4000 },
          { id: "syrup-hazelnut", name: "Syrup Roasted Hazelnut", price_modifier: 4000 },
        ],
      },
    ],
  },
  {
    id: "menu-caramel-macchiato",
    category_id: "cat-coffee",
    name: "Caramel Macchiato",
    description: "Lapisan espresso pekat, sirup vanila lembut, susu berbusa, dengan siraman saus karamel leleh yang manis gurih.",
    price: 25000,
    image_url: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Best Seller", "Sweet Coffee"],
    modifier_groups: [
      {
        id: "mod-mac-temp",
        title: "Pilihan Suhu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "mac-iced", name: "Iced Caramel Macchiato", price_modifier: 0, is_default: true },
          { id: "mac-hot", name: "Hot Caramel Macchiato", price_modifier: 0 },
        ],
      },
      {
        id: "mod-mac-addon",
        title: "Extra Topping",
        min_select: 0,
        max_select: 2,
        options: [
          { id: "top-caramel", name: "Extra Caramel Sauce Drizzle", price_modifier: 3000 },
          { id: "top-whip", name: "Whipped Cream Creamy", price_modifier: 4000 },
          { id: "top-shot", name: "Extra Espresso Shot", price_modifier: 5000 },
        ],
      },
    ],
  },
  {
    id: "menu-americano",
    category_id: "cat-coffee",
    name: "Americano / Long Black",
    description: "Double shot espresso blend arabica nusantara dengan crema tebal, menghasilkan rasa kopi murni yang tegas dan clean.",
    price: 16000,
    image_url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Pure Coffee", "Low Calorie"],
    modifier_groups: [
      {
        id: "mod-ame-temp",
        title: "Pilihan Suhu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "ame-iced", name: "Iced Americano Dingin", price_modifier: 0, is_default: true },
          { id: "ame-hot", name: "Hot Long Black Hangat", price_modifier: 0 },
        ],
      },
      {
        id: "mod-ame-beans",
        title: "Pilihan Biji Kopi",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "bean-house", name: "House Blend (Nutty, Bold)", price_modifier: 0, is_default: true },
          { id: "bean-gayo", name: "Single Origin Aceh Gayo (Fruity, Citrus)", price_modifier: 3000 },
        ],
      },
    ],
  },
  {
    id: "menu-spanish-latte",
    category_id: "cat-coffee",
    name: "Spanish Creamy Latte",
    description: "Kopi susu ala Spanyol dengan perpaduan espresso pekat, fresh milk dingin, dan sentuhan condensed milk manis legit.",
    price: 24000,
    image_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Creamy", "Favorit"],
    modifier_groups: [
      {
        id: "mod-span-temp",
        title: "Suhu Minuman",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "span-ice", name: "Iced (Dingin Berbatu Es)", price_modifier: 0, is_default: true },
          { id: "span-hot", name: "Hot (Hangat Pas)", price_modifier: 0 },
        ],
      },
    ],
  },
  {
    id: "menu-affogato-avocado",
    category_id: "cat-coffee",
    name: "Avocado Coffee Affogato",
    description: "Jus alpukat mentega kental disiram satu shot espresso panas segar dan ditambah satu scoop es krim vanila lembut.",
    price: 26000,
    image_url: "https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Specialty", "Dessert Drink"],
    modifier_groups: [
      {
        id: "mod-affogato-ice",
        title: "Pilihan Es Krim",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "ice-vanilla", name: "Es Krim Vanilla Klasik", price_modifier: 0, is_default: true },
          { id: "ice-choco", name: "Es Krim Cokelat Belgia", price_modifier: 2000 },
        ],
      },
    ],
  },

  // 2. MANUAL & COLD BREW
  {
    id: "menu-v60-gayo",
    category_id: "cat-manual",
    name: "V60 Single Origin Aceh Gayo",
    description: "Seduhan tangan manual filter V60 dengan biji arabica Gayo wet-hulled. Menghasilkan aroma floral, notes asam manis jeruk, dan aftertaste manis.",
    price: 25000,
    image_url: "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Manual Brew", "Single Origin"],
    modifier_groups: [
      {
        id: "mod-v60-brew",
        title: "Metode Penyajian",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "v60-hot", name: "Hot Filtered Pour Over", price_modifier: 0, is_default: true },
          { id: "v60-ice", name: "Japanese Iced Drip (Ekstra Segar)", price_modifier: 2000 },
        ],
      },
    ],
  },
  {
    id: "menu-japanese-toraja",
    category_id: "cat-manual",
    name: "Japanese Drip Toraja Sapan",
    description: "Seduhan manual langsung menetes ke atas es batu murni. Aroma rempah herbal khas Toraja berpadu acidity clean yang sangat menyegarkan.",
    price: 26000,
    image_url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Manual Brew", "Segar"],
    modifier_groups: [],
  },
  {
    id: "menu-coldbrew-signature",
    category_id: "cat-manual",
    name: "Signature Cold Brew 16-Hours",
    description: "Kopi ekstraksi dingin perlahan selama 16 jam. Sangat ramah di lambung, rendah keasaman dengan notes dark chocolate dan molase alami.",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Cold Brew", "Favorit"],
    modifier_groups: [
      {
        id: "mod-coldbrew-style",
        title: "Gaya Minum",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "cb-black", name: "Black Cold Brew Murni (Tanpa Susu)", price_modifier: 0, is_default: true },
          { id: "cb-white", name: "White Cold Brew (+ Sweet Cream Float)", price_modifier: 4000 },
        ],
      },
    ],
  },

  // 3. NON-COFFEE & TEA
  {
    id: "menu-matcha-latte",
    category_id: "cat-non-coffee",
    name: "Matcha Uji Kyoto Latte",
    description: "Bubuk green tea matcha asli dari Uji Kyoto Jepang dengan rasa umami earthy autentik berpadu susu segar yang lembut gurih.",
    price: 24000,
    image_url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Best Seller", "Japanese Matcha"],
    modifier_groups: [
      {
        id: "mod-matcha-temp",
        title: "Pilihan Suhu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "matcha-iced", name: "Iced Matcha Dingin", price_modifier: 0, is_default: true },
          { id: "matcha-hot", name: "Hot Steamed Matcha", price_modifier: 0 },
        ],
      },
      {
        id: "mod-matcha-milk",
        title: "Pilihan Susu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "milk-matcha-fresh", name: "Fresh Milk Creamy", price_modifier: 0, is_default: true },
          { id: "milk-matcha-oat", name: "Oatmilk (+ Gurih Lembut)", price_modifier: 6000 },
        ],
      },
      {
        id: "mod-matcha-sweet",
        title: "Tingkat Kemanisan",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "sweet-norm", name: "Manis Normal", price_modifier: 0, is_default: true },
          { id: "sweet-less", name: "Less Sweet (Lebih Terasa Matcha)", price_modifier: 0 },
        ],
      },
    ],
  },
  {
    id: "menu-red-velvet",
    category_id: "cat-non-coffee",
    name: "Red Velvet Sea Salt Cheese",
    description: "Minuman Red Velvet manis legit bertekstur kental dengan lapisan tebal Sea Salt Cheese Cream gurih di atasnya.",
    price: 25000,
    image_url: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Cheese Cream", "Viral"],
    modifier_groups: [
      {
        id: "mod-red-topping",
        title: "Pilihan Ekstra",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "top-double-cheese", name: "Double Sea Salt Cheese Cream", price_modifier: 5000 },
        ],
      },
    ],
  },
  {
    id: "menu-artisan-chocolate",
    category_id: "cat-non-coffee",
    name: "Belgian Dark Chocolate 70%",
    description: "Cokelat hitam Belgia 70% kaya antioksidan yang dilelehkan bersama susu segar hangat atau es batu. Rasa cokelat mewah nan pekat.",
    price: 23000,
    image_url: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Rich Chocolate"],
    modifier_groups: [
      {
        id: "mod-choco-temp",
        title: "Pilihan Suhu",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "choco-iced", name: "Iced Cold Chocolate", price_modifier: 0, is_default: true },
          { id: "choco-hot", name: "Hot Rich Chocolate", price_modifier: 0 },
        ],
      },
      {
        id: "mod-choco-marshmallow",
        title: "Topping Tambahan",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "top-marshmallow", name: "Soft Marshmallow Float", price_modifier: 3000 },
        ],
      },
    ],
  },
  {
    id: "menu-peach-earlgrey",
    category_id: "cat-non-coffee",
    name: "Earl Grey Lemon Peach Tea",
    description: "Seduhan teh hitam beraroma minyak bergamot Earl Grey dipadukan sari buah persik manis dan perasan lemon segar alami.",
    price: 18000,
    image_url: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Segar", "Artisan Tea"],
    modifier_groups: [
      {
        id: "mod-tea-jelly",
        title: "Pilihan Topping",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "top-selasih", name: "Biji Selasih & Nata de Coco", price_modifier: 3000 },
        ],
      },
    ],
  },

  // 4. SAVORY SNACKS & LIGHT BITES
  {
    id: "menu-truffle-fries",
    category_id: "cat-savory-snack",
    name: "Truffle Parmesan French Fries",
    description: "Kentang goreng renyah keemasan beraroma minyak truffle mewah, ditaburi keju parmesan parut dan parsley kering segar.",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Best Seller", "Favorit Teman Kopi"],
    modifier_groups: [
      {
        id: "mod-fries-sauce",
        title: "Pilihan Saus Cocolan (Wajib Pilih 1)",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "sauce-truffle", name: "Truffle Mayo Gurih", price_modifier: 0, is_default: true },
          { id: "sauce-cheese", name: "Saus Keju Cheddar Lumer", price_modifier: 2000 },
          { id: "sauce-sambal", name: "Saus Sambal Bawang Spesial", price_modifier: 0 },
        ],
      },
      {
        id: "mod-fries-portion",
        title: "Ukuran Porsi",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "port-reg", name: "Porsi Standar (Camilan)", price_modifier: 0, is_default: true },
          { id: "port-jumbo", name: "Porsi Jumbo Sharing (+50% kentang)", price_modifier: 8000 },
        ],
      },
    ],
  },
  {
    id: "menu-chicken-popcorn",
    category_id: "cat-savory-snack",
    name: "Crispy Chicken Popcorn Cabe Garam",
    description: "Daging paha ayam juicy berbalut tepung bumbu krispi renyah, ditumis dengan cabai rawit pedas, bawang putih gurih dan garam kristal.",
    price: 25000,
    image_url: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Pedas Gurih", "Crispy"],
    modifier_groups: [
      {
        id: "mod-popcorn-seasoning",
        title: "Tingkat Pedas Cabe Garam",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "pedas-santai", name: "Pedas Santai (Level 1)", price_modifier: 0, is_default: true },
          { id: "pedas-nampol", name: "Pedas Nampol (Level 3)", price_modifier: 0 },
          { id: "non-pedas", name: "Non-Pedas (Original Seasoning)", price_modifier: 0 },
        ],
      },
    ],
  },
  {
    id: "menu-cireng-rujak",
    category_id: "cat-savory-snack",
    name: "Cireng Crispy Bumbu Rujak (Isi 10 pcs)",
    description: "Cireng khas Sunda bertekstur krispi di luar dan kenyal lembut di dalam, disajikan dengan cocolan sambal rujak pedas manis asam legit.",
    price: 16000,
    image_url: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Traditional", "Kriuk"],
    modifier_groups: [
      {
        id: "mod-cireng-sauce",
        title: "Ekstra Sambal",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "add-rujak", name: "Ekstra 1 Cup Bumbu Rujak", price_modifier: 3000 },
        ],
      },
    ],
  },
  {
    id: "menu-roti-bakar-kornet",
    category_id: "cat-savory-snack",
    name: "Roti Toast Kornet & Melted Cheese",
    description: "Roti brioche tebal dipanggang butter harum dengan isian kornet sapi berbumbu lada hitam dan lelehan keju cheddar gurih melimpah.",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Mengenyangkan", "Favorit"],
    modifier_groups: [
      {
        id: "mod-toast-extra",
        title: "Ekstra Topping",
        min_select: 0,
        max_select: 2,
        options: [
          { id: "toast-mozza", name: "Ekstra Keju Mozzarella Molor", price_modifier: 5000 },
          { id: "toast-egg", name: "Ekstra Telur Mata Sapi Setengah Matang", price_modifier: 4000 },
        ],
      },
    ],
  },
  {
    id: "menu-snack-platter",
    category_id: "cat-savory-snack",
    name: "Snack Platter Combo (Sharing 2-3 Org)",
    description: "Kombinasi komplit: french fries renyah, chicken bites krispi, onion rings keemasan, dan sosis bakar mini dengan aneka cocolan saus.",
    price: 36000,
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Sharing Platter", "Paling Lengkap"],
    modifier_groups: [
      {
        id: "mod-platter-dip",
        title: "Pilihan Saus Kombinasi",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "dip-combo-1", name: "Saus Sambal + Mayo Original", price_modifier: 0, is_default: true },
          { id: "dip-combo-2", name: "Saus Keju Lumer + Truffle Mayo", price_modifier: 4000 },
        ],
      },
    ],
  },

  // 5. SWEET TREATS & PASTRIES
  {
    id: "menu-croissant-almond",
    category_id: "cat-sweet-snack",
    name: "Butter Croissant Toasted Almond",
    description: "Pastry croissant renyah berlapis mentega Prancis murni, bertabur irisan almond panggang harum dan taburan gula bubuk halus.",
    price: 24000,
    image_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Fresh Baked", "French Pastry"],
    modifier_groups: [
      {
        id: "mod-croissant-warm",
        title: "Pilihan Penyajian",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "warm-oven", name: "Dihangatkan di Oven (Warm & Flaky)", price_modifier: 0, is_default: true },
          { id: "room-temp", name: "Suhu Ruang Biasa", price_modifier: 0 },
        ],
      },
      {
        id: "mod-croissant-dip",
        title: "Cocolan Cokelat",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "dip-nutella", name: "Saus Cokelat Nutella Hangat", price_modifier: 5000 },
        ],
      },
    ],
  },
  {
    id: "menu-croffle-caramel",
    category_id: "cat-sweet-snack",
    name: "Croffle Caramel Aren & Butter",
    description: "Croissant waffle krispi beraroma mentega gurih, disiram karamel gula aren hangat dan taburan remah biskuit renyah.",
    price: 22000,
    image_url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Viral Croffle", "Best Seller"],
    modifier_groups: [
      {
        id: "mod-croffle-icecream",
        title: "Tambah Topping Mewah",
        min_select: 0,
        max_select: 1,
        options: [
          { id: "top-ice-vanilla", name: "1 Scoop Es Krim Vanilla Creamy", price_modifier: 5000 },
          { id: "top-lotus-biscoff", name: "Lotus Biscoff Spread & Crumbs", price_modifier: 5000 },
        ],
      },
    ],
  },
  {
    id: "menu-fudgy-brownie-icecream",
    category_id: "cat-sweet-snack",
    name: "Warm Fudgy Brownie & Ice Cream",
    description: "Kue brownies cokelat panggang pekat yang lembut lumer di dalam, disajikan hangat lengkap dengan satu scoop es krim vanilla dingin.",
    price: 26000,
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Chocolate Lovers", "Dessert"],
    modifier_groups: [
      {
        id: "mod-brownie-ice",
        title: "Rasa Es Krim",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "br-vanilla", name: "Es Krim Vanilla Klasik", price_modifier: 0, is_default: true },
          { id: "br-matcha", name: "Es Krim Matcha Kyoto", price_modifier: 2000 },
        ],
      },
    ],
  },
  {
    id: "menu-churros-cinnamon",
    category_id: "cat-sweet-snack",
    name: "Churros Cinnamon Sugar (5 pcs)",
    description: "Churros khas Spanyol renyah di luar lembut di dalam, dibalut gula bubuk kayu manis wangi, disajikan dengan saus cokelat celup hangat.",
    price: 20000,
    image_url: "https://images.unsplash.com/photo-1624300629298-e9de39c13be5?w=600&auto=format&fit=crop&q=80",
    is_available: true,
    tags: ["Finger Food", "Manis"],
    modifier_groups: [
      {
        id: "mod-churros-sauce",
        title: "Pilihan Saus Celup",
        min_select: 1,
        max_select: 1,
        options: [
          { id: "ch-dark-choco", name: "Saus Dark Chocolate Kental", price_modifier: 0, is_default: true },
          { id: "ch-salted-caramel", name: "Saus Salted Caramel Gurih", price_modifier: 0 },
        ],
      },
    ],
  },
];
