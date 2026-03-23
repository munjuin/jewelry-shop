// src/controllers/adminController.ts
import { Request, Response } from 'express';
import { AppDataSource } from '../config/db';
import { Product } from '../entities/Product';
import { ProductImage } from '../entities/ProductImage';
import { ProductOption } from '../entities/ProductOption';
import { Order } from '../entities/Order';
import { S3File, ProductRequest } from '../types/admin'; // (기존 타입 유지)

// const productRepository = AppDataSource.getRepository(Product);
// const orderRepository = AppDataSource.getRepository(Order);

// 1. 상품 등록 페이지 렌더링
export const getProductForm = (req: Request, res: Response) => {
    res.render('admin/product-new', { title: '상품 등록' });
};

// 2. 상품 등록 처리 (🔥 완벽한 TypeORM 트랜잭션 및 관계 매핑)
export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, price, description, category, option_name, extra_price, stock_quantity } = req.body as unknown as ProductRequest;
        const files = req.files as S3File[]; // S3 파일 타입 캐스팅

        await AppDataSource.transaction(async (manager) => {
            // [1] 상품 기본 정보 저장
            const product = manager.create(Product, {
                name,
                price: Number(price),
                description,
                category
            });
            await manager.save(product);

            // [2] 이미지 정보 저장 (S3 URL)
            if (files && files.length > 0) {
                for (let i = 0; i < files.length; i++) {
                    const image = manager.create(ProductImage, {
                        product: { id: product.id }, // 외래키 연결
                        image_url: files[i].location,
                        is_thumbnail: (i === 0)
                    });
                    await manager.save(image);
                }
            }

            // [3] 옵션 정보 저장 (배열화 헬퍼 함수 활용)
            const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);
            const names = toArray(option_name);
            const extras = toArray(extra_price);
            const stocks = toArray(stock_quantity);

            for (let i = 0; i < names.length; i++) {
                if (!names[i]) continue;
                const option = manager.create(ProductOption, {
                    product: { id: product.id }, // 외래키 연결
                    option_name: names[i],
                    extra_price: Number(extras[i]) || 0,
                    stock_quantity: Number(stocks[i]) || 0
                });
                await manager.save(option);
            }
        });

        res.redirect('/admin/products?status=success');

    } catch (error) {
        console.error('상품 등록 트랜잭션 오류:', error);
        res.status(500).redirect('/admin/products/new?status=error');
    }
};

// 3. 관리자 주문 목록 조회 (🔥 LEFT JOIN을 relations 하나로 압축)
export const getOrders = async (req: Request, res: Response) => {
  const orderRepository = AppDataSource.getRepository(Order);

    try {
        const orders = await orderRepository.find({
            relations: ['user'], // Users 테이블 자동 JOIN
            order: { created_at: 'DESC' }
        });

        // 기존 EJS 템플릿과의 호환성을 위한 데이터 매핑 (u.email, u.name AS user_name)
        const formattedOrders = orders.map(order => ({
            ...order,
            email: order.user ? order.user.email : '탈퇴한 회원',
            user_name: order.user ? order.user.name : '알 수 없음'
        }));

        res.render('admin/order-list', { title: '주문 관리', orders: formattedOrders });
    } catch (error) {
        console.error('주문 목록 조회 오류:', error);
        res.status(500).send('서버 오류');
    }
};

// 4. 주문 상태 업데이트
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, courier, tracking_number } = req.body;
    const orderRepository = AppDataSource.getRepository(Order);


    try {
        // 단일 쿼리로 빠르고 가볍게 업데이트
        await orderRepository.update(id, {
            status,
            courier,
            tracking_number
        });
        res.redirect('/admin/orders?status=updated');
    } catch (error) {
        res.status(500).redirect('/admin/orders?status=error');
    }
};

// 5. 상품 삭제 (Cascade 옵션 덕분에 연관된 옵션, 이미지, 장바구니 아이템 자동 삭제)
export const deleteProduct = async (req: Request, res: Response) => {
    const productRepository = AppDataSource.getRepository(Product);

    try {
        await productRepository.delete(req.params.id);
        res.redirect('/admin/products?status=deleted');
    } catch (error) {
        res.status(500).redirect('/admin/products?status=error');
    }
};