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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,

    @InjectRepository(ProductOption)
    private readonly productOptionRepository: Repository<ProductOption>,
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

  // 4. 상품 이미지 DB 저장 로직
  async saveProductImages(productId: number, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('업로드할 이미지 파일이 없습니다.');
    }

    const product = await this.findOne(productId); // 상품이 존재하는지 먼저 확인

    const savedImages = [];

    // 업로드된 파일 배열을 순회하며 DB 엔티티로 만듭니다.
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const isThumbnail = i === 0; // 첫 번째 올린 이미지를 썸네일로 지정 (비즈니스 로직에 따라 변경 가능)

      const newImage = this.productImageRepository.create({
        image_url: `/uploads/products/${file.filename}`, // 프론트엔드에서 접근할 가상 경로
        is_thumbnail: isThumbnail,
        product: product, // 관계 설정
      });

      const savedImage = await this.productImageRepository.save(newImage);
      savedImages.push(savedImage);
    }

    return {
      message: `${files.length}개의 이미지가 성공적으로 업로드되었습니다.`,
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
}
