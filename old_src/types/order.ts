// 주문 상태 유니온 타입
export type OrderStatus = 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderShape {
    id: number;
    user_id: number;
    total_amount: number;
    delivery_fee: number;
    final_amount: number;
    status: OrderStatus;
    receiver_name: string;
    receiver_phone: string;
    zipcode: string;
    address: string;
    detail_address: string;
    created_at: Date;
}

export interface OrderItemShape {
    id: number;
    order_id: number;
    product_id: number;
    option_snapshot: string;
    quantity: number;
    price_snapshot: number;
}