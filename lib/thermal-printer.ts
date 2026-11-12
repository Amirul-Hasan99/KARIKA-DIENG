import { Order } from "@/types";
import { formatRupiah, formatOrderTime } from "./utils";

export interface PrintOptions {
  paperWidth?: "58mm" | "80mm";
  storeName?: string;
  storeAddress?: string;
  footerNote?: string;
}

/**
 * Formats order details into a clean ESC/POS text representation for thermal printers
 */
export function formatReceiptText(order: Order, options?: PrintOptions): string {
  const width = options?.paperWidth === "80mm" ? 48 : 32;
  const divider = "-".repeat(width);
  const doubleDivider = "=".repeat(width);

  const center = (text: string) => {
    if (text.length >= width) return text.substring(0, width);
    const pad = Math.floor((width - text.length) / 2);
    return " ".repeat(pad) + text;
  };

  const justify = (left: string, right: string) => {
    const space = width - left.length - right.length;
    if (space <= 0) return `${left} ${right}`;
    return left + " ".repeat(space) + right;
  };

  const lines: string[] = [];

  // Header
  lines.push(center(options?.storeName || "DIOLEH - OLEH DIENG"));
  lines.push(center(options?.storeAddress || "Sentra Oleh-Oleh Wonosobo & Dieng"));
  lines.push(center("Titik 0 Km Dieng · WA: 083122046357"));
  lines.push(doubleDivider);

  // Metadata
  lines.push(justify(`No. Order:`, order.order_number));
  lines.push(justify(`Pengantaran:`, order.delivery_distance_km ? `${order.delivery_distance_km} km` : "Radius 8 km"));
  if (order.customer_name) {
    lines.push(justify(`Penerima:`, order.customer_name));
  }
  if (order.customer_phone) {
    lines.push(justify(`WhatsApp:`, order.customer_phone));
  }
  lines.push(justify(`Waktu:`, formatOrderTime(order.created_at)));
  if (order.delivery_address) {
    lines.push(`Patokan: ${order.delivery_address}`);
  }
  if (order.coordinates) {
    lines.push(`Titik Maps: ${order.coordinates.lat.toFixed(5)}, ${order.coordinates.lng.toFixed(5)}`);
  }
  lines.push(divider);

  // Items
  for (const item of order.items) {
    const itemTotal = formatRupiah(item.subtotal);
    lines.push(justify(`${item.qty}x ${item.name}`, itemTotal));

    if (item.selected_modifiers && item.selected_modifiers.length > 0) {
      for (const mod of item.selected_modifiers) {
        const modPrice = mod.price_modifier > 0 ? ` (+${formatRupiah(mod.price_modifier)})` : "";
        lines.push(`   * ${mod.option_name}${modPrice}`);
      }
    }

    if (item.notes) {
      lines.push(`   Catatan: ${item.notes}`);
    }
  }

  lines.push(divider);

  // Total & Payment
  lines.push(justify("TOTAL TAGIHAN:", formatRupiah(order.total_amount)));
  lines.push(justify("Status Bayar:", order.payment_status.toUpperCase()));
  if (order.payment_type) {
    lines.push(justify("Metode:", order.payment_type.toUpperCase()));
  }
  lines.push(doubleDivider);

  // Footer
  lines.push(center(options?.footerNote || "MATUR NUWUN / TERIMA KASIH"));
  lines.push(center("Oleh-Oleh Khas Dataran Tinggi Dieng"));
  lines.push("\n\n");

  return lines.join("\n");
}

/**
 * Generates raw ESC/POS binary command buffer for network/bluetooth thermal printers
 */
export function generateEscPosBuffer(order: Order, options?: PrintOptions): Uint8Array {
  const encoder = new TextEncoder();
  const text = formatReceiptText(order, options);

  const ESC = 0x1b;
  const GS = 0x1d;

  const initCmd = new Uint8Array([ESC, 0x40]);
  const cutCmd = new Uint8Array([ESC, 0x64, 0x03, GS, 0x56, 0x42, 0x00]);

  const bodyBytes = encoder.encode(text);
  const totalLength = initCmd.length + bodyBytes.length + cutCmd.length;

  const buffer = new Uint8Array(totalLength);
  buffer.set(initCmd, 0);
  buffer.set(bodyBytes, initCmd.length);
  buffer.set(cutCmd, initCmd.length + bodyBytes.length);

  return buffer;
}

/**
 * Triggers standard browser print popup configured with thermal receipt styling
 */
export function printReceiptViaBrowser(order: Order, options?: PrintOptions) {
  if (typeof window === "undefined") return;

  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return;

  const paperWidth = options?.paperWidth === "80mm" ? "76mm" : "54mm";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Struk Pesanan ${order.order_number}</title>
        <style>
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.35;
            margin: 0;
            padding: 8px;
            width: ${paperWidth};
            color: #000;
            background: #fff;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 6px 0; }
          .double-divider { border-top: 2px solid #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
          .mod-item { font-size: 10px; padding-left: 10px; color: #333; }
          .total-row { font-size: 13px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 13px;">${options?.storeName || "KARIKA DIENG"}</div>
        <div class="center" style="font-size: 10px;">${options?.storeAddress || "Sentra Oleh-Oleh Khas Dieng Wonosobo"}</div>
        <div class="center" style="font-size: 9px;">Titik 0 Km Dieng · Layanan Antar 8 km</div>
        <div class="double-divider"></div>
        
        <div class="row"><span class="bold">Order: #${order.order_number}</span><span>${order.delivery_distance_km ? `${order.delivery_distance_km} km` : "Dieng"}</span></div>
        <div class="row"><span>Waktu:</span><span>${formatOrderTime(order.created_at)}</span></div>
        ${order.customer_name ? `<div class="row"><span>Penerima:</span><span class="bold">${order.customer_name}</span></div>` : ""}
        ${order.customer_phone ? `<div class="row"><span>WhatsApp:</span><span>${order.customer_phone}</span></div>` : ""}
        ${order.delivery_address ? `<div style="font-size: 10px; margin-top: 2px;"><strong>Patokan Alamat:</strong> ${order.delivery_address}</div>` : ""}
        ${order.coordinates ? `<div style="font-size: 9px; color: #444;">Titik Maps: ${order.coordinates.lat.toFixed(5)}, ${order.coordinates.lng.toFixed(5)}</div>` : ""}
        <div class="divider"></div>

        ${order.items
          .map(
            (item) => `
          <div class="row bold">
            <span>${item.qty}x ${item.name}</span>
            <span>${formatRupiah(item.subtotal)}</span>
          </div>
          ${
            item.selected_modifiers && item.selected_modifiers.length > 0
              ? item.selected_modifiers
                  .map(
                    (m) =>
                      `<div class="mod-item">• ${m.option_name} ${
                        m.price_modifier > 0 ? `(+${formatRupiah(m.price_modifier)})` : ""
                      }</div>`
                  )
                  .join("")
              : ""
          }
          ${item.notes ? `<div class="mod-item">Catatan: ${item.notes}</div>` : ""}
        `
          )
          .join("")}

        <div class="divider"></div>
        <div class="row total-row">
          <span>TOTAL:</span>
          <span>${formatRupiah(order.total_amount)}</span>
        </div>
        <div class="row">
          <span>Status Bayar:</span>
          <span class="bold">${order.payment_status === "settlement" ? "LUNAS" : "BELUM LUNAS"}</span>
        </div>
        ${
          order.payment_type
            ? `<div class="row"><span>Metode:</span><span>${order.payment_type.toUpperCase()}</span></div>`
            : ""
        }
        <div class="double-divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 6px;">
          ${options?.footerNote || "MATUR NUWUN / TERIMA KASIH"}<br/>
          Pusat Pengantaran Oleh-Oleh Dieng
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  }, 350);
}
