// src/products/search-products.dto.ts
import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer'; // 💡 중요: 쿼리스트링(문자열)을 숫자로 자동 변환해줍니다.

export class SearchProductsDto {
  @IsOptional()
  @IsString()
  keyword?: string; // 상품명이나 설명에 포함된 단어 검색

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  // 💎 다이아몬드 전용 4C 필터링
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minCarat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxCarat?: number;

  @IsOptional()
  @IsString()
  cut?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  clarity?: string;
}
