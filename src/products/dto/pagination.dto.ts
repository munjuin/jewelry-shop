import { IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  cursor?: number; // 마지막으로 조회된 상품의 ID

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit: number = 10; // 기본값 10개
}
