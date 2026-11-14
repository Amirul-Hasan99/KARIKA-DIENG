import { NextRequest, NextResponse } from "next/server";
import { createSnapTransaction } from "@/lib/midtrans";
import { Order, OrderItem } from "@/types";
import { saveOrder } from "@/lib/order-store";
import { generateOrderNumber } from "@/lib/utils";
import { getAllKarikaProducts } from "@/lib/karika-products";

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
    // Validate request inputs safely
    const body = await req.json();
    const { customerName, customerPhone, address, coordinates, items, paymentType } = body;
    
    // Strict Input Validation
    const errors: string[] = [];
    if (typeof customerName !== "string" || customerName.trim().length < 2) errors.push("Nama tidak valid");
    if (typeof customerPhone !== "string" || customerPhone.replace(/\D/g, "").length < 9) errors.push("Nomor telepon tidak valid");
    if (typeof address !== "string" || address.trim().length < 8) errors.push("Alamat tidak valid");
    if (!coordinates || !Number.isFinite(coordinates.lat) || !Number.isFinite(coordinates.lng)) errors.push("Lokasi tidak valid");
    if (!Array.isArray(items) || items.length === 0) errors.push("Item tidak valid");
    if (!["qris", "cod"].includes(paymentType)) errors.push("Metode pembayaran tidak valid");

    if (errors.length > 0) {
      return NextResponse.json({ error: "Data pesanan tidak valid.", details: errors }, { status: 422 });
    }

    const quantity = items.reduce((sum: number, item: {qty?: number}) => sum + (Number.isSafeInteger(item.qty) && item.qty! > 0 && item.qty! <= 99 ? item.qty! : 0), 0);
    if (quantity < MIN_ITEMS) return NextResponse.json({ error: `Minimum pembelian ${MIN_ITEMS} item.` }, { status: 400 });
    if (items.some((item: {qty?:number}) => !Number.isSafeInteger(item.qty) || item.qty! <= 0 || item.qty! > 99)) return NextResponse.json({ error: "Jumlah item tidak valid." }, { status: 400 });
    
    // Titik Nol Dieng coordinates default fallback
    const originLat = Number(process.env.STORE_LAT || "-7.204176");
    const originLng = Number(process.env.STORE_LNG || "109.911214");
    const origin = { lat: originLat, lng: originLng };
    const distance = distanceKm(origin, coordinates);
    if (distance > MAX_RADIUS_KM) return NextResponse.json({ error: "Alamat berada di luar radius pengiriman 8 km dari Titik Nol Dieng." }, { status: 400 });

    const catalogProducts = getAllKarikaProducts();
    const catalogMap = new Map<string, { name: string; price: number; is_available: boolean }>(
      catalogProducts.map((p) => [p.id, { name: p.name, price: p.price, is_available: p.is_available !== false }])
    );

    const orderItems: OrderItem[] = items.map((item: { productId: string; qty: number }) => {
      const product = catalogMap.get(item.productId) || demoProducts[item.productId];
      if (!product || product.is_available !== true || !Number.isSafeInteger(product.price) || product.price <= 0) {
        throw new Error("Produk belum tersedia atau belum memiliki harga yang dikonfirmasi.");
      }
      const qty = Number(item.qty);
      return {
        menu_id: item.productId,
        name: String(product.name),
        price: product.price,
        qty,
        selected_modifiers: [],
        subtotal: product.price * qty,
      };
    });
    const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const orderNumber = generateOrderNumber("DELIVERY");
    const orderId = `ord_${crypto.randomUUID()}`;
    let snapToken = "", redirectUrl = "", isDummy = false;

    if (paymentType === "qris") {
      try {
        const payment = await createSnapTransaction({
          orderId: orderNumber,
          grossAmount: totalAmount,
          items: orderItems.map((item) => ({ id: item.menu_id, price: item.price, quantity: item.qty, name: item.name.substring(0, 50) })),
          customer: { first_name: customerName.trim().substring(0, 50), phone: customerPhone.trim() },
        });
        snapToken = payment.token || `snap-dummy-${orderNumber}`;
        redirectUrl = payment.redirect_url || `/orders/${orderId}?payment=qris`;
        isDummy = Boolean(payment.isDummy || payment.isSimulated);
      } catch (snapErr) {
        console.warn("[checkout] Midtrans error, falling back to dummy QRIS:", snapErr);
        snapToken = `snap-dummy-${orderNumber}`;
        redirectUrl = `/orders/${orderId}?payment=qris`;
        isDummy = true;
      }
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
    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      paymentType,
      snapToken,
      redirectUrl,
      totalAmount,
      isDummy,
      deliveryDistanceKm: Number(distance.toFixed(2)),
      coordinates,
      address: address.trim(),
    });
  } catch (error) {
    console.error("[checkout-error]", error);
    return NextResponse.json({ error: "Checkout gagal. Silakan coba lagi." }, { status: 500 });
  }
}
