// src/entities/product-option.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_options')
export class ProductOption {
  @PrimaryGeneratedColumn()
  id!: number;

  // 옵션명 (예: "12호", "45cm", "18K 옐로우 골드")
  @Column({ type: 'varchar', length: 100, default: '' })
  option_name!: string;

  // 💡 [포트폴리오 핵심] 옵션 선택 시 추가되는 과금액 (예: 18K 선택 시 +50000)
  @Column({ type: 'int', default: 0 })
  extra_price!: number;

  // 옵션별 개별 재고 (예: 12호는 5개 남음, 14호는 품절)
  @Column({ type: 'int', default: 0 })
  stock_quantity!: number;

  @CreateDateColumn()
  created_at!: Date;

  // --------------------------------------------------
  // 🔗 1:N 관계 매핑 (옵션 N : 상품 1)
  // --------------------------------------------------
  // onDelete: 'CASCADE' -> 부모인 Product가 삭제되면 이 옵션들도 DB에서 자동 삭제됨!
  @ManyToOne(() => Product, (product) => product.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' }) // 실제 DB에 생성될 외래키(FK) 컬럼명
  product!: Product;
}
