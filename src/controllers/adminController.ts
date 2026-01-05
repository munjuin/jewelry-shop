import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { S3File, ProductRequest } from '../types/admin';

// 1. 상품 등록 페이지 렌더링
export const getProductForm = (req: Request, res: Response) => {
    res.render('admin/product-new', { title: '상품 등록' });
};

// 2. 상품 등록 처리 (트랜잭션)
export const createProduct = async (req: Request, res: Response) => {
    const client: PoolClient = await req.db.connect();

    try {
        const { name, price, description, category, option_name, extra_price, stock_quantity } = req.body as ProductRequest;
        const files = req.files as S3File[]; // S3 파일 타입 캐스팅

        await client.query('BEGIN');

        // [1] 상품 기본 정보 저장
        const productRes = await client.query(
            'INSERT INTO products (name, price, description, category) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, price, description, category]
        );
        const productId = productRes.rows[0].id;

        // [2] 이미지 정보 저장 (S3 URL)
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const imageUrl = files[i].location;
                const isThumbnail = (i === 0);
                await client.query(
                    'INSERT INTO product_images (product_id, image_url, is_thumbnail) VALUES ($1, $2, $3)',
                    [productId, imageUrl, isThumbnail]
                );
            }
        }

        // [3] 옵션 정보 저장 (배열화 헬퍼 함수 활용)
        const toArray = (val: any) => Array.isArray(val) ? val : (val ? [val] : []);
        const names = toArray(option_name);
        const extras = toArray(extra_price);
        const stocks = toArray(stock_quantity);

        for (let i = 0; i < names.length; i++) {
            if (!names[i]) continue;
            await client.query(
                'INSERT INTO product_options (product_id, option_name, extra_price, stock_quantity) VALUES ($1, $2, $3, $4)',
                [productId, names[i], Number(extras[i]) || 0, Number(stocks[i]) || 0]
            );
        }

        await client.query('COMMIT');
        // ✅ 표준 리다이렉트 (메시지는 쿼리스트링으로 전달 가능)
        res.redirect('/admin/products?status=success');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('상품 등록 오류:', error);
        res.status(500).redirect('/admin/products/new?status=error');
    } finally {
        client.release();
    }
};

// 3. 관리자 주문 목록 조회
export const getOrders = async (req: Request, res: Response) => {
    try {
        const query = `
            SELECT o.*, u.email, u.name AS user_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;
        const result = await req.db.query(query);
        res.render('admin/order-list', { title: '주문 관리', orders: result.rows });
    } catch (error) {
        res.status(500).send('서버 오류');
    }
};

// 4. 주문 상태 업데이트
export const updateOrderStatus = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, courier, tracking_number } = req.body;

    try {
        await req.db.query(
            'UPDATE orders SET status = $1, courier = $2, tracking_number = $3 WHERE id = $4',
            [status, courier, tracking_number, id]
        );
        res.redirect('/admin/orders?status=updated');
    } catch (error) {
        res.status(500).redirect('/admin/orders?status=error');
    }
};

// 5. 상품 삭제
export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await req.db.query('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.redirect('/admin/products?status=deleted');
    } catch (error) {
        res.status(500).redirect('/admin/products?status=error');
    }
};