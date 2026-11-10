import { Order } from "@/types";
import { markWhatsAppConfirmationSent } from "@/lib/order-store";

const sending = new Set<string>();

/** Sends a payment receipt using a pre-approved WhatsApp Cloud API utility template. */
export async function notifyPaymentOnWhatsApp(order: Order) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || order.whatsapp_confirmation_sent_at || sending.has(order.id)) return false;
  const phone = (order.customer_phone || "").replace(/\D/g, "");
  if (phone.length < 9) return false;
  sending.add(order.id);
  try {
    const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v26.0";
    const response = await fetch(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", recipient_type: "individual", to: phone,
        type: "template", template: {
          name: process.env.WHATSAPP_PAYMENT_TEMPLATE || "order_payment_confirmed",
          language: { code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || "id" },
          components: [{ type: "body", parameters: [
            { type: "text", text: order.customer_name || "Pelanggan" },
            { type: "text", text: order.order_number },
            { type: "text", text: `Rp${order.total_amount.toLocaleString("id-ID")}` },
          ] }],
        },
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      console.warn("WhatsApp payment confirmation failed with status", response.status);
      return false;
    }
    const sentAt = new Date().toISOString();
    await markWhatsAppConfirmationSent(order.id, sentAt);
    return true;
  } catch (error) {
    console.warn("WhatsApp payment confirmation could not be sent.", error);
    return false;
  } finally {
    sending.delete(order.id);
  }
}
