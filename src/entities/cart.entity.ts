// src/entities/Cart.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  // 관계 설정: 하나의 장바구니는 한 명의 유저만 가질 수 있음 (1:1)
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  // 관계 설정: 장바구니 안에는 여러 개의 상품(CartItem)이 담길 수 있음 (1:N)
  @OneToMany(() => CartItem, (CartItem) => CartItem.Cart)
  items!: CartItem[];
}
