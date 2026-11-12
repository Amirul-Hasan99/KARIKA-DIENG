import { NextResponse } from "next/server";
import {
  getAllKarikaProducts,
  updateKarikaProduct,
  createKarikaProduct,
  deleteKarikaProduct,
  KARIKA_CATEGORIES,
} from "@/lib/karika-products";

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
    const { action, id, name, group, pack, price, description, image, stock_qty, is_available } = body;

    // 1. Action: CREATE
    if (action === "create") {
      if (!name || price === undefined) {
        return NextResponse.json(
          { success: false, error: "Nama dan harga produk wajib diisi" },
          { status: 400 }
        );
      }
      const newProduct = createKarikaProduct({
        name,
        group: group || "Carica",
        pack: pack || "1 paket",
        price: Number(price),
        description: description || "",
        image: image || "/images/hero-dieng.jpg",
        stock_qty: stock_qty !== undefined ? Number(stock_qty) : 50,
        is_available: is_available !== undefined ? Boolean(is_available) : true,
      });

      return NextResponse.json({
        success: true,
        product: newProduct,
        message: `Produk ${newProduct.name} berhasil ditambahkan ke katalog`,
      });
    }

    // 2. Action: UPDATE
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 });
    }

    const updated = updateKarikaProduct(id, {
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(group !== undefined ? { group } : {}),
      ...(pack !== undefined ? { pack: String(pack) } : {}),
      ...(description !== undefined ? { description: String(description) } : {}),
      ...(image !== undefined ? { image: String(image) } : {}),
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
      { success: false, error: error?.message || "Failed to save product" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 });
    }

    const deleted = deleteKarikaProduct(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus dari katalog",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}
