"use server";

import { NextResponse } from "next/server";
import { getOrderById, updateOrderPaymentProof } from "@/lib/order-store";
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

    let finalProofUrl = paymentProof;

    // Coba simpan file ke filesystem jika memungkinkan
    try {
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

      const safeId = String(order.order_number || orderId).replace(/[^a-zA-Z0-9_-]/g, "_");
      const fileName = `${safeId}-${Date.now()}.${ext}`;
      const filePath = path.join(uploadsDir, fileName);

      fs.writeFileSync(filePath, buffer);
      
      // Jika ukuran base64 di bawah 1MB, simpan Data URL langsung agar tahan banting di Vercel Serverless
      // Jika di atas 1MB, gunakan path file /uploads/payment-proof/
      if (paymentProof.length < 1200000) {
        finalProofUrl = paymentProof;
      } else {
        finalProofUrl = `/uploads/payment-proof/${fileName}`;
      }
    } catch (fsErr) {
      console.warn("[upload-payment-proof] Disk write warning (falling back to Data URL):", fsErr);
      finalProofUrl = paymentProof;
    }

    const updated = await updateOrderPaymentProof(order.id, finalProofUrl);

    return NextResponse.json({
      success: true,
      message: "Bukti pembayaran berhasil disimpan ke sistem pesanan",
      proofUrl: finalProofUrl,
      order: updated || {
        ...order,
        payment_proof_url: finalProofUrl,
        payment_proof_uploaded_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("[upload-payment-proof] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan bukti pembayaran" },
      { status: 500 }
    );
  }
}
