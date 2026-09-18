import { Order } from "@/types";
import { formatRupiah, formatOrderTime } from "./utils";

export interface PrintOptions {
  paperWidth?: "58mm" | "80mm";
  storeName?: string;
  storeAddress?: string;
  footerNote?: string;
}

/**
 * Formats order details into a clean ESC/POS text representation
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
  lines.push(center(options?.storeName || "KOPI & SNACK COFFEE BAR"));
  lines.push(center(options?.storeAddress || "Order & Self-Service System"));
  lines.push(doubleDivider);

  // Metadata
  lines.push(justify(`No: ${order.order_number}`, `Meja: ${order.table_number}`));
  if (order.customer_id) {
    lines.push(justify(`ID Pembeli:`, order.customer_id));
  }
  lines.push(justify(`Waktu:`, formatOrderTime(order.created_at)));
  if (order.customer_name) {
    lines.push(justify(`Pelanggan:`, order.customer_name));
  }
  lines.push(divider);

  // Items
  for (const item of order.items) {
    const itemTotal = formatRupiah(item.subtotal);
    lines.push(justify(`${item.qty}x ${item.name}`, itemTotal));
    
    // Modifiers / Spice Level
    if (item.selected_modifiers && item.selected_modifiers.length > 0) {
      for (const mod of item.selected_modifiers) {
        const modPrice = mod.price_modifier > 0 ? ` (+${formatRupiah(mod.price_modifier)})` : "";
        lines.push(`   * ${mod.option_name}${modPrice}`);
      }
    }

    if (item.notes) {
      lines.push(`   Note: ${item.notes}`);
    }
  }

  lines.push(divider);

  // Total & Payment
  lines.push(justify("TOTAL:", formatRupiah(order.total_amount)));
  lines.push(justify("Status Bayar:", order.payment_status.toUpperCase()));
  if (order.payment_type) {
    lines.push(justify("Metode Bayar:", order.payment_type.toUpperCase()));
  }
  lines.push(doubleDivider);

  // Footer
  lines.push(center(options?.footerNote || "TERIMA KASIH ATAS KUNJUNGANNYA"));
  lines.push(center("Simpan struk ini sebagai bukti pemesanan"));
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

  // ESC/POS Initialization Commands:
  // [ESC, '@'] -> Initialize printer
  // [ESC, 'a', 1] -> Center align
  // [GS, 'V', 66, 0] -> Cut paper (partial cut)
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
        <title>Receipt ${order.order_number}</title>
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
        <div class="center bold" style="font-size: 14px;">${options?.storeName || "KATALOG MENU"}</div>
        <div class="center">${options?.storeAddress || "Self-Order Dining System"}</div>
        <div class="double-divider"></div>
        
        <div class="row"><span>No: ${order.order_number}</span><span class="bold">Meja: ${order.table_number}</span></div>
        <div class="row"><span>Waktu:</span><span>${formatOrderTime(order.created_at)}</span></div>
        ${order.customer_name ? `<div class="row"><span>Customer:</span><span>${order.customer_name}</span></div>` : ""}
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
          ${item.notes ? `<div class="mod-item">Note: ${item.notes}</div>` : ""}
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
          <span class="bold">${order.payment_status.toUpperCase()}</span>
        </div>
        ${
          order.payment_type
            ? `<div class="row"><span>Metode:</span><span>${order.payment_type.toUpperCase()}</span></div>`
            : ""
        }
        <div class="double-divider"></div>
        <div class="center" style="font-size: 10px; margin-top: 6px;">
          ${options?.footerNote || "TERIMA KASIH ATAS KUNJUNGAN ANDA"}<br/>
          Harap simpan bukti pembayaran ini.
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
