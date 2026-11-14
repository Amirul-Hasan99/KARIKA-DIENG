/**
 * End-to-End Test Script: Order Flow (Buyer → Admin)
 * Scenario:
 * 1. Pembeli buat order COD (Tunai)
 * 2. Pembeli buat order QRIS
 * 3. Login Admin
 * 4. Admin konfirmasi pembayaran COD
 * 5. Admin update delivery status
 * 6. Verifikasi sinkronisasi data
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  error?: string;
  details?: any;
}

const results: TestResult[] = [];
let adminCookies = "";

// Helper untuk HTTP requests
async function makeRequest(
  method: string,
  endpoint: string,
  body?: any,
  useAuth = false
): Promise<{ status: number; data: any }> {
  const url = `${BASE_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(useAuth && adminCookies ? { Cookie: adminCookies } : {}),
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  const data = await response.json();

  return { status: response.status, data };
}

// Helper untuk login
async function login() {
  console.log("🔑 Logging in as admin...");
  const response = await fetch(`${BASE_URL}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "karikadieng",
      password: "karikadieng000",
    }),
  });
  
  if (response.status !== 200) {
    throw new Error("Login failed");
  }
  
  const setCookie = response.headers.get("set-cookie");
  adminCookies = setCookie || "";
  console.log("✅ Admin logged in.");
}

// Test 1: Create Order COD (Tunai) - 5 items total
async function testCreateOrderCOD() {
  console.log("\n📝 Test 1: Create Order COD (Tunai)");

  try {
    const payload = {
      customerName: "Andi Wijaya",
      customerPhone: "081234567890",
      address: "Jl. Dieng No. 45, Kawasan Dieng",
      coordinates: { lat: -7.204176, lng: 109.911214 },
      items: [
        { productId: "carica-biasa", qty: 2 },
        { productId: "mie-ongklok", qty: 3 },
      ],
      paymentType: "cod",
    };

    const { status, data } = await makeRequest("POST", "/api/orders/checkout", payload);

    if (status !== 200) throw new Error(`Status ${status}: ${data.error}`);

    results.push({ name: "Create Order COD", status: "PASS", details: { orderId: data.orderId } });
    return data.orderId;
  } catch (error) {
    results.push({ name: "Create Order COD", status: "FAIL", error: String(error) });
    return null;
  }
}

// Test 2: Create Order QRIS - 5 items total
async function testCreateOrderQRIS() {
  console.log("📝 Test 2: Create Order QRIS");

  try {
    const payload = {
      customerName: "Budi Santoso",
      customerPhone: "082345678901",
      address: "Jl. Panenjoan No. 12, Kawasan Dieng",
      coordinates: { lat: -7.2051, lng: 109.9115 },
      items: [
        { productId: "keripik-jamur", qty: 4 },
        { productId: "purwaceng", qty: 1 },
      ],
      paymentType: "qris",
    };

    const { status, data } = await makeRequest("POST", "/api/orders/checkout", payload);

    if (status !== 200) throw new Error(`Status ${status}: ${data.error}`);

    results.push({ name: "Create Order QRIS", status: "PASS", details: { orderId: data.orderId } });
    return data.orderId;
  } catch (error) {
    results.push({ name: "Create Order QRIS", status: "FAIL", error: String(error) });
    return null;
  }
}

// Test 3: Fetch Orders from Admin Panel (Authenticated)
async function testFetchAdminOrders() {
  console.log("📝 Test 3: Fetch Orders (Auth)");
  try {
    const { status, data } = await makeRequest("GET", "/api/admin/orders", null, true);
    if (status !== 200) throw new Error(`Status ${status}`);
    results.push({ name: "Fetch Admin Orders", status: "PASS" });
  } catch (error) {
    results.push({ name: "Fetch Admin Orders", status: "FAIL", error: String(error) });
  }
}

// Test 4: Confirm Cash Payment (COD) (Authenticated)
async function testConfirmCashPayment(orderId: string) {
  console.log("📝 Test 4: Confirm Cash (Auth)");
  try {
    const { status, data } = await makeRequest("POST", "/api/orders/confirm-cash", { orderId }, true);
    if (status !== 200 || data.order.payment_status !== "settlement") throw new Error("Payment confirmation failed");
    results.push({ name: "Confirm Cash Payment", status: "PASS" });
  } catch (error) {
    results.push({ name: "Confirm Cash Payment", status: "FAIL", error: String(error) });
  }
}

// Test 5: Update Delivery Status (Authenticated)
async function testUpdateDeliveryStatus(orderId: string) {
  console.log("📝 Test 5: Update Delivery Status (Auth)");
  try {
    for (const newStatus of ["assigned", "picked_up", "delivered"]) {
      const { status, data } = await makeRequest("PATCH", `/api/orders/${encodeURIComponent(orderId)}`, { delivery_status: newStatus }, true);
      if (status !== 200 || data.order.delivery_status !== newStatus) throw new Error(`Update ${newStatus} failed`);
    }
    results.push({ name: "Update Delivery Status", status: "PASS" });
  } catch (error) {
    results.push({ name: "Update Delivery Status", status: "FAIL", error: String(error) });
  }
}

// Run main
async function run() {
  await login();
  const codId = await testCreateOrderCOD();
  await testCreateOrderQRIS();
  await testFetchAdminOrders();
  if (codId) {
    await testConfirmCashPayment(codId);
    await testUpdateDeliveryStatus(codId);
  }

  // Print results
  console.log("\n📊 RESULTS:");
  results.forEach(r => console.log(`${r.status === "PASS" ? "✅" : "❌"} ${r.name} ${r.error ? `- ${r.error}` : ""}`));
  fs.writeFileSync("e2e-test-report.json", JSON.stringify(results, null, 2));
}

run();
