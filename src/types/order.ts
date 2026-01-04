export type OrderStatus = 'pending' | 'completed' | 'shipped' | 'cancelled';

export interface Order {
  id: number;
  user_id: number;
  total_price: number;
  status: OrderStatus;
  created_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  option_id: number;
  quantity: number;
  price_at_purchase: number; // 주문 당시 가격 (가격 변동 대비)
}