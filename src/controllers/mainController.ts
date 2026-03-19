// src/controllers/mainController.ts
import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/db';
import { Product } from '../entities/Product';

export const getHomePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. 최신 상품 8개 조회 (이미지 포함)
        const products = await AppDataSource.getRepository(Product).find({
            relations: ['images'],
            order: { created_at: 'DESC' },
            take: 8
        });

        // 2. EJS 템플릿 호환성을 위해 썸네일 이미지를 image_url 속성으로 추출
        const formattedProducts = products.map(p => {
            const thumbnail = p.images?.find(img => img.is_thumbnail);
            return {
                ...p,
                image_url: thumbnail ? thumbnail.image_url : null
            };
        });

        // 3. 뷰 렌더링
        res.render('index', {
            products: formattedProducts,
            user: res.locals.user, // 전역 미들웨어에서 설정된 user 정보 활용
            title: '주얼리 쇼핑몰 - 메인'
        });
    } catch (error) {
        console.error('메인 페이지 로드 중 오류 발생:', error);
        next(error);
    }
};