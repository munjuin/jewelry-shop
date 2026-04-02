// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../entities/product.entity'; // 경로 확인 필요
import { ProductImage } from '../entities/product-image.entity';
import { ProductOption } from '../entities/product-option.entity';

@Module({
  // 이 모듈에서 Product, ProductImage, ProductOption 레포지토리를 사용하겠다고 선언합니다.
  imports: [TypeOrmModule.forFeature([Product, ProductImage, ProductOption])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
