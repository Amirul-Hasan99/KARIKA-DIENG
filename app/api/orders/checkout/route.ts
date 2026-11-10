import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { createSnapTransaction } from "@/lib/midtrans";
import { Order, OrderItem } from "@/types";
import { saveOrder } from "@/lib/order-store";
import { generateOrderNumber } from "@/lib/utils";

const MAX_RADIUS_KM = 8;
const MIN_ITEMS = 5;
const demoProducts: Record<string, { name: string; price: number; is_available: boolean }> = {
  "carica-biasa": { name: "Carica Biasa · isi 6", price: 22000, is_available: true },
  "carica-premium": { name: "Carica Premium · isi 6", price: 40000, is_available: true },
  "carica-kardus": { name: "Carica Kardus · isi 6", price: 22000, is_available: true },
  "mie-ongklok": { name: "Mie Ongklok Instan · isi 6", price: 78000, is_available: true },
  "pitos-gurih": { name: "Pitos Gurih · isi 6", price: 90000, is_available: true },
  "keripik-carica": { name: "Keripik Carica · isi 6", price: 90000, is_available: true },
  "keripik-combro": { name: "Keripik Combro · isi 6", price: 78000, is_available: true },
  "keripik-jamur": { name: "Keripik Jamur · isi 6", price: 150000, is_available: true },
  purwaceng: { name: "Purwaceng · isi 6", price: 240000, is_available: true },
};
const distanceKm = (a: {lat:number;lng:number}, b: {lat:number;lng:number}) => {
  const rad = (n:number) => n * Math.PI / 180;
  const dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng);
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
};

export async function POST(req: NextRequest) {
  try {
    if (!adminDb && !(process.env.NODE_ENV !== "production" && process.env.DEMO_CHECKOUT === "true")) return NextResponse.json({ error: "Penyimpanan pesanan belum dikonfigurasi." }, { status: 503 });
    const body = await req.json();
    const { customerName, customerPhone, address, coordinates, items, paymentType } = body;
    if (typeof customerName !== "string" || customerName.trim().length < 2 || typeof customerPhone !== "string" || customerPhone.replace(/\D/g, "").length < 9 || typeof address !== "string" || address.trim().length < 8) {
      return NextResponse.json({ error: "Nama, nomor telepon, dan alamat lengkap wajib diisi." }, { status: 400 });
    }
    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng) || Math.abs(coordinates.lat) > 90 || Math.abs(coordinates.lng) > 180) {
      return NextResponse.json({ error: "Pin lokasi pengantaran tidak valid." }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0 || !["qris", "cod"].includes(paymentType)) {
      return NextResponse.json({ error: "Item pesanan atau metode pembayaran tidak valid." }, { status: 400 });
    }
    const quantity = items.reduce((sum: number, item: {qty?: number}) => sum + (Number.isSafeInteger(item.qty) && item.qty! > 0 && item.qty! <= 99 ? item.qty! : 0), 0);
    if (quantity < MIN_ITEMS) return NextResponse.json({ error: `Minimum pembelian ${MIN_ITEMS} item.` }, { status: 400 });
    if (items.some((item: {qty?:number}) => !Number.isSafeInteger(item.qty) || item.qty! <= 0 || item.qty! > 99)) return NextResponse.json({ error: "Jumlah item tidak valid." }, { status: 400 });
    if (!process.env.STORE_LAT || !process.env.STORE_LNG) return NextResponse.json({ error: "Koordinat titik operasional belum dikonfigurasi." }, { status: 503 });
    const origin = { lat: Number(process.env.STORE_LAT), lng: Number(process.env.STORE_LNG) };
    if (!Number.isFinite(origin.lat) || !Number.isFinite(origin.lng)) return NextResponse.json({ error: "Koordinat titik operasional tidak valid." }, { status: 503 });
    const distance = distanceKm(origin, coordinates);
    if (distance > MAX_RADIUS_KM) return NextResponse.json({ error: "Alamat berada di luar radius pengiriman 8 km." }, { status: 400 });

    const refs = items.map((item: {productId?:string}) => {
      if (typeof item.productId !== "string" || !/^[\w-]{1,100}$/.test(item.productId)) throw new Error("Produk tidak valid.");
      return adminDb!.collection("products").doc(item.productId);
    });
    const snapshots = process.env.NODE_ENV !== "production" && process.env.DEMO_CHECKOUT === "true"
      ? await Promise.all(items.map(async (item: {productId:string}, index:number) => ({ id: item.productId, exists: true, data: () => demoProducts[item.productId], ...({} as object) })))
      : await Promise.all(refs.map((ref) => ref.get()));
    const orderItems: OrderItem[] = snapshots.map((snapshot: any, index: number) => {
      const product = snapshot.data();
      if (!snapshot.exists || product?.is_available !== true || !Number.isSafeInteger(product?.price) || product.price <= 0) throw new Error("Produk belum tersedia atau belum memiliki harga yang dikonfirmasi.");
      const qty = items[index].qty as number;
      return { menu_id: snapshot.id, name: String(product.name), price: product.price, qty, selected_modifiers: [], subtotal: product.price * qty };
    });
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderNumber = generateOrderNumber("DELIVERY");
    const orderId = `ord_${crypto.randomUUID()}`;
    let snapToken = "", redirectUrl = "";
    if (paymentType === "qris") {
      const payment = await createSnapTransaction({
        orderId: orderNumber,
        grossAmount: totalAmount,
        items: orderItems.map((item) => ({ id: item.menu_id, price: item.price, quantity: item.qty, name: item.name.substring(0, 50) })),
        customer: { first_name: customerName.trim().substring(0, 50), phone: customerPhone.trim() },
      });
      if (payment.isSimulated || !payment.token || !payment.redirect_url) throw new Error("Pembayaran QRIS belum tersedia. Konfigurasi Midtrans terlebih dahulu.");
      snapToken = payment.token;
      redirectUrl = payment.redirect_url;
    }
    const now = new Date().toISOString();
    const order = {
      id: orderId, order_number: orderNumber, table_id: "delivery", table_number: "delivery", customer_name: customerName.trim(), customer_phone: customerPhone.trim(),
      delivery_address: address.trim(), coordinates, delivery_distance_km: Number(distance.toFixed(2)),
      items: orderItems, total_amount: totalAmount, payment_status: "pending", order_status: "received",
      delivery_status: "pending", payment_type: paymentType, snap_token: snapToken, snap_redirect_url: redirectUrl,
      created_at: now, updated_at: now,
    } satisfies Order;
    await saveOrder(order);
    return NextResponse.json({ success: true, orderId, orderNumber, paymentType, snapToken, redirectUrl, totalAmount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Checkout gagal.";
    const status = /belum tersedia|belum memiliki harga|tidak valid/.test(message) ? 400 : 503;
    return NextResponse.json({ error: message }, { status });
  }
}
