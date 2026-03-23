export interface CartItemView {
    item_id: number;
    quantity: number;
    product_id: number;
    product_name: string;
    base_price: number;
    option_name: string;
    extra_price: number;
    image_url: string | null;
    total_price?: number; // 가공 후 추가되는 필드
}

export interface CartTotals {
    totalProductPrice: number;
    deliveryFee: number;
    finalPrice: number;
    itemCount: number;
}