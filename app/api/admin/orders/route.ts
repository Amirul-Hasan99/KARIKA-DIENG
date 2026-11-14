import { NextResponse } from "next/server";
import { getAllOrdersAdmin, cancelOrder } from "@/lib/order-store";

export async function GET() {
  return NextResponse.json({ orders: await getAllOrdersAdmin() });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  
  await cancelOrder(id, "Dihapus admin");
  return NextResponse.json({ success: true });
}
