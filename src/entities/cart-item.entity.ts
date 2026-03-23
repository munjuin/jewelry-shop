// src/entities/CartItem.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from './cart.entity';
import { Product } from './product.entity';
import { ProductOption } from './product-option.entity';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ default: 1 })
  quantity!: number;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Cart, (Cart) => Cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cart_id' })
  Cart!: Cart;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  Product!: Product;

  @ManyToOne(() => ProductOption, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_option_id' })
  ProductOption!: ProductOption;
}
