import { Order, OrderStatus, PaymentStatus } from "@/types";
import { adminDb } from "@/lib/firebase-admin";

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

export async function saveOrder(order: Order): Promise<Order> {
  // Retain orders in memory when Firebase credentials are not yet supplied,
  // ensuring seamless operation in demo / Vercel preview environments.
  if (!hasFirestoreCredentials() || !process.env.FIREBASE_CLIENT_EMAIL) {
    ordersStore.set(order.id, order);
    return order;
  }
  try {
    await adminDb!.collection("orders").doc(order.id).create(order);
  } catch (err) {
    console.warn("[order-store] Firestore write fallback to in-memory store:", err);
  }
  ordersStore.set(order.id, order);
  return order;
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  // Check memory first
  if (ordersStore.has(orderId)) {
    return ordersStore.get(orderId)!;
  }

  // Check by order_number
  for (const order of ordersStore.values()) {
    if (order.order_number === orderId) {
      return order;
    }
  }

  // Check Firestore
  try {
    if (hasFirestoreCredentials()) {
      const docSnap = await adminDb!.collection("orders").doc(orderId).get();
      if (docSnap.exists) {
        const data = { ...docSnap.data(), id: docSnap.id } as Order;
        ordersStore.set(orderId, data);
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
  if (hasFirestoreCredentials()) await adminDb!.collection("orders").doc(order.id).update({ delivery_status: deliveryStatus, updated_at: updated.updated_at });
  return updated;
}

export async function markWhatsAppConfirmationSent(orderId: string, sentAt: string) {
  const order = ordersStore.get(orderId);
  if (order) ordersStore.set(orderId, { ...order, whatsapp_confirmation_sent_at: sentAt });
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

  // Try Firestore
  try {
    if (hasFirestoreCredentials()) {
      const snap = await adminDb!.collection("orders").get();
      snap.forEach((doc) => {
        result.push({ ...doc.data(), id: doc.id } as Order);
      });
    }
  } catch (err) {
    console.warn("[order-store] Firestore admin query error:", err);
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
