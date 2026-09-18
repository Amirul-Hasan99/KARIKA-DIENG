import { NextRequest, NextResponse } from "next/server";
import { verifyMidtransSignature, isPaymentSettled } from "@/lib/midtrans";
import { PaymentStatus } from "@/types";
import { updateOrderPayment } from "@/lib/order-store";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_id,
    } = payload;

    if (!order_id || !status_code || !gross_amount) {
      return NextResponse.json(
        { error: "Invalid webhook payload. Missing critical attributes." },
        { status: 400 }
      );
    }

    // In production, verify SHA-512 signature key if provided
    if (signature_key && process.env.NODE_ENV === "production") {
      const isSignatureValid = verifyMidtransSignature({
        orderId: order_id,
        statusCode: status_code,
        grossAmount: gross_amount,
        signatureKey: signature_key,
      });

      if (!isSignatureValid) {
        console.error("Invalid Midtrans signature key for order:", order_id);
        return NextResponse.json(
          { error: "Signature verification failed." },
          { status: 403 }
        );
      }
    }

    // Determine target payment status
    let paymentStatus: PaymentStatus = "pending";

    if (isPaymentSettled(transaction_status, fraud_status) || transaction_status === "settlement") {
      paymentStatus = "settlement";
    } else if (
      transaction_status === "cancel" ||
      transaction_status === "deny" ||
      transaction_status === "failure"
    ) {
      paymentStatus = "failed";
    } else if (transaction_status === "expire") {
      paymentStatus = "expire";
    } else if (transaction_status === "pending") {
      paymentStatus = "pending";
    }

    const updatedOrder = await updateOrderPayment(
      order_id,
      paymentStatus,
      payment_type || "qris",
      transaction_id
    );

    return NextResponse.json({
      status: "success",
      message: `Order ${order_id} processed with payment status: ${paymentStatus}`,
      order: updatedOrder,
    });
  } catch (error: any) {
    console.error("Midtrans webhook handler error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal error processing webhook" },
      { status: 500 }
    );
  }
}
