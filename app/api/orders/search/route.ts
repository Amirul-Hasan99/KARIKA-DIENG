import { NextRequest, NextResponse } from "next/server";
import { getAllOrdersAdmin } from "@/lib/order-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();
    const table = (searchParams.get("table") || "").trim();

    if (!q && !table) {
      return NextResponse.json(
        { error: "Parameter q (No. Order / ID Pembeli) atau table harus diisi." },
        { status: 400 }
      );
    }

    const allOrders = await getAllOrdersAdmin();

    const matched = allOrders.filter((order) => {
      // If table query provided
      if (table && order.table_number === table) {
        return true;
      }

      if (q) {
        if (order.order_number.toLowerCase() === q) return true;
        if (order.id.toLowerCase() === q) return true;
        if (order.customer_id && order.customer_id.toLowerCase() === q) return true;
        if (order.order_number.toLowerCase().includes(q)) return true;
        if (order.customer_name && order.customer_name.toLowerCase().includes(q)) return true;
        const cleanQueryPhone = q.replace(/\D/g, "");
        if (cleanQueryPhone.length >= 4 && order.customer_phone) {
          const cleanOrderPhone = order.customer_phone.replace(/\D/g, "");
          if (cleanOrderPhone.includes(cleanQueryPhone)) return true;
        }
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      count: matched.length,
      orders: matched.slice(0, 10), // Limit top 10
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
