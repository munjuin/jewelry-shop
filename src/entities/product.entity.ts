// product.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ProductImage } from './product-image.entity';
import { ProductOption } from './product-option.entity';

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
// 💡 복합 인덱스 설정: category와 id를 묶어서 성능 최적화
@Index('idx_product_category_id', ['category', 'id'])
export class Product {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 100 })
  @Index() // 단일 컬럼 인덱스도 필요한 경우 추가
  category!: string;

  @Column({ length: 255 }) // 👈 name 속성이 돌아왔습니다!
  name!: string;

  @Column({ type: 'int' })
  @Index()
  price!: number;

  @Column({ type: 'text', nullable: true })
  description!: string;

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
