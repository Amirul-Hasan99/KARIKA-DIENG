import { NextResponse } from "next/server";
import { getAllOrdersAdmin } from "@/lib/order-store";

export async function GET() {
  return NextResponse.json({ orders: await getAllOrdersAdmin() });
}
