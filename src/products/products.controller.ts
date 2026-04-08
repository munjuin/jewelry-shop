// src/products/products.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Body,
  Post,
  UseGuards,
  Patch,
  Delete,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CursorPaginationDto } from './dto/pagination.dto';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { GetPresignedUrlsRequestDto } from './dto/get-presigned-url.dto';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // 💡 메인 배너 캐싱 적용
  @UseInterceptors(CacheInterceptor) // 자동 캐싱 인터셉터
  @CacheKey('main_bestsellers') // Redis에 저장될 키 이름
  @CacheTTL(60) // 이 API만 특별히 1분간 캐싱
  @Get('bestsellers')
  async getBestsellers() {
    return await this.productsService.getBestsellers();
  }

  // 💡 다중 필터링 검색 API (반드시 Get(':id') 보다 위에 위치!)
  // GET /products/search?category=rings&minPrice=500000&cut=Excellent
  @Get('search')
  async searchProducts(@Query() searchDto: SearchProductsDto) {
    return await this.productsService.searchProducts(searchDto);
  }

  // 💡 [핵심 트러블슈팅] 중복되었던 @Get()을 하나로 통합하고 Cursor Pagination을 기본으로 사용
  @Get()
  async getProductsList(@Query() paginationDto: CursorPaginationDto) {
    return await this.productsService.getProductsWithCursor(paginationDto);
  }

  // GET /products/:id
  @Get(':id')
  async getProductDetail(
    // ParseIntPipe를 사용하면 'abc' 같은 문자가 들어왔을 때 자동으로 400 에러를 뱉어냅니다!
    @Param('id', ParseIntPipe) id: number,
  ) {
    return await this.productsService.findOne(id);
  }

  // 1. 상품 등록 (POST /products) - 관리자 전용
  @Post()
  @Roles('ADMIN') // 이 라우터는 ADMIN만 접근 가능하다는 이름표 부착
  @UseGuards(JwtAuthGuard, RolesGuard) // 1차: 로그인 확인, 2차: 권한 확인
  async createProduct(@Body() createProductDto: CreateProductDto) {
    return await this.productsService.create(createProductDto);
  }

  // 2. 상품 수정 (PATCH /products/:id) - 관리자 전용
  @Patch(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async updateProduct(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return await this.productsService.update(id, updateProductDto);
  }

  // 3. 상품 삭제 (DELETE /products/:id) - 관리자 전용
  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.remove(id);
  }

  // 💡 상품 이미지 업로드 (관리자 전용)
  // POST /products/:id/images
  @Post(':id/images')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(
    FilesInterceptor('images', 5, {
      // 로컬디스크에 저장하는 방식
      // storage: diskStorage({
      //   destination: './uploads/products', // 파일이 저장될 물리적 경로
      //   filename: (req, file, callback) => {
      //     // 파일명 중복을 막기 위해 현재 시간 + 랜덤 문자열로 파일명 생성
      //     const uniqueSuffix =
      //       Date.now() + '-' + Math.round(Math.random() * 1e9);
      //     const ext = extname(file.originalname);
      //     callback(null, `${uniqueSuffix}${ext}`);
      //   },
      // }),

      // 메모리 스토리지에 저장하는 방식
      storage: memoryStorage(),
      limits: {
        fileSize: 5 * 1024 * 1024, // 💡 [이슈 B 해결] OOM 방어를 위해 파일 하나당 5MB로 엄격히 제한
      },
      fileFilter: (req, file, callback) => {
        // 이미지 파일만 허용하는 보안 필터
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
          return callback(new Error('이미지 파일만 업로드 가능합니다.'), false);
        }
        callback(null, true);
      },
    }),
  )
  async uploadProductImages(
    @Param('id', ParseIntPipe) productId: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    // 인터셉터를 통과하여 물리적 폴더에 저장된 파일 정보들을 서비스로 넘깁니다.
    return await this.productsService.saveProductImages(productId, files);
  }

  // POST /products/:id/options
  @Post(':id/options')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async createProductOption(
    @Param('id', ParseIntPipe) productId: number,
    @Body() createOptionDto: CreateProductOptionDto,
  ) {
    return await this.productsService.createOption(productId, createOptionDto);
  }

  // 💡 [New] 1. S3 업로드용 일회성 티켓(Presigned URL) 발급 API
  @Post('presigned-urls')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async getPresignedUrls(@Body() requestDto: GetPresignedUrlsRequestDto) {
    // 여러 장의 이미지를 위해 여러 개의 URL을 병렬로 발급
    const urls = await Promise.all(
      requestDto.files.map((file) =>
        this.productsService['awsS3Service'].getPresignedUrl(
          'products',
          file.filename,
          file.contentType,
        ),
      ),
    );
    return { urls };
  }

  // 💡 [New] 2. 클라이언트가 S3 직접 업로드 완료 후 호출하는 DB 저장 API
  @Post(':id/images/confirm')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async confirmImageUpload(
    @Param('id', ParseIntPipe) productId: number,
    // Body로 {"publicUrls": ["https://s3...", "https://s3..."]} 형태를 받음
    @Body('publicUrls') publicUrls: string[],
  ) {
    return await this.productsService.saveImageUrlsToDB(productId, publicUrls);
  }
}
