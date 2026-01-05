import { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { CartItemView, CartTotals } from '../types/cart';

const getCartTotals = async (userId: number, req: Request): Promise<CartTotals> => {
    const query = `
        SELECT ci.quantity, p.price AS base_price, po.extra_price
        FROM cart_items ci JOIN carts c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        JOIN product_options po ON ci.product_option_id = po.id
        WHERE c.user_id = $1
    `;
    const result = await req.db.query(query, [userId]);
    let totalProductPrice = 0;
    result.rows.forEach((item: any) => {
        totalProductPrice += (item.base_price + item.extra_price) * item.quantity;
    });
    const deliveryFee = (result.rows.length > 0 && totalProductPrice < 100000) ? 3000 : 0;
    return { totalProductPrice, deliveryFee, finalPrice: totalProductPrice + deliveryFee, itemCount: result.rows.length };
};

// 1. 장바구니에 아이템 추가
export const addToCart = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const { product_id, product_option_id, quantity } = req.body;
    const qty = parseInt(quantity as string) || 1;
    const client: PoolClient = await req.db.connect();

    try {
        await client.query('BEGIN');
        let cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
        let cartId = cartRes.rows.length === 0 
            ? (await client.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId])).rows[0].id
            : cartRes.rows[0].id;

        const itemRes = await client.query(
            'SELECT id FROM cart_items WHERE cart_id = $1 AND product_option_id = $2',
            [cartId, product_option_id]
        );

        if (itemRes.rows.length > 0) {
            await client.query('UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2', [qty, itemRes.rows[0].id]);
        } else {
            await client.query(
                'INSERT INTO cart_items (cart_id, product_id, product_option_id, quantity) VALUES ($1, $2, $3, $4)',
                [cartId, product_id, product_option_id, qty]
            );
        }
        await client.query('COMMIT');
        // ✅ 표준 리다이렉트
        res.redirect('/cart'); 
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).send('장바구니 담기 실패');
    } finally {
        client.release();
    }
};

// 2. 장바구니 페이지 조회
export const getCartPage = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    try {
        const query = `
            SELECT ci.id AS item_id, ci.quantity, p.id AS product_id, p.name AS product_name,
                   p.price AS base_price, po.option_name, po.extra_price, pi.image_url
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            JOIN products p ON ci.product_id = p.id
            JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = true
            WHERE c.user_id = $1 ORDER BY ci.created_at DESC
        `;

        const result = await req.db.query<CartItemView>(query, [userId]);
        const cartItems = result.rows;

        let totalProductPrice = 0;
        cartItems.forEach(item => {
            const unitPrice = item.base_price + item.extra_price;
            item.total_price = unitPrice * item.quantity;
            totalProductPrice += item.total_price;
        });

        const deliveryFee = (cartItems.length > 0 && totalProductPrice < 100000) ? 3000 : 0;
        const finalPrice = totalProductPrice + deliveryFee;

        res.render('cart/list', { title: 'My Cart', cartItems, totalProductPrice, deliveryFee, finalPrice });
    } catch (error) {
        res.status(500).send('장바구니를 불러오지 못했습니다.');
    }
};

// 3. 수량 변경 (PATCH API)
export const updateCartItem = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const itemId = req.params.itemId;
    const { quantity } = req.body;

    if (quantity < 1) return res.status(400).json({ message: '수량 오류' });

    const client: PoolClient = await req.db.connect();
    try {
        await client.query('BEGIN');
        const updateQuery = `
            UPDATE cart_items ci SET quantity = $1 FROM carts c
            WHERE ci.cart_id = c.id AND ci.id = $2 AND c.user_id = $3
            RETURNING ci.product_id, ci.product_option_id
        `;
        const result = await client.query(updateQuery, [quantity, itemId, userId]);

        if (result.rowCount === 0) throw new Error('NOT_FOUND');

        const priceRes = await client.query(
            'SELECT (p.price + po.extra_price) as unit_price FROM products p, product_options po WHERE p.id = $1 AND po.id = $2',
            [result.rows[0].product_id, result.rows[0].product_option_id]
        );
        const itemTotalPrice = priceRes.rows[0].unit_price * quantity;

        await client.query('COMMIT');
        const totals = await getCartTotals(userId, req);
        res.json({ message: '수정됨', itemTotalPrice, ...totals });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ message: '서버 오류' });
    } finally {
        client.release();
    }
};

// 4. 장바구니 삭제 (DELETE API)
export const deleteCartItem = async (req: Request, res: Response) => {
    const userId = req.user!.id as number;
    const itemId = req.params.itemId;

    try {
        const query = `
            DELETE FROM cart_items ci USING carts c
            WHERE ci.cart_id = c.id AND ci.id = $1 AND c.user_id = $2
        `;
        const result = await req.db.query(query, [itemId, userId]);
        if (result.rowCount === 0) return res.status(404).json({ message: '항목 없음' });

        const totals = await getCartTotals(userId, req);
        res.json({ message: '삭제됨', ...totals });
    } catch (error) {
        res.status(500).json({ message: '서버 오류' });
    }
};