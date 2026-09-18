import { NextRequest, NextResponse } from "next/server";
import { OrderStatus } from "@/types";
import { getOrderById, updateOrderStatus } from "@/lib/order-store";

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
    const { order_status } = body as { order_status: OrderStatus };

    if (!order_status) {
      return NextResponse.json({ error: "order_status is required" }, { status: 400 });
    }

    const updated = await updateOrderStatus(orderId, order_status);

    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
