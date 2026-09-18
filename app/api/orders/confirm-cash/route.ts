import { NextRequest, NextResponse } from "next/server";
import { updateOrderPayment } from "@/lib/order-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const updated = await updateOrderPayment(orderId, "settlement", "cash", `cash_${Date.now()}`);

    if (!updated) {
      return NextResponse.json(
        { error: "Order not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pembayaran tunai berhasil dikonfirmasi!",
      order: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
