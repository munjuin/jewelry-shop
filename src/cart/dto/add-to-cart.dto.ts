// src/cart/dto/add-to-cart.dto.ts
import { IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  @IsNotEmpty({ message: '상품 ID는 필수입니다.' })
  product_id!: number;

  @IsNumber()
  @IsNotEmpty({ message: '상품 옵션 ID는 필수입니다.' })
  product_option_id!: number;

  @IsNumber()
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  @IsOptional()
  quantity?: number; // 값이 안 들어오면 서비스에서 기본값 1로 처리
}
