// src/products/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// PartialType을 사용하면 CreateProductDto의 모든 속성을 선택적(Optional)으로 물려받습니다.
export class UpdateProductDto extends PartialType(CreateProductDto) {}
