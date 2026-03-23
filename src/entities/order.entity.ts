// src/entities/Order.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  total_amount!: number;

  @Column({ default: 0 })
  delivery_fee!: number;

  @Column()
  final_amount!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status!: string; // 'PENDING', 'PAID', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED'

  @Column({ length: 100 })
  receiver_name!: string;

  @Column({ length: 20 })
  receiver_phone!: string;

  @Column({ length: 10 })
  zipcode!: string;

  @Column({ length: 255 })
  address!: string;

  @Column({ length: 255 })
  detail_address!: string;

  @Column({ length: 50, nullable: true })
  courier!: string;

  @Column({ length: 100, nullable: true })
  tracking_number!: string;

  @CreateDateColumn()
  created_at!: Date;

  // 관계 설정: 한 명의 유저는 여러 주문을 할 수 있음 (탈퇴해도 주문 기록은 남도록 SET NULL 처리)
  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  items!: OrderItem[];
}
