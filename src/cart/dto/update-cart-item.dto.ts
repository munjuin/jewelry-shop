import { IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1, { message: '수량은 1개 이상이어야 합니다.' })
  quantity!: number;
}
