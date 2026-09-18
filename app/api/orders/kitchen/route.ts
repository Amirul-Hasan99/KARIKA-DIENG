import { NextResponse } from "next/server";
import { getAllOrdersAdmin } from "@/lib/order-store";

export async function GET() {
  try {
    const orders = await getAllOrdersAdmin();
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }
}
