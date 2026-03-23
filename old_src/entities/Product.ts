// src/entities/Product.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  OneToMany 
} from 'typeorm';
import { ProductImage } from './ProductImage';
import { ProductOption } from './ProductOption';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 0 })
  price: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'ON_SALE' 
  })
  status: 'ON_SALE' | 'SOLD_OUT';

  @CreateDateColumn()
  created_at: Date;

  // 관계 설정: 하나의 상품은 여러 이미지를 가질 수 있음
  @OneToMany(() => ProductImage, (image) => image.product)
  images: ProductImage[];

  // 관계 설정: 하나의 상품은 여러 옵션(호수, 재질 등)을 가질 수 있음
  @OneToMany(() => ProductOption, (option) => option.product)
  options: ProductOption[];
}