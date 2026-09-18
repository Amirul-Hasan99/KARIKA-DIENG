import { NextRequest, NextResponse } from "next/server";
import { createSnapTransaction } from "@/lib/midtrans";
import { generateOrderNumber, generateCustomerId } from "@/lib/utils";
import { Order, OrderItem } from "@/types";
import { saveOrder } from "@/lib/order-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tableId, tableNumber, customerName, customerPhone, items } = body;

    if (!tableId || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid request payload. Table and items are required." },
        { status: 400 }
      );
    }

    // Validate and compute total amount
    let totalAmount = 0;
    const orderItems: OrderItem[] = items.map((item: any) => {
      const modifierSum = (item.selected_modifiers || []).reduce(
        (acc: number, mod: any) => acc + (Number(mod.price_modifier) || 0),
        0
      );
      const unitPrice = Number(item.base_price || item.price) + modifierSum;
      const subtotal = unitPrice * Number(item.qty);
      totalAmount += subtotal;

      return {
        menu_id: item.menu_id || item.id,
        name: item.name,
        price: unitPrice,
        qty: item.qty,
        selected_modifiers: item.selected_modifiers || [],
        subtotal,
        notes: item.notes || "",
      };
    });

    const orderNumber = generateOrderNumber(tableNumber);
    const customerId = generateCustomerId(tableNumber);
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const paymentType = body.paymentType === "cash" ? "cash" : "qris";

    let snapToken = "";
    let redirectUrl = "";
    let isSimulated = false;

    if (paymentType === "qris") {
      // Prepare Midtrans line items
      const midtransItems = orderItems.map((item, index) => ({
        id: `${item.menu_id}-${index}`.substring(0, 50),
        price: item.price,
        quantity: item.qty,
        name: item.name.substring(0, 50),
      }));

      // Create Snap transaction
      const snapResult = await createSnapTransaction({
        orderId: orderNumber,
        grossAmount: totalAmount,
        items: midtransItems,
        customer: {
          first_name: customerName || `Meja ${tableNumber}`,
          phone: customerPhone || "081234567890",
          email: "guest@katalogmenu.id",
        },
      });

      snapToken = snapResult.token;
      redirectUrl = snapResult.redirect_url;
      isSimulated = snapResult.isSimulated ?? false;
    }

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      customer_id: customerId,
      table_id: tableId,
      table_number: tableNumber,
      customer_name: customerName || `Pelanggan Meja ${tableNumber}`,
      customer_phone: customerPhone || "",
      items: orderItems,
      total_amount: totalAmount,
      payment_status: "pending",
      order_status: "received",
      payment_type: paymentType,
      snap_token: snapToken,
      snap_redirect_url: redirectUrl,
      created_at: now,
      updated_at: now,
    };

    // Save order centrally
    await saveOrder(newOrder);

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      customerId,
      paymentType,
      snapToken,
      redirectUrl,
      isSimulated,
      totalAmount,
    });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error during checkout." },
      { status: 500 }
    );
  }
}
