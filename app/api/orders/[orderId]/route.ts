import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@/types";
import { getOrderById, updateOrderStatus, updateOrderDeliveryStatus } from "@/lib/order-store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const order = await getOrderById(orderId);

    if (order) {
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const { order_status, delivery_status } = body as {
      order_status?: OrderStatus;
      delivery_status?: string;
    };

    // Mapping between order_status and delivery_status
    // 1. received  <-> pending (Menunggu diproses toko)
    // 2. cooking   <-> assigned (Mulai kemas & packing / Kurir ditugaskan bersiap)
    // 3. ready     <-> picked_up (Kemas selesai / Kurir OTW pengantaran ke titik maps)
    // 4. completed <-> delivered (Selesai / Pesanan telah tiba di tangan pembeli)

    if (delivery_status) {
      const allowed = ["pending", "assigned", "picked_up", "delivered", "failed_attempt"];
      if (!allowed.includes(delivery_status)) {
        return NextResponse.json({ error: "Status pengiriman tidak valid." }, { status: 400 });
      }

      // Automatically sync corresponding order_status
      let correspondingOrderStatus: OrderStatus | undefined;
      if (delivery_status === "pending") correspondingOrderStatus = "received";
      else if (delivery_status === "assigned") correspondingOrderStatus = "cooking";
      else if (delivery_status === "picked_up") correspondingOrderStatus = "ready";
      else if (delivery_status === "delivered") correspondingOrderStatus = "completed";

      let updated = await updateOrderDeliveryStatus(
        orderId,
        delivery_status as NonNullable<import("@/types").Order["delivery_status"]>
      );

      if (correspondingOrderStatus) {
        updated = await updateOrderStatus(orderId, correspondingOrderStatus);
      }

      if (!updated) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    if (order_status) {
      // Automatically sync corresponding delivery_status
      let correspondingDeliveryStatus: "pending" | "assigned" | "picked_up" | "delivered" | undefined;
      if (order_status === "received") correspondingDeliveryStatus = "pending";
      else if (order_status === "cooking") correspondingDeliveryStatus = "assigned";
      else if (order_status === "ready") correspondingDeliveryStatus = "picked_up";
      else if (order_status === "completed") correspondingDeliveryStatus = "delivered";

      let updated = await updateOrderStatus(orderId, order_status);

      if (correspondingDeliveryStatus) {
        updated = await updateOrderDeliveryStatus(orderId, correspondingDeliveryStatus);
      }

      if (!updated) {
        return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ success: true, order: updated });
    }

    return NextResponse.json(
      { error: "order_status atau delivery_status harus disertakan." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
