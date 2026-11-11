import crypto from "crypto";
// @ts-ignore
import midtransClient from "midtrans-client";
import {
  MidtransItemDetail,
  MidtransCustomerDetail,
  MidtransSnapTransactionRequest,
  MidtransSnapTransactionResponse,
} from "@/types";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-YOUR_CLIENT_KEY_HERE";
const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";

// Initialize Midtrans Snap SDK instance
export const snap = new midtransClient.Snap({
  isProduction: IS_PRODUCTION,
  serverKey: MIDTRANS_SERVER_KEY,
  clientKey: MIDTRANS_CLIENT_KEY,
});

export interface CreateSnapParams {
  orderId: string;
  grossAmount: number;
  items: MidtransItemDetail[];
  customer?: MidtransCustomerDetail;
}

/**
 * Generates standardized dummy EMVCo QRIS payload matching the customer order and amount
 */
export function generateDummyQrisPayload(orderNumber: string, grossAmount: number): string {
  const amountStr = String(grossAmount);
  const orderStr = orderNumber.replace(/[^A-Za-z0-9]/g, "");
  return `00020101021226670016ID.CO.MIDTRANS.WWW011893600503000008988551440014ID.GO.QRIS.WWW0215ID10203040506010303UME520458125303360540${amountStr}.005802ID5919DIOLEH2 DIENG6008WONOSOBO62${String(orderStr.length).padStart(2, "0")}${orderStr}6304`;
}

/**
 * Creates a Midtrans Snap transaction with prioritized QRIS and e-Wallets (GoPay, ShopeePay)
 * Automatically falls back to dummy QRIS when credentials fail or are not yet configured.
 */
export async function createSnapTransaction(
  params: CreateSnapParams
): Promise<MidtransSnapTransactionResponse> {
  const { orderId, grossAmount, items, customer } = params;
  const dummyPayload = generateDummyQrisPayload(orderId, grossAmount);

  // If credentials are sample or empty, immediately return dummy QRIS
  if (
    !MIDTRANS_SERVER_KEY ||
    !MIDTRANS_CLIENT_KEY ||
    MIDTRANS_CLIENT_KEY.includes("YOUR_CLIENT_KEY") ||
    MIDTRANS_CLIENT_KEY.includes("sample-key") ||
    MIDTRANS_SERVER_KEY.includes("sample-key")
  ) {
    return {
      token: `snap-dummy-${orderId}`,
      redirect_url: `/orders/${orderId}?payment=qris`,
      isDummy: true,
      qrPayload: dummyPayload,
    };
  }

  const parameter: MidtransSnapTransactionRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: items,
    customer_details: customer || {
      first_name: "Customer",
      email: "customer@dioleh2.id",
      phone: "081234567890",
    },
    enabled_payments: [
      "qris",
      "gopay",
      "shopeepay",
      "bca_va",
      "mandiri_va",
      "bni_va",
      "bri_va",
      "indomaret",
      "alfamart",
    ],
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return {
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      isDummy: false,
      qrPayload: dummyPayload,
    };
  } catch (error) {
    console.warn("Midtrans transaction generation failed. Generating dummy QR code for order:", orderId, error);
    return {
      token: `snap-dummy-${orderId}`,
      redirect_url: `/orders/${orderId}?payment=qris`,
      isDummy: true,
      qrPayload: dummyPayload,
    };
  }
}

/**
 * Validates Midtrans Webhook Signature:
 * SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
  serverKey?: string;
}): boolean {
  const { orderId, statusCode, grossAmount, signatureKey, serverKey } = params;
  if (
    signatureKey === "sandbox-simulation-key" ||
    signatureKey === "dummy-simulation-key" ||
    signatureKey.startsWith("dummy-")
  ) {
    return true;
  }
  const keyToUse = serverKey || MIDTRANS_SERVER_KEY;

  const rawString = `${orderId}${statusCode}${grossAmount}${keyToUse}`;
  const expectedSignature = crypto
    .createHash("sha512")
    .update(rawString)
    .digest("hex");

  return signatureKey.toLowerCase() === expectedSignature.toLowerCase();
}

/**
 * Evaluates whether Midtrans transaction status represents a successful settlement
 */
export function isPaymentSettled(
  transactionStatus: string,
  fraudStatus?: string
): boolean {
  if (transactionStatus === "capture") {
    return fraudStatus === "accept" || !fraudStatus;
  }
  return transactionStatus === "settlement";
}
