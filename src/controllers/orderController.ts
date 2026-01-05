import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { OrderShape, OrderItemShape } from '../types/order';

// 주문서 작성 페이지
export const getCheckoutPage = async (req: Request, res: Response) => {
    const userId = req.user!.id; // isAuthenticated 미들웨어가 있으므로 ! 사용

    try {
        const query = `
            SELECT ci.quantity, p.name AS product_name, p.price AS base_price,
                   po.option_name, po.extra_price
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN product_options po ON ci.product_option_id = po.id
            JOIN carts c ON ci.cart_id = c.id
            WHERE c.user_id = $1
        `;
        
        const result = await req.db.query(query, [userId]);
        const cartItems = result.rows;

        if (cartItems.length === 0) {
            return res.send('<script>alert("장바구니가 비어있습니다."); location.href="/products";</script>');
        }

        let totalProductPrice = 0;
        cartItems.forEach((item: any) => {
            totalProductPrice += (item.base_price + item.extra_price) * item.quantity;
        });

        const deliveryFee = (totalProductPrice < 100000) ? 3000 : 0;
        const finalPrice = totalProductPrice + deliveryFee;

        res.render('orders/checkout', {
            title: '주문서 작성',
            cartItems,
            totalProductPrice,
            deliveryFee,
            finalPrice
        });
    } catch (error) {
        console.error('주문 페이지 오류:', error);
        res.status(500).send('오류가 발생했습니다.');
    }
};

// 주문 생성 (트랜잭션 포함)
export const createOrder = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { receiver_name, receiver_phone, zipcode, address, detail_address } = req.body;

    const client: PoolClient = await req.db.connect();

    try {
        const cartQuery = `
            SELECT ci.product_id, ci.product_option_id, ci.quantity,
                   p.price AS base_price, po.extra_price, po.option_name, po.stock_quantity
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN product_options po ON ci.product_option_id = po.id
            JOIN carts c ON ci.cart_id = c.id
            WHERE c.user_id = $1
        `;
        const cartRes = await client.query(cartQuery, [userId]);
        const cartItems = cartRes.rows;

        if (cartItems.length === 0) {
            return res.send('<script>alert("장바구니가 비어있습니다."); location.href="/products";</script>');
        }

        // 재고 검증 및 금액 계산
        let totalAmount = 0;
        for (const item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                client.release();
                return res.send(`<script>alert("재고가 부족합니다: ${item.option_name}"); history.back();</script>`);
            }
            totalAmount += (item.base_price + item.extra_price) * item.quantity;
        }

        const deliveryFee = (totalAmount < 100000) ? 3000 : 0;
        const finalAmount = totalAmount + deliveryFee;

        // 트랜잭션 시작
        await client.query('BEGIN');

        const orderInsert = `
            INSERT INTO orders (user_id, total_amount, delivery_fee, final_amount, receiver_name, receiver_phone, zipcode, address, detail_address, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PAID') RETURNING id
        `;
        const orderRes = await client.query<OrderShape>(orderInsert, [
            userId, totalAmount, deliveryFee, finalAmount, receiver_name, receiver_phone, zipcode, address, detail_address
        ]);
        const orderId = orderRes.rows[0].id;

        for (const item of cartItems) {
            const priceSnapshot = item.base_price + item.extra_price;
            
            // 주문 상세 저장
            await client.query(
                `INSERT INTO order_items (order_id, product_id, option_snapshot, quantity, price_snapshot) VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.product_id, item.option_name, item.quantity, priceSnapshot]
            );

            // 재고 차감
            await client.query(
                `UPDATE product_options SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
                [item.quantity, item.product_option_id]
            );
        }

        // 장바구니 비우기
        await client.query(`DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`, [userId]);

        await client.query('COMMIT');
        res.redirect(`/orders/complete?id=${orderId}`);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('주문 생성 오류:', error);
        res.status(500).send('<script>alert("오류가 발생했습니다."); history.back();</script>');
    } finally {
        client.release();
    }
};

// 주문 내역 조회
export const getOrderList = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    try {
        const result = await req.db.query<OrderShape>(
            'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', 
            [userId]
        );
        res.render('users/mypage-orders', { title: '주문 내역', orders: result.rows });
    } catch (error) {
        res.status(500).send('오류가 발생했습니다.');
    }
};

// 주문 취소 로직
export const cancelOrder = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const orderId = req.params.id;
    const client: PoolClient = await req.db.connect();

    try {
        await client.query('BEGIN');
        const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 AND user_id = $2', [orderId, userId]);
        if (orderRes.rowCount === 0) throw new Error('NOT_FOUND');

        await client.query("UPDATE orders SET status = 'CANCELLED' WHERE id = $1", [orderId]);
        
        const itemsRes = await client.query('SELECT * FROM order_items WHERE order_id = $1', [orderId]);
        for (const item of itemsRes.rows) {
            await client.query(
                `UPDATE product_options SET stock_quantity = stock_quantity + $1 WHERE product_id = $2 AND option_name = $3`,
                [item.quantity, item.product_id, item.option_snapshot]
            );
        }
        await client.query('COMMIT');
        // ✅ 표준 리다이렉트
        res.redirect('/mypage/orders');
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).send('취소 실패');
    } finally {
        client.release();
    }
};

export const getOrderComplete = (req: Request, res: Response) => {
    res.render('orders/complete', { orderId: req.query.id });
};