// src/entities/cart-item.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @CreateDateColumn()
  created_at!: Date;

  // 1. 어떤 장바구니에 담겼는가? (장바구니 삭제 시 아이템도 날아감)
  @ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  cart!: Cart;

  // 2. 어떤 상품인가?
  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  // 3. 어떤 옵션을 선택했는가? (옵션이 지워지면 장바구니에서도 빠짐)
  @ManyToOne(() => ProductOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_option_id' })
  productOption!: ProductOption;
}
