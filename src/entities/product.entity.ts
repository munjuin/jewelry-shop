// product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { ProductOption } from './product-option.entity';

// 💎 다이아몬드 4C 스펙을 위한 Enum 정의 (데이터 무결성 방어)
export enum DiamondCut {
  EXCELLENT = 'Excellent',
  VERY_GOOD = 'Very Good',
  GOOD = 'Good',
  FAIR = 'Fair',
  POOR = 'Poor',
}

export enum DiamondColor {
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  J = 'J',
}

export enum DiamondClarity {
  FL = 'FL',
  IF = 'IF',
  VVS1 = 'VVS1',
  VVS2 = 'VVS2',
  VS1 = 'VS1',
  VS2 = 'VS2',
  SI1 = 'SI1',
  SI2 = 'SI2',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ default: 0 })
  price!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

  @Column({ nullable: true })
  category!: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'ON_SALE',
  })
  status!: 'ON_SALE' | 'SOLD_OUT';

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  carat!: number;

  @Column({ type: 'enum', enum: DiamondCut, nullable: true })
  cut!: DiamondCut;

  @Column({ type: 'enum', enum: DiamondColor, nullable: true })
  color!: DiamondColor;

  @Column({ type: 'enum', enum: DiamondClarity, nullable: true })
  clarity!: DiamondClarity;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => ProductImage, (image) => image.product)
  images!: ProductImage[];

  @OneToMany(() => ProductOption, (option) => option.product)
  options!: ProductOption[];
}
