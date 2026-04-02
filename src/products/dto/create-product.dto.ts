// src/products/dto/create-product.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
} from 'class-validator';
import {
  DiamondCut,
  DiamondColor,
  DiamondClarity,
} from '../../entities/product.entity'; // 경로 확인 필요

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: '상품명은 필수입니다.' })
  name!: string;

  @IsNumber()
  @Min(0, { message: '가격은 0 이상이어야 합니다.' })
  price!: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsEnum(['ON_SALE', 'SOLD_OUT'], {
    message: '상태는 ON_SALE 또는 SOLD_OUT 이어야 합니다.',
  })
  @IsOptional()
  status?: 'ON_SALE' | 'SOLD_OUT';

  // 다이아몬드 4C 스펙 (선택 사항)
  @IsNumber()
  @IsOptional()
  carat?: number;

  @IsEnum(DiamondCut)
  @IsOptional()
  cut?: DiamondCut;

  @IsEnum(DiamondColor)
  @IsOptional()
  color?: DiamondColor;

  @IsEnum(DiamondClarity)
  @IsOptional()
  clarity?: DiamondClarity;
}
