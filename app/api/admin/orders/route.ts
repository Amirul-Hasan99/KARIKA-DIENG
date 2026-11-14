import { NextResponse } from "next/server";
import { getAllOrdersAdmin, cancelOrder, deleteOrder } from "@/lib/order-store";

export async function GET() {
  return NextResponse.json({ orders: await getAllOrdersAdmin() });
}

export async function POST(request: Request) {
  const { action, id, reason } = await request.json();
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

  if (action === "delete") {
    await deleteOrder(id);
    return NextResponse.json({ success: true });
  }
  
  await cancelOrder(id, reason || "Dibatalkan admin");
  return NextResponse.json({ success: true });
}
