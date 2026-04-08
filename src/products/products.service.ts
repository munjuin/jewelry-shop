// src/products/products.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImage } from 'src/entities/product-image.entity';
import { ProductOption } from 'src/entities/product-option.entity';
import { CreateProductOptionDto } from './dto/create-product-option.dto';
import { SearchProductsDto } from './dto/search-products.dto';
import { CursorPaginationDto } from './dto/pagination.dto';
import { AwsS3Service } from '../common/aws/aws-s3.service';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    @InjectRepository(ProductOption)
    private readonly productOptionRepository: Repository<ProductOption>,

    private readonly awsS3Service: AwsS3Service,
  ) {}

  // 1. 상품 목록 조회 (페이지네이션 및 카테고리 필터링)
  async findAll(page: number = 1, category: string = 'all') {
    const limit = 12;
    const offset = (page - 1) * limit;

    const whereCondition = category !== 'all' ? { category } : {};

    const [products, totalItems] = await this.productRepository.findAndCount({
      where: whereCondition,
      relations: ['images'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    const totalPages = Math.ceil(totalItems / limit);

    // 썸네일 추출 로직 (프론트엔드 호환성 유지)
    const formattedProducts = products.map((p) => {
      const thumbnail = p.images?.find((img) => img.is_thumbnail);
      return {
        ...p,
        image_url: thumbnail ? thumbnail.image_url : null,
      };
    });

    // 화면 렌더링 대신, 프론트엔드가 쓰기 좋게 JSON 형태로 반환합니다.
    return {
      data: formattedProducts,
      meta: {
        currentPage: page,
        totalPages,
        totalItems,
        currentCategory: category,
      },
    };
  }

  // 2. 상품 상세 조회
  async findOne(id: number) {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['images', 'options'],
      order: {
        images: { id: 'ASC' },
        options: { id: 'ASC' },
      },
    });

    // 예외 처리를 서비스에서 전담합니다.
    if (!product) {
      throw new NotFoundException(`ID가 ${id}인 상품을 찾을 수 없습니다.`);
    }

    return product;
  }

  // 상품 등록 (Create)
  async create(createProductDto: CreateProductDto) {
    const newProduct = this.productRepository.create(createProductDto);
    return await this.productRepository.save(newProduct);
  }

  // 상품 수정 (Update)
  async update(id: number, updateProductDto: UpdateProductDto) {
    const product = await this.findOne(id); // 기존 findOne 재사용 (없으면 에러 던짐)

    // Object.assign으로 기존 상품 정보에 새로운 정보를 덮어씌웁니다.
    const updatedProduct = Object.assign(product, updateProductDto);
    return await this.productRepository.save(updatedProduct);
  }

  // 상품 삭제 (Delete)
  async remove(id: number) {
    const product = await this.findOne(id); // 존재 여부 확인
    await this.productRepository.remove(product);
    return { message: `상품 ID ${id}이(가) 성공적으로 삭제되었습니다.` };
  }

  // 💡 3. 상품 이미지 저장 로직 (타입 에러 완벽 해결 및 Promise.all 최적화)
  async saveProductImages(productId: number, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 이미지 파일이 없습니다.');
    }

    const product = await this.findOne(productId);

    // Promise.all과 map을 사용하여 비동기 업로드를 완벽한 병렬로 처리합니다.
    const uploadPromises = files.map(async (file, i) => {
      // 이제 this.awsS3Service가 완벽하게 인식되며 Unsafe 에러가 사라집니다!
      const s3Url = await this.awsS3Service.uploadFileToS3('products', file);

      const newImage = this.productImageRepository.create({
        image_url: s3Url,
        is_thumbnail: i === 0,
        product: product,
      });

      return this.productImageRepository.save(newImage);
    });

    // 모든 파일의 S3 업로드와 DB 저장이 끝날 때까지 한 번에 기다립니다.
    const savedImages = await Promise.all(uploadPromises);

    return {
      message: `${files.length}개의 이미지가 S3에 성공적으로 업로드되었습니다.`,
      images: savedImages,
    };
  }

  async createOption(
    productId: number,
    createOptionDto: CreateProductOptionDto,
  ) {
    // 1. 부모 상품이 존재하는지 검증
    const product = await this.findOne(productId);

    // 2. 옵션 엔티티 생성 및 관계 매핑
    const newOption = this.productOptionRepository.create({
      ...createOptionDto,
      product: product, // 앞서 찾은 상품 객체를 매핑하여 FK(product_id) 자동 연결
    });

    // 3. DB 저장
    return await this.productOptionRepository.save(newOption);
  }

  // 💡 다중 필터링 동적 검색 (QueryBuilder)
  async searchProducts(dto: SearchProductsDto) {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      minCarat,
      maxCarat,
      cut,
      color,
      clarity,
    } = dto;

    // 1. QueryBuilder 시작 ('product'라는 별칭 사용)
    // 썸네일 이미지도 목록에 보여줘야 하므로 같이 JOIN 합니다.
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.is_thumbnail = :isThumbnail',
        { isThumbnail: true },
      );

    // 2. 동적 WHERE 조건 추가 (데이터가 들어왔을 때만 쿼리에 이어 붙임)
    if (keyword) {
      // 이름이나 설명에 키워드가 포함되어 있는지 (LIKE 검색)
      query.andWhere(
        '(product.name ILIKE :keyword OR product.description ILIKE :keyword)',
        { keyword: `%${keyword}%` },
      );
    }

    if (category) {
      query.andWhere('product.category = :category', { category });
    }

    if (minPrice !== undefined) {
      query.andWhere('product.price >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.price <= :maxPrice', { maxPrice });
    }

    if (minCarat !== undefined) {
      query.andWhere('product.carat >= :minCarat', { minCarat });
    }

    if (maxCarat !== undefined) {
      query.andWhere('product.carat <= :maxCarat', { maxCarat });
    }

    if (cut) {
      query.andWhere('product.cut = :cut', { cut });
    }

    if (color) {
      query.andWhere('product.color = :color', { color });
    }

    if (clarity) {
      query.andWhere('product.clarity = :clarity', { clarity });
    }

    // 3. 정렬 및 실행 (최신순)
    query.orderBy('product.created_at', 'DESC');

    // 완성된 쿼리를 실행하여 결과 배열 반환
    return await query.getMany();
  }

  async getProductsWithCursor(dto: CursorPaginationDto) {
    const { cursor, limit } = dto;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect(
        'product.images',
        'image',
        'image.is_thumbnail = :isThumbnail',
        { isThumbnail: true },
      )
      .orderBy('product.id', 'DESC') // ID 기준 내림차순 (최신순)
      .take(limit + 1); // 다음 페이지 존재 여부 확인을 위해 하나 더 가져옴

    if (cursor) {
      // 커서보다 작은 ID를 가진 데이터만 조회
      query.andWhere('product.id < :cursor', { cursor });
    }

    const items = await query.getMany();

    // 다음 페이지 존재 여부 확인
    const hasNextPage = items.length > limit;

    // 실제 반환할 데이터 (마지막 하나는 제외)
    const data = hasNextPage ? items.slice(0, limit) : items;

    // 다음 요청에서 사용할 새로운 커서 ID
    const nextCursor = hasNextPage ? data[data.length - 1].id : null;

    return {
      data,
      nextCursor,
      hasNextPage,
    };
  }

  // 💡 메인 배너용 베스트셀러 상품 조회 (캐싱 타겟)
  async getBestsellers() {
    console.log('--- DB에서 베스트셀러 조회 중... (Heavy Query) ---');
    return await this.productRepository.find({
      where: { status: 'ON_SALE' },
      order: { price: 'DESC' }, // 실제로는 주문량순이겠지만, 일단 비싼 순으로!
      take: 5, // 상위 5개만
      relations: ['images'],
    });
  }

  // 💡 클라이언트가 직접 S3에 업로드한 후, 반환받은 URL들만 DB에 저장하는 가벼운 로직
  async saveImageUrlsToDB(productId: number, publicUrls: string[]) {
    if (!publicUrls || publicUrls.length === 0) {
      throw new BadRequestException('저장할 이미지 URL이 없습니다.');
    }

    // 상품 존재 여부 확인
    const product = await this.findOne(productId);

    // 전달받은 URL 배열을 순회하며 DB 엔티티로 매핑 후 병렬 저장
    const savedImagesPromises = publicUrls.map(async (url, i) => {
      const newImage = this.productImageRepository.create({
        image_url: url,
        is_thumbnail: i === 0, // 첫 번째 URL을 썸네일로 지정
        product: product,
      });

      return this.productImageRepository.save(newImage);
    });

    const savedImages = await Promise.all(savedImagesPromises);

    return {
      message: `${publicUrls.length}개의 이미지 URL이 DB에 성공적으로 연결되었습니다.`,
      images: savedImages,
    };
  }
}
