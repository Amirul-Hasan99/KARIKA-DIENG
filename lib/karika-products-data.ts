export interface KarikaProduct {
  id: string;
  name: string;
  group: "Carica" | "Makanan" | "Camilan" | "Minuman";
  pack: string;
  price: number;
  description: string;
  image: string;
  source?: string;
  note?: string;
  is_available: boolean;
  stock_qty?: number;
}

export const KARIKA_CATEGORIES = [
  { id: "Semua", name: "Semua Produk", icon: "box-alt" },
  { id: "Carica", name: "Carica Dieng", icon: "box-alt" },
  { id: "Makanan", name: "Makanan Khas", icon: "restaurant" },
  { id: "Camilan", name: "Camilan Renyah", icon: "cookie" },
  { id: "Minuman", name: "Minuman Herbal", icon: "mug-hot-alt" },
];

export const INITIAL_KARIKA_PRODUCTS: KarikaProduct[] = [
  {
    id: "carica-biasa",
    name: "Carica Biasa",
    group: "Carica",
    pack: "6 cup × 115 g",
    price: 22000,
    description: "Potongan pepaya gunung Dieng yang lembut dengan sirup manis segar. Nikmat disajikan dingin.",
    image: "https://ayopromo.com/show-picture?path=gambar%2Fproduk%2FcCVpzIO5LdcBNAiT9hNdNhWOmOhJh9dsMmMcDi3V.jpg",
    source: "https://ayopromo.com/produk/carica-delicia-isi-6-kemasan-plastik",
    note: "Harga pembanding listing publik.",
    is_available: true,
    stock_qty: 150,
  },
  {
    id: "carica-premium",
    name: "Carica Premium",
    group: "Carica",
    pack: "6 cup besar",
    price: 40000,
    description: "Pilihan kemasan cup besar untuk berbagi; buah carica pilihan dalam sirup khas dataran tinggi Dieng.",
    image: "https://down-id.img.susercontent.com/file/id-11134207-7ra0k-mc7nllxauxj618",
    source: "https://shopee.co.id/Carica-Sumbing-Segar-Kemasan-Plastik-isi-6-Cup-Khas-Dieng-Wonosobo-Ekonomis-i.168398720.44458581587",
    note: "Pilihan kualitas terbaik dengan isi buah lebih padat.",
    is_available: true,
    stock_qty: 85,
  },
  {
    id: "carica-kardus",
    name: "Carica Kardus",
    group: "Carica",
    pack: "1 box · 6 cup",
    price: 22000,
    description: "Paket carica dalam kotak oleh-oleh higienis berisi enam cup praktis untuk dibawa pulang.",
    image: "https://down-id.img.susercontent.com/file/id-11134207-7qukz-ljjkt9mggwtmdf",
    source: "https://shopee.co.id/Carica-khas-Wonosobo-kemasan-dus-isi-6cup-100-gula-asli-i.883597447.18591135523",
    note: "Kemasan eksklusif oleh-oleh.",
    is_available: true,
    stock_qty: 120,
  },
  {
    id: "mie-ongklok",
    name: "Mie Ongklok Instan",
    group: "Makanan",
    pack: "6 bungkus",
    price: 78000,
    description: "Versi praktis kuliner legendaris Wonosobo lengkap dengan mie, sayuran kering, bumbu kacang ebi & kuah kental.",
    image: "/images/mie-ongklok.jpg",
    source: "https://yuasafood.com/artikel/48-mie-ongklok-instan",
    note: "Siap seduh & masak 5 menit.",
    is_available: true,
    stock_qty: 60,
  },
  {
    id: "pitos-gurih",
    name: "Pitos Gurih",
    group: "Camilan",
    pack: "6 bungkus",
    price: 90000,
    description: "Camilan olahan tempe renyah dengan rasa gurih ketumbar alami, cocok untuk teman perjalanan Dieng.",
    image: "https://ayopromo.com/show-picture?path=gambar%2Fproduk%2FrEnedYU9YTufLmEcqkQA8MxBz7sdDvCKwukrPagV.jpg",
    source: "https://ayopromo.com/produk/petos-2",
    note: "Renyah tanpa bahan pengawet.",
    is_available: true,
    stock_qty: 90,
  },
  {
    id: "keripik-carica",
    name: "Keripik Carica",
    group: "Camilan",
    pack: "6 bungkus",
    price: 90000,
    description: "Irisan carica asli pegunungan yang diproses vacuum frying hingga kriuk manis alami khas Dieng.",
    image: "https://jadesta.kemenpar.go.id/imgpost/138959.jpg",
    source: "https://jadesta.kemenpar.go.id/paket/keripik_carica",
    note: "Kriuk renyah tahan lama.",
    is_available: true,
    stock_qty: 70,
  },
  {
    id: "keripik-combro",
    name: "Keripik Combro",
    group: "Camilan",
    pack: "6 bungkus",
    price: 78000,
    description: "Camilan kering berbahan singkong pilihan dengan isian oncom pedas gurih khas Wonosobo.",
    image: "https://down-id.img.susercontent.com/file/id-11134207-7qukz-ljss03pvr4fe68",
    source: "https://shopee.co.id/Keripik-Combro-Kering-Comring-300-gram-Oleh-Oleh-Khas-Wonosobo-Jajan-Nusantara-dari-Singkong-i.275141487.20829669819",
    note: "Rasa autentik tradisional.",
    is_available: true,
    stock_qty: 65,
  },
  {
    id: "keripik-jamur",
    name: "Keripik Jamur",
    group: "Camilan",
    pack: "6 bungkus",
    price: 150000,
    description: "Jamur tiram budidaya lereng Dieng berbalut bumbu rempah tipis, digoreng garing non-kolesterol.",
    image: "https://raja-wisata.com/wp-content/uploads/2024/09/Keripik-Jamur-Dieng.jpg",
    source: "https://raja-wisata.com/ragam-oleh-oleh-khas-dieng-yang-bisa-dipilih-saat-berwisata-ke-dieng/",
    note: "Favorit wisatawan mancanegara & domestik.",
    is_available: true,
    stock_qty: 40,
  },
  {
    id: "purwaceng",
    name: "Purwaceng",
    group: "Minuman",
    pack: "6 kemasan",
    price: 240000,
    description: "Minuman herbal berkhasiat dari akar tanaman purwaceng endemik Dieng untuk stamina dan kehangatan tubuh.",
    image: "/images/purwaceng.jpg",
    source: "https://parboaboa.com/oleh-oleh-khas-dieng",
    note: "Herbal legendaris khas Dieng.",
    is_available: true,
    stock_qty: 50,
  },
];

