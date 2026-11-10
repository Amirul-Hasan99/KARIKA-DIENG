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
    const { order_status, delivery_status } = body as { order_status?: OrderStatus; delivery_status?: string };

    if (delivery_status) {
      const allowed = ["pending", "assigned", "picked_up", "delivered", "failed_attempt"];
      if (!allowed.includes(delivery_status)) return NextResponse.json({ error: "Status pengiriman tidak valid." }, { status: 400 });
      const updated = await updateOrderDeliveryStatus(orderId, delivery_status as NonNullable<import("@/types").Order["delivery_status"]>);
      if (!updated) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
      return NextResponse.json({ success: true, order: updated });
    }

    if (!order_status) {
      return NextResponse.json({ error: "order_status is required" }, { status: 400 });
    }

    const updated = await updateOrderStatus(orderId, order_status);

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
