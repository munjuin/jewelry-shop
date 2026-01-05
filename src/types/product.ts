export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  created_at: Date;
}

export interface ProductOption {
  id: number;
  product_id: number;
  size: string;
  color: string;
  stock: number;
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_thumbnail: boolean;
}