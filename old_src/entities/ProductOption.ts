// src/entities/ProductOption.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn 
} from 'typeorm';
import { Product } from './Product';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  option_name: string; // 예: "Rose Gold", "12호"

  @Column({ default: 0 })
  extra_price: number;

  @Column({ default: 0 })
  stock_quantity: number;

  // 관계 설정: 옵션은 반드시 하나의 상품에 속함
  @ManyToOne(() => Product, (product) => product.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}