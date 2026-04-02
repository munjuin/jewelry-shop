// src/products/dto/create-product-option.dto.ts
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class CreateProductOptionDto {
  @IsString()
  @IsNotEmpty({ message: '옵션명은 필수입니다. (예: 12호, 18K 골드)' })
  option_name!: string;

  @IsNumber()
  @Min(0, { message: '추가 금액은 0 이상이어야 합니다.' })
  extra_price!: number;

  @IsNumber()
  @Min(0, { message: '재고 수량은 0 이상이어야 합니다.' })
  stock_quantity!: number;
}
