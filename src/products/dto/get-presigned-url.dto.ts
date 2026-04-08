// src/products/dto/get-presigned-url.dto.ts
import {
  IsString,
  IsNotEmpty,
  Matches,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetPresignedUrlDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^image\/(jpeg|png|gif|webp)$/, {
    message: '허용되지 않는 이미지 타입입니다.',
  })
  contentType!: string;
}

export class GetPresignedUrlsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetPresignedUrlDto)
  files!: GetPresignedUrlDto[];
}
