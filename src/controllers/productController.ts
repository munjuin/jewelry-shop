import { Request, Response } from 'express';
import { Product, ProductOption ,ProductImage } from '../types/product';

export const getProducts = async (req: Request, res: Response) => {
    try {
        // 1. 쿼리 파라미터 처리 (명시적 타입 변환)
        const page = parseInt(req.query.page as string) || 1;
        const category = (req.query.category as string) || 'all';
        const limit = 12;
        const offset = (page - 1) * limit;

        // 2. SQL 조건문 동적 생성
        let whereClause = '';
        let queryParams: any[] = [];
        
        if (category !== 'all') {
            whereClause = 'WHERE p.category = $1';
            queryParams.push(category);
        }

        // 3. 상품 목록 조회 (주인님의 Product 인터페이스 적용)
        const listQuery = `
            SELECT p.*, pi.image_url 
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = true
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const productsResult = await req.db.query<Product>(listQuery, queryParams);

        // 4. 전체 상품 수 조회
        const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
        const countResult = await req.db.query<{ count: string }>(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        res.render('products/list', { 
            title: 'Shop',
            products: productsResult.rows,
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
        const productId = req.params.id;

        // 1. 상품 기본 정보 조회
        const productQuery = `SELECT * FROM products WHERE id = $1`;
        const productResult = await req.db.query<Product>(productQuery, [productId]);
        const product = productResult.rows[0];

        if (!product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }

        // 2. 관련 이미지 조회
        const imagesQuery = `SELECT * FROM product_images WHERE product_id = $1 ORDER BY id ASC`;
        const imagesResult = await req.db.query<ProductImage>(imagesQuery, [productId]);

        // 3. 관련 옵션 조회 (주인님의 ProductOption 인터페이스 적용)
        const optionsQuery = `SELECT * FROM product_options WHERE product_id = $1 ORDER BY id ASC`;
        const optionsResult = await req.db.query<ProductOption>(optionsQuery, [productId]);

        res.render('products/detail', {
            title: product.name,
            product: product,
            images: imagesResult.rows,
            options: optionsResult.rows
        });

    } catch (error) {
        console.error('상품 상세 조회 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};