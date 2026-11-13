import fs from "fs";
import path from "path";
import { Order, OrderStatus, PaymentStatus } from "@/types";
import { adminDb } from "@/lib/firebase-admin";
import { getNeonSql, ensureNeonTables } from "@/lib/db";

// Global singleton map to survive Next.js module reloads in development
declare global {
  var __globalOrdersStore: Map<string, Order> | undefined;
  var __globalMenuStock: Map<string, boolean> | undefined;
}

if (!global.__globalOrdersStore) {
  global.__globalOrdersStore = new Map<string, Order>();
}

if (!global.__globalMenuStock) {
  global.__globalMenuStock = new Map<string, boolean>();
}

const ordersStore = global.__globalOrdersStore;
const hasFirestoreCredentials = () => Boolean(adminDb && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

const DATA_DIR = path.join(process.cwd(), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(ORDERS_FILE)) {
      // Seed initial dummy/test order so search testing works immediately
      const initialSeed: Order[] = [
        {
          id: "ord_demo_jyqf",
          order_number: "GC-261111-DELIVERY-JYQF",
          table_id: "delivery",
          table_number: "delivery",
          customer_name: "Budiono",
          customer_phone: "083122046357",
          delivery_address: "Kawasan Dieng (Radius 8 km)",
          coordinates: { lat: -7.204176, lng: 109.911214 },
          delivery_distance_km: 2.5,
          total_amount: 110000,
          payment_status: "pending",
          order_status: "received",
          delivery_status: "pending",
          payment_type: "qris",
          items: [
            {
              menu_id: "carica-biasa",
              name: "Carica Biasa · isi 6",
              price: 22000,
              qty: 5,
              selected_modifiers: [],
              subtotal: 110000,
            },
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
      fs.writeFileSync(ORDERS_FILE, JSON.stringify(initialSeed, null, 2), "utf-8");
    }
  } catch (err) {
    console.warn("[order-store] Failed to ensure data file:", err);
  }
}

export function loadOrdersFromFile(): Order[] {
  try {
    ensureDataFile();
    if (fs.existsSync(ORDERS_FILE)) {
      const content = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(content || "[]");
    }
  } catch (err) {
    console.warn("[order-store] Failed to load orders from file:", err);
  }
  return [];
}

export function saveOrdersToFile(orders: Order[]) {
  try {
    ensureDataFile();
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  } catch (err) {
    console.warn("[order-store] Failed to save orders to file:", err);
  }
}

function persistOrderToDisk(order: Order) {
  try {
    const list = loadOrdersFromFile();
    const idx = list.findIndex((o) => o.id === order.id || o.order_number === order.order_number);
    if (idx >= 0) {
      list[idx] = order;
    } else {
      list.unshift(order);
    }
    saveOrdersToFile(list);
  } catch (err) {
    console.warn("[order-store] Failed to persist single order to disk:", err);
  }
}

// Initial populate of in-memory store from disk
try {
  const initialDiskOrders = loadOrdersFromFile();
  for (const o of initialDiskOrders) {
    if (o && o.id) {
      ordersStore.set(o.id, o);
    }
  }
} catch (err) {}

async function saveOrderToNeon(order: Order) {
  try {
    const sql = getNeonSql();
    if (!sql) return;
    await ensureNeonTables();

    const writePromise = sql`
      INSERT INTO orders (
        id, order_number, customer_id, table_id, table_number,
        customer_name, customer_phone, delivery_address, coordinates,
        delivery_distance_km, total_amount, payment_status, order_status,
        delivery_status, payment_type, midtrans_transaction_id, snap_token,
        snap_redirect_url, items, created_at, updated_at
      ) VALUES (
        ${order.id},
        ${order.order_number},
        ${order.customer_id || null},
        ${order.table_id || 'delivery'},
        ${order.table_number || 'delivery'},
        ${order.customer_name || null},
        ${order.customer_phone || null},
        ${order.delivery_address || null},
        ${order.coordinates ? JSON.stringify(order.coordinates) : null}::jsonb,
        ${order.delivery_distance_km || 0},
        ${order.total_amount || 0},
        ${order.payment_status || 'pending'},
        ${order.order_status || 'received'},
        ${order.delivery_status || 'pending'},
        ${order.payment_type || 'qris'},
        ${order.midtrans_transaction_id || null},
        ${order.snap_token || null},
        ${order.snap_redirect_url || null},
        ${JSON.stringify(order.items || [])}::jsonb,
        ${order.created_at || new Date().toISOString()},
        ${order.updated_at || new Date().toISOString()}
      )
      ON CONFLICT (id) DO UPDATE SET
        payment_status = EXCLUDED.payment_status,
        order_status = EXCLUDED.order_status,
        delivery_status = EXCLUDED.delivery_status,
        delivery_address = EXCLUDED.delivery_address,
        coordinates = EXCLUDED.coordinates,
        delivery_distance_km = EXCLUDED.delivery_distance_km,
        midtrans_transaction_id = EXCLUDED.midtrans_transaction_id,
        updated_at = EXCLUDED.updated_at
    `;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Neon query timeout (2000ms)')), 2000)
    );

    await Promise.race([writePromise, timeoutPromise]);
  } catch (err: any) {
    // Non-blocking fallback to disk and memory
    console.warn("[order-store] Neon write note:", err.message);
  }
}

export async function saveOrder(order: Order): Promise<Order> {
  // Always update in-memory and disk first for instant response
  ordersStore.set(order.id, order);
  persistOrderToDisk(order);

  // Sync to Neon asynchronously
  saveOrderToNeon(order).catch(() => {});

  if (!hasFirestoreCredentials() || !process.env.FIREBASE_CLIENT_EMAIL) {
    return order;
  }
  try {
    await adminDb!.collection("orders").doc(order.id).create(order);
  } catch (err) {
    console.warn("[order-store] Firestore write fallback to disk/memory store:", err);
  }
  return order;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  // 1. Check memory first
  if (ordersStore.has(orderId)) {
    return ordersStore.get(orderId)!;
  }

  // 2. Check by order_number in memory
  for (const order of ordersStore.values()) {
    if (order.order_number === orderId) {
      return order;
    }
  }

  // 3. Check local disk file
  try {
    const diskOrders = loadOrdersFromFile();
    const matched = diskOrders.find((o) => o.id === orderId || o.order_number === orderId);
    if (matched) {
      ordersStore.set(matched.id, matched);
      return matched;
    }
  } catch (err) {
    console.warn("[order-store] Disk read error:", err);
  }

  // 4. Check Neon PostgreSQL
  try {
    const sql = getNeonSql();
    if (sql && (global as any).__neonReachable !== false) {
      const queryPromise = sql`
        SELECT * FROM orders 
        WHERE id = ${orderId} OR order_number = ${orderId} 
        LIMIT 1
      `;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Neon read timeout')), 1500)
      );
      const rows: any = await Promise.race([queryPromise, timeoutPromise]);
      if (rows && rows.length > 0) {
        (global as any).__neonReachable = true;
        const row = rows[0];
        const neonOrder: Order = {
          id: row.id,
          order_number: row.order_number,
          customer_id: row.customer_id,
          table_id: row.table_id || 'delivery',
          table_number: row.table_number || 'delivery',
          customer_name: row.customer_name,
          customer_phone: row.customer_phone,
          delivery_address: row.delivery_address,
          coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates,
          delivery_distance_km: Number(row.delivery_distance_km || 0),
          total_amount: Number(row.total_amount || 0),
          payment_status: row.payment_status as PaymentStatus,
          order_status: row.order_status as OrderStatus,
          delivery_status: row.delivery_status,
          payment_type: row.payment_type,
          midtrans_transaction_id: row.midtrans_transaction_id,
          snap_token: row.snap_token,
          snap_redirect_url: row.snap_redirect_url,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
          created_at: row.created_at,
          updated_at: row.updated_at,
        };
        ordersStore.set(neonOrder.id, neonOrder);
        persistOrderToDisk(neonOrder);
        return neonOrder;
      }
    }
  } catch (err: any) {
    // Fall through to Firestore
  }

  // 5. Check Firestore
  try {
    if (hasFirestoreCredentials()) {
      const docSnap = await adminDb!.collection("orders").doc(orderId).get();
      if (docSnap.exists) {
        const data = { ...docSnap.data(), id: docSnap.id } as Order;
        ordersStore.set(orderId, data);
        persistOrderToDisk(data);
        return data;
      }

      // Check by order_number
      const querySnap = await adminDb!
        .collection("orders")
        .where("order_number", "==", orderId)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        const doc = querySnap.docs[0];
        const data = { ...doc.data(), id: doc.id } as Order;
        ordersStore.set(data.id, data);
        persistOrderToDisk(data);
        return data;
      }
    }
  } catch (err) {
    console.warn("[order-store] Firestore read fallback:", err);
  }

  return null;
}

export async function updateOrderPayment(
  orderNumberOrId: string,
  paymentStatus: PaymentStatus,
  paymentType: string = "qris",
  transactionId?: string
): Promise<Order | null> {
  let matchedOrder: Order | null = null;
  let targetId = orderNumberOrId;

  // Find in memory
  if (ordersStore.has(orderNumberOrId)) {
    matchedOrder = ordersStore.get(orderNumberOrId)!;
    targetId = matchedOrder.id;
  } else {
    for (const [id, order] of ordersStore.entries()) {
      if (order.order_number === orderNumberOrId || order.id === orderNumberOrId) {
        matchedOrder = order;
        targetId = id;
        break;
      }
    }
  }

  // Find in disk if still not found
  if (!matchedOrder) {
    const diskOrders = loadOrdersFromFile();
    const diskMatch = diskOrders.find((o) => o.id === orderNumberOrId || o.order_number === orderNumberOrId);
    if (diskMatch) {
      matchedOrder = diskMatch;
      targetId = diskMatch.id;
    }
  }

  const now = new Date().toISOString();
  const nextOrderStatus: OrderStatus = paymentStatus === "settlement" ? "received" : (matchedOrder?.order_status || "received");

  if (matchedOrder) {
    const updated: Order = {
      ...matchedOrder,
      payment_status: paymentStatus,
      order_status: nextOrderStatus,
      payment_type: paymentType,
      midtrans_transaction_id: transactionId || matchedOrder.midtrans_transaction_id,
      updated_at: now,
    };
    ordersStore.set(targetId, updated);
    persistOrderToDisk(updated);
    matchedOrder = updated;
  }

  // Update Firestore
  try {
    if (hasFirestoreCredentials()) {
      const ordersRef = adminDb!.collection("orders");
      const updatePayload: any = {
        payment_status: paymentStatus,
        order_status: nextOrderStatus,
        payment_type: paymentType,
        midtrans_transaction_id: transactionId || "",
        payment_proof_url: matchedOrder?.payment_proof_url || null,
        payment_proof_uploaded_at: matchedOrder?.payment_proof_uploaded_at || null,
        updated_at: now,
      };

      const docSnap = await ordersRef.doc(targetId).get();
      if (docSnap.exists) {
        await ordersRef.doc(targetId).update(updatePayload);
      } else {
        const querySnap = await ordersRef.where("order_number", "==", orderNumberOrId).limit(1).get();
        if (!querySnap.empty) {
          await ordersRef.doc(querySnap.docs[0].id).update(updatePayload);
        }
      }
    }
  } catch (err) {
    console.warn("[order-store] Firestore payment update error:", err);
  }

  // Sync to Neon
  if (matchedOrder) {
    saveOrderToNeon(matchedOrder).catch(() => {});
  }

  return matchedOrder;
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...order,
    order_status: newStatus,
    updated_at: now,
  };

  ordersStore.set(order.id, updated);
  persistOrderToDisk(updated);

  // Sync to Neon
  try {
    const sql = getNeonSql();
    if (sql) {
      sql`UPDATE orders SET order_status = ${newStatus}, updated_at = ${now} WHERE id = ${order.id} OR order_number = ${order.id}`.catch(() => {});
    }
  } catch (e) {}

  try {
    if (hasFirestoreCredentials()) {
      await adminDb!.collection("orders").doc(order.id).update({
        order_status: newStatus,
        updated_at: now,
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore status update error:", err);
  }

  return updated;
}

export async function updateOrderDeliveryStatus(orderId: string, deliveryStatus: NonNullable<Order["delivery_status"]>): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;
  const updated = { ...order, delivery_status: deliveryStatus, updated_at: new Date().toISOString() };
  ordersStore.set(order.id, updated);
  persistOrderToDisk(updated);

  // Sync to Neon
  try {
    const sql = getNeonSql();
    if (sql) {
      sql`UPDATE orders SET delivery_status = ${deliveryStatus}, updated_at = ${updated.updated_at} WHERE id = ${order.id} OR order_number = ${order.id}`.catch(() => {});
    }
  } catch (e) {}

  if (hasFirestoreCredentials()) await adminDb!.collection("orders").doc(order.id).update({ delivery_status: deliveryStatus, updated_at: updated.updated_at });
  return updated;
}

export async function markWhatsAppConfirmationSent(orderId: string, sentAt: string) {
  const order = await getOrderById(orderId);
  if (order) {
    const updated = { ...order, whatsapp_confirmation_sent_at: sentAt };
    ordersStore.set(orderId, updated);
    persistOrderToDisk(updated);
  }
  if (hasFirestoreCredentials()) await adminDb!.collection("orders").doc(orderId).update({ whatsapp_confirmation_sent_at: sentAt });
}

export async function getAllKitchenOrders(): Promise<Order[]> {
  const result: Order[] = [];

  // Try Firestore
  try {
    if (hasFirestoreCredentials()) {
      const snap = await adminDb!
        .collection("orders")
        .where("payment_status", "==", "settlement")
        .get();

      snap.forEach((doc) => {
        result.push({ ...doc.data(), id: doc.id } as Order);
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore kitchen query error:", err);
  }

  // Merge disk orders
  const diskOrders = loadOrdersFromFile();
  for (const order of diskOrders) {
    if (order.payment_status === "settlement") {
      if (!result.some((o) => o.id === order.id)) {
        result.push(order);
      }
    }
  }

  // Merge in-memory orders
  for (const order of ordersStore.values()) {
    if (order.payment_status === "settlement") {
      if (!result.some((o) => o.id === order.id)) {
        result.push(order);
      }
    }
  }

  // Sort descending by created_at
  result.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return result;
}

export async function getAllOrdersAdmin(): Promise<Order[]> {
  const result: Order[] = [];

  // Start with disk orders immediately (always fast)
  const diskOrders = loadOrdersFromFile();
  for (const order of diskOrders) {
    result.push(order);
  }

  // Merge in-memory orders
  for (const order of ordersStore.values()) {
    if (!result.some((o) => o.id === order.id)) {
      result.push(order);
    }
  }

  // Try Neon DB asynchronously (only if previous attempts haven't timed out)
  try {
    const sql = getNeonSql();
    if (sql && global.__neonReachable !== false) {
      const neonPromise = sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 150`;
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Neon query timeout')), 1500)
      );
      const rows: any = await Promise.race([neonPromise, timeoutPromise]);
      if (Array.isArray(rows)) {
        // Mark as reachable
        (global as any).__neonReachable = true;
        for (const row of rows) {
          const neonOrder: Order = {
            id: row.id,
            order_number: row.order_number,
            customer_id: row.customer_id,
            table_id: row.table_id || 'delivery',
            table_number: row.table_number || 'delivery',
            customer_name: row.customer_name,
            customer_phone: row.customer_phone,
            delivery_address: row.delivery_address,
            coordinates: typeof row.coordinates === 'string' ? JSON.parse(row.coordinates) : row.coordinates,
            delivery_distance_km: Number(row.delivery_distance_km || 0),
            total_amount: Number(row.total_amount || 0),
            payment_status: row.payment_status as PaymentStatus,
            order_status: row.order_status as OrderStatus,
            delivery_status: row.delivery_status,
            payment_type: row.payment_type,
            midtrans_transaction_id: row.midtrans_transaction_id,
            snap_token: row.snap_token,
            snap_redirect_url: row.snap_redirect_url,
            items: typeof row.items === 'string' ? JSON.parse(row.items) : (row.items || []),
            created_at: row.created_at,
            updated_at: row.updated_at,
          };
          if (!result.some((o) => o.id === neonOrder.id)) {
            result.push(neonOrder);
          } else {
            // Neon is authoritative for the full record — replace
            const idx = result.findIndex((o) => o.id === neonOrder.id);
            if (idx >= 0) result[idx] = neonOrder;
          }
        }
      }
    }
  } catch (err: any) {
    // Non-blocking fallback - mark as unreachable if timeout
    if (err.message && err.message.includes('timeout')) {
      (global as any).__neonReachable = false;
    }
  }

  // Try Firestore
  try {
    if (hasFirestoreCredentials()) {
      const snap = await adminDb!.collection("orders").get();
      snap.forEach((doc) => {
        const d = { ...doc.data(), id: doc.id } as Order;
        if (!result.some((o) => o.id === d.id)) {
          result.push(d);
        }
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore admin query error:", err);
  }

  // Merge disk orders
  const diskOrders2 = loadOrdersFromFile();
  for (const order of diskOrders2) {
    if (!result.some((o) => o.id === order.id)) {
      result.push(order);
    }
  }

  // Merge in-memory orders
  for (const order of ordersStore.values()) {
    if (!result.some((o) => o.id === order.id)) {
      result.push(order);
    }
  }

  // Sort descending by created_at
  result.sort((a, b) => {
    const timeA = new Date(a.created_at || 0).getTime();
    const timeB = new Date(b.created_at || 0).getTime();
    return timeB - timeA;
  });

  return result;
}

export async function cancelOrder(orderId: string, reason: string = "Dibatalkan"): Promise<Order | null> {
  const order = await getOrderById(orderId);
  if (!order) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...order,
    payment_status: "failed",
    order_status: "completed",
    updated_at: now,
  };

  ordersStore.set(order.id, updated);
  persistOrderToDisk(updated);

  try {
    if (hasFirestoreCredentials()) {
      await adminDb!.collection("orders").doc(order.id).update({
        payment_status: "failed",
        order_status: "completed",
        updated_at: now,
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore cancel order error:", err);
  }

  return updated;
}

export async function updateOrderPaymentProof(
  orderIdOrNumber: string,
  proofUrl: string
): Promise<Order | null> {
  let matchedOrder: Order | null = null;
  let targetId = orderIdOrNumber;

  // 1. Check in-memory store
  if (ordersStore.has(orderIdOrNumber)) {
    matchedOrder = ordersStore.get(orderIdOrNumber)!;
    targetId = matchedOrder.id;
  } else {
    for (const [id, order] of ordersStore.entries()) {
      if (order.order_number === orderIdOrNumber || order.id === orderIdOrNumber) {
        matchedOrder = order;
        targetId = id;
        break;
      }
    }
  }

  // 2. Check disk file
  if (!matchedOrder) {
    const diskOrders = loadOrdersFromFile();
    const diskMatch = diskOrders.find((o) => o.id === orderIdOrNumber || o.order_number === orderIdOrNumber);
    if (diskMatch) {
      matchedOrder = diskMatch;
      targetId = diskMatch.id;
    }
  }

  // 3. Fallback to getOrderById
  if (!matchedOrder) {
    matchedOrder = await getOrderById(orderIdOrNumber);
    if (matchedOrder) targetId = matchedOrder.id;
  }

  if (!matchedOrder) return null;

  const now = new Date().toISOString();
  const updated: Order = {
    ...matchedOrder,
    payment_proof_url: proofUrl,
    payment_proof_uploaded_at: now,
    updated_at: now,
  };

  ordersStore.set(targetId, updated);
  persistOrderToDisk(updated);

  // Update in Neon PostgreSQL if available
  try {
    const sql = getNeonSql();
    if (sql && (global as any).__neonReachable !== false) {
      await sql`
        UPDATE orders 
        SET payment_proof_url = ${proofUrl},
            payment_proof_uploaded_at = ${now},
            updated_at = ${now}
        WHERE id = ${targetId} OR order_number = ${orderIdOrNumber}
      `;
    }
  } catch (err) {
    console.warn("[order-store] Neon update payment proof error:", err);
  }

  // Update in Firestore if available
  try {
    if (hasFirestoreCredentials()) {
      await adminDb!.collection("orders").doc(targetId).update({
        payment_proof_url: proofUrl,
        payment_proof_uploaded_at: now,
        updated_at: now,
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore update payment proof error:", err);
  }

  return updated;
}

export function getMenuStockMap(): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  if (global.__globalMenuStock) {
    for (const [id, avail] of global.__globalMenuStock.entries()) {
      result[id] = avail;
    }
  }
  return result;
}

export function setMenuItemAvailability(menuId: string, isAvailable: boolean) {
  if (!global.__globalMenuStock) {
    global.__globalMenuStock = new Map();
  }
  global.__globalMenuStock.set(menuId, isAvailable);
}
