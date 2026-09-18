import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { initialCategories, initialTables, initialMenus } from "@/lib/mock-data";
import { getMenuStockMap } from "@/lib/order-store";

export async function POST() {
  try {
    let seededToFirestore = false;
    try {
      if (adminDb && typeof adminDb.collection === "function") {
        const batch = adminDb.batch();

        for (const cat of initialCategories) {
          batch.set(adminDb.collection("categories").doc(cat.id), cat);
        }

        for (const table of initialTables) {
          batch.set(adminDb.collection("tables").doc(table.id), table);
        }

        for (const menu of initialMenus) {
          batch.set(adminDb.collection("menus").doc(menu.id), menu);
        }

        await batch.commit();
        seededToFirestore = true;
      }
    } catch (dbErr) {
      console.warn("Firestore seed fallback to in-memory/static:", dbErr);
    }

    return NextResponse.json({
      success: true,
      seededToFirestore,
      categoriesCount: initialCategories.length,
      tablesCount: initialTables.length,
      menusCount: initialMenus.length,
      message: "KATALOG MENU database successfully seeded!",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to seed data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const stockMap = getMenuStockMap();
  const menusWithStock = initialMenus.map((menu) => ({
    ...menu,
    is_available: stockMap[menu.id] !== undefined ? stockMap[menu.id] : menu.is_available,
  }));

  return NextResponse.json({
    categories: initialCategories,
    tables: initialTables,
    menus: menusWithStock,
  });
}
