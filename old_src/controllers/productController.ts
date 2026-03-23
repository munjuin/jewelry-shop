// src/controllers/productController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/db'; // TypeORM 연결 객체
import { Product } from '../entities/Product'; // TypeORM 엔티티

// Repository 가져오기

export const getProducts = async (req: Request, res: Response) => {
  try {
      const productRepository = AppDataSource.getRepository(Product);
        // 1. 쿼리 파라미터 처리
        const page = parseInt(req.query.page as string) || 1;
        const category = (req.query.category as string) || 'all';
        const limit = 12;
        const offset = (page - 1) * limit;

        // 2. 동적 조건 객체 생성 (category가 'all'이 아닐 때만 필터링 추가)
        const whereCondition = category !== 'all' ? { category } : {};

        // 3. 상품 목록 및 전체 개수 단일 쿼리로 조회 (findAndCount의 위력!)
        const [products, totalItems] = await productRepository.findAndCount({
            where: whereCondition,
            relations: ['images'], // 이미지 테이블 JOIN
            order: { created_at: 'DESC' },
            skip: offset,  // OFFSET
            take: limit,   // LIMIT
        });

        const totalPages = Math.ceil(totalItems / limit);

        // 4. 기존 EJS 템플릿(p.image_url)과의 호환성을 위해 썸네일 이미지 추출
        const formattedProducts = products.map(p => {
            const thumbnail = p.images?.find(img => img.is_thumbnail);
            return {
                ...p,
                image_url: thumbnail ? thumbnail.image_url : null
            };
        });

        res.render('products/list', { 
            title: 'Shop',
            products: formattedProducts,
            currentPage: page,
            totalPages: totalPages,
            currentCategory: category
        });

    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};

export const getProductDetail = async (req: Request, res: Response) => {
    try {
        const productRepository = AppDataSource.getRepository(Product);
        const productId = parseInt(req.params.id);

        // 1. 상품, 이미지, 옵션을 단 한 번의 호출로 모두 가져옴 (relations 옵션)
        const product = await productRepository.findOne({
            where: { id: productId },
            relations: ['images', 'options'], // 기존 3번의 SQL 쿼리를 이거 한 줄로 대체!
            order: {
                images: { id: 'ASC' },
                options: { id: 'ASC' }
            }
        });

        if (!product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }

        // 2. 렌더링 (TypeORM이 images와 options 배열을 자동으로 채워줍니다)
        res.render('products/detail', {
            title: product.name,
            product: product,
            images: product.images,   
            options: product.options  
        });

    } catch (error) {
        console.error('상품 상세 조회 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};