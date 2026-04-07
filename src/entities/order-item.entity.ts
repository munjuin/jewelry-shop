// src/entities/order-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity'; // 💡 [추가됨]

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255, nullable: true })
  option_snapshot!: string; // 결제 시점의 옵션명 보존 (예: "12호, Rose Gold")

  @Column()
  quantity!: number;

  @Column()
  price_snapshot!: number; // 결제 시점의 단가 보존

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  // 상품이 삭제되더라도 주문 상세 내역은 남아있어야 함 (SET NULL)
  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // 💡 [이슈 2 해결] 원본 옵션 ID를 저장할 FK 추가 (옵션 삭제 시 SET NULL 처리)
  @ManyToOne(() => ProductOption, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_option_id' })
  productOption!: ProductOption;
}
