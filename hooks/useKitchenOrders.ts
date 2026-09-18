"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Order, OrderStatus } from "@/types";
import { playKitchenChime } from "@/lib/utils";

export function useKitchenOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const prevOrderCountRef = useRef<number>(0);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Firestore real-time listener
  useEffect(() => {
    let unsubscribe: () => void = () => {};

    try {
      const ordersRef = collection(db, "orders");
      // Listen for orders
      const q = query(
        ordersRef,
        where("payment_status", "in", ["settlement", "pending"]),
        orderBy("created_at", "desc")
      );

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetchedOrders: Order[] = [];
          snapshot.forEach((docSnap) => {
            fetchedOrders.push({
              ...(docSnap.data() as Order),
              id: docSnap.id,
            });
          });

          // Check if any brand new settlement order arrived
          let hasNewArrival = false;
          fetchedOrders.forEach((o) => {
            if (
              !knownOrderIdsRef.current.has(o.id) &&
              o.payment_status === "settlement" &&
              o.order_status === "received"
            ) {
              hasNewArrival = true;
            }
            knownOrderIdsRef.current.add(o.id);
          });

          if (hasNewArrival && soundEnabled && prevOrderCountRef.current > 0) {
            playKitchenChime();
          }

          prevOrderCountRef.current = fetchedOrders.length;
          setOrders(fetchedOrders);
          setIsLoading(false);
        },
        (error) => {
          console.warn("Firestore kitchen subscription warning:", error);
          fetchOrdersApi();
        }
      );
    } catch (e) {
      console.warn("Firestore setup warning:", e);
      fetchOrdersApi();
    }

    // Polling fallback every 4 seconds
    const interval = setInterval(fetchOrdersApi, 4000);

    async function fetchOrdersApi() {
      try {
        const res = await fetch("/api/orders/kitchen");
        if (res.ok) {
          const data = await res.json();
          if (data.orders) {
            const fetchedOrders: Order[] = data.orders;
            let hasNewArrival = false;
            fetchedOrders.forEach((o) => {
              if (
                !knownOrderIdsRef.current.has(o.id) &&
                o.payment_status === "settlement" &&
                o.order_status === "received"
              ) {
                hasNewArrival = true;
              }
              knownOrderIdsRef.current.add(o.id);
            });

            if (hasNewArrival && soundEnabled && prevOrderCountRef.current > 0) {
              playKitchenChime();
            }

            prevOrderCountRef.current = fetchedOrders.length;
            setOrders(fetchedOrders);
            setIsLoading(false);
          }
        }
      } catch (err) {
        // silent catch
      }
    }

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [soundEnabled]);

  const updateOrderStatus = useCallback(
    async (orderId: string, nextStatus: OrderStatus) => {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, order_status: nextStatus } : o))
      );

      // Call API PATCH first for instant server synchronization
      try {
        await fetch(`/api/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order_status: nextStatus }),
        });
      } catch (apiErr) {
        console.warn("API PATCH order status warning:", apiErr);
      }

      // Also update Firestore client if connected
      try {
        const docRef = doc(db, "orders", orderId);
        await updateDoc(docRef, {
          order_status: nextStatus,
          updated_at: new Date().toISOString(),
        });
      } catch (e) {
        // silent catch
      }
    },
    []
  );

  return {
    orders,
    isLoading,
    soundEnabled,
    setSoundEnabled,
    updateOrderStatus,
    playChime: playKitchenChime,
  };
}
