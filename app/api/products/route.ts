import { NextResponse } from "next/server";
import { getAllKarikaProducts, updateKarikaProduct, KARIKA_CATEGORIES } from "@/lib/karika-products";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = getAllKarikaProducts();
    return NextResponse.json(
      {
        success: true,
        products,
        categories: KARIKA_CATEGORIES,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to get products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, is_available, price, stock_qty } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 });
    }

    const updated = updateKarikaProduct(id, {
      ...(is_available !== undefined ? { is_available: Boolean(is_available) } : {}),
      ...(price !== undefined ? { price: Number(price) } : {}),
      ...(stock_qty !== undefined ? { stock_qty: Number(stock_qty) } : {}),
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Produk ${updated.name} berhasil diperbarui`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

