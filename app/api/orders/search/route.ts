import { NextRequest, NextResponse } from "next/server";
import { getAllOrdersAdmin } from "@/lib/order-store";

function normalizeIndoPhone(val?: string): string {
  if (!val) return "";
  const digits = val.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits.slice(2);
  if (digits.startsWith("0")) return digits.slice(1);
  return digits;
}

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
    const cleanQueryDigits = q.replace(/\D/g, "");
    const normQueryPhone = normalizeIndoPhone(q);

    const matched = allOrders.filter((order) => {
      // If table query provided
      if (table && order.table_number === table) {
        return true;
      }

      if (q) {
        if (order.order_number && order.order_number.toLowerCase() === q) return true;
        if (order.id && order.id.toLowerCase() === q) return true;
        if (order.order_number && order.order_number.toLowerCase().includes(q)) return true;
        if (order.id && order.id.toLowerCase().includes(q)) return true;
        if (order.customer_name && order.customer_name.toLowerCase().includes(q)) return true;
        if (order.customer_id && order.customer_id.toLowerCase().includes(q)) return true;

        if (order.customer_phone) {
          const cleanOrderDigits = order.customer_phone.replace(/\D/g, "");
          const normOrderPhone = normalizeIndoPhone(order.customer_phone);

          if (cleanQueryDigits.length >= 4) {
            if (cleanOrderDigits === cleanQueryDigits) return true;
            if (cleanOrderDigits.includes(cleanQueryDigits)) return true;
            if (cleanQueryDigits.includes(cleanOrderDigits)) return true;
          }

          if (normQueryPhone.length >= 4 && normOrderPhone.length >= 4) {
            if (normOrderPhone === normQueryPhone) return true;
            if (normOrderPhone.includes(normQueryPhone)) return true;
            if (normQueryPhone.includes(normOrderPhone)) return true;
          }
        }
      }

      return false;
    });

    return NextResponse.json({
      success: true,
      count: matched.length,
      orders: matched.slice(0, 15), // Limit top 15
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
