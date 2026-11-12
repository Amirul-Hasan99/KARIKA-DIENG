"use server";

import { NextResponse } from "next/server";
import { getOrderById, updateOrderPayment } from "@/lib/order-store";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderId, paymentProof } = body;

    if (!orderId || !paymentProof) {
      return NextResponse.json(
        { error: "orderId dan paymentProof diperlukan" },
        { status: 400 }
      );
    }

    if (!paymentProof.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "paymentProof harus berupa gambar (Data URL)" },
        { status: 400 }
      );
    }

    const order = await getOrderById(orderId);
    if (!order) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "payment-proof");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const base64Data = paymentProof.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const ext = paymentProof.includes("png")
      ? "png"
      : paymentProof.includes("webp")
      ? "webp"
      : "jpg";

    const fileName = `${orderId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    const proofUrl = `/uploads/payment-proof/${fileName}`;
    const now = new Date().toISOString();

    const updatedOrder = {
      ...order,
      payment_proof_url: proofUrl,
      payment_proof_uploaded_at: now,
      updated_at: now,
    };

    await updateOrderPayment(orderId, order.payment_status, order.payment_type || "qris");

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil disimpan",
      proofUrl,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("[upload-payment-proof] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan bukti" },
      { status: 500 }
    );
  }
}
