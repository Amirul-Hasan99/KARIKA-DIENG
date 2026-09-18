import crypto from "crypto";
// @ts-ignore
import midtransClient from "midtrans-client";
import {
  MidtransItemDetail,
  MidtransCustomerDetail,
  MidtransSnapTransactionRequest,
  MidtransSnapTransactionResponse,
} from "@/types";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SERVER_KEY_HERE";
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
 * Creates a Midtrans Snap transaction with prioritized QRIS and e-Wallets (GoPay, ShopeePay)
 */
export async function createSnapTransaction(
  params: CreateSnapParams
): Promise<MidtransSnapTransactionResponse> {
  const { orderId, grossAmount, items, customer } = params;

  const parameter: MidtransSnapTransactionRequest = {
    transaction_details: {
      order_id: orderId,
      gross_amount: grossAmount,
    },
    item_details: items,
    customer_details: customer || {
      first_name: "Customer",
      email: "customer@miegacoan.id",
      phone: "081234567890",
    },
    // Priority payment methods: QRIS, GoPay, ShopeePay, followed by BCA/Mandiri/BNI virtual accounts
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
    };
  } catch (error: any) {
    console.warn("Midtrans Snap SDK call failed, generating simulated sandbox token:", error?.message || error);
    const mockToken = `snap-token-${orderId}-${Date.now()}`;
    const mockRedirect = `https://app.sandbox.midtrans.com/snap/v2/vtweb/${mockToken}`;
    return {
      token: mockToken,
      redirect_url: mockRedirect,
      isSimulated: true,
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
