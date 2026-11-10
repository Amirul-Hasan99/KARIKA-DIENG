export type TableStatus = 'available' | 'occupied' | 'reserved';

export interface Table {
  id: string;
  table_number: string;
  status: TableStatus;
  qr_url?: string;
  created_at?: string | number | Date;
}

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  icon?: string;
}

export interface ModifierOption {
  id: string;
  name: string;
  price_modifier: number; // in IDR, e.g. 0, 1000, 2000
  is_default?: boolean;
}

export interface ModifierGroup {
  id: string;
  title: string; // e.g. "Level Pedas (Level 0 - 8)", "Extra Topping"
  min_select: number; // 0 for optional, 1 for mandatory
  max_select: number; // 1 for single choice (radio), >1 for multiple (checkbox)
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string;
  price: number; // Base price in IDR
  image_url: string;
  is_available: boolean;
  modifier_groups: ModifierGroup[];
  tags?: string[]; // e.g. ["Best Seller", "Pedas", "Favorit"]
}

export interface SelectedModifier {
  group_id: string;
  group_title: string;
  option_id: string;
  option_name: string;
  price_modifier: number;
}

export interface CartItem {
  id: string; // Unique compound id: `${menu_id}-${sorted_modifiers}`
  menu_id: string;
  name: string;
  base_price: number;
  item_price: number; // base_price + sum of price_modifiers
  qty: number;
  image_url: string;
  selected_modifiers: SelectedModifier[];
  subtotal: number;
  notes?: string;
}

export interface OrderItem {
  menu_id: string;
  name: string;
  price: number; // Final unit price with modifiers
  qty: number;
  selected_modifiers: SelectedModifier[];
  subtotal: number;
  notes?: string;
}

export type PaymentStatus = 'pending' | 'settlement' | 'expire' | 'failed';
export type OrderStatus = 'received' | 'cooking' | 'ready' | 'completed';

export interface Order {
  id: string;
  order_number: string; // e.g. GC-260916-A101
  customer_id?: string; // e.g. CUST-01-A89K (ID Pembeli)
  table_id: string;
  table_number: string;
  customer_name?: string;
  customer_phone?: string;
  items: OrderItem[];
  total_amount: number;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  payment_type?: string; // e.g. 'qris', 'gopay', 'shopeepay'
  midtrans_transaction_id?: string;
  snap_token?: string;
  snap_redirect_url?: string;
  created_at: any;
  updated_at: any;
  delivery_address?: string;
  coordinates?: { lat: number; lng: number };
  delivery_distance_km?: number;
  delivery_status?: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'failed_attempt';
  courier_id?: string;
  whatsapp_confirmation_sent_at?: string;
}

export interface DiolehProduct {
  id: string;
  slug: string;
  category_id: string;
  name: string;
  description: string;
  image_url?: string;
  is_available: boolean;
  variants: Array<{ id: string; name: string; price: number; stock: number }>;
}

// Midtrans Snap API Payloads
export interface MidtransItemDetail {
  id: string;
  price: number;
  quantity: number;
  name: string;
  category?: string;
}

export interface MidtransCustomerDetail {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
}

export interface MidtransSnapTransactionRequest {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details: MidtransItemDetail[];
  customer_details?: MidtransCustomerDetail;
  enabled_payments?: string[];
}

export interface MidtransSnapTransactionResponse {
  token: string;
  redirect_url: string;
  isSimulated?: boolean;
}

export interface MidtransWebhookNotification {
  transaction_time: string;
  transaction_status: 'capture' | 'settlement' | 'pending' | 'deny' | 'cancel' | 'expire' | 'failure' | 'refund';
  transaction_id: string;
  status_message: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
  order_id: string;
  merchant_id: string;
  gross_amount: string;
  fraud_status?: 'accept' | 'challenge' | 'deny';
  currency: string;
}
