// controllers/orderController.js

// 주문서 작성 페이지 (GET /checkout)
exports.getCheckoutPage = async (req, res) => {
    if (!req.user) {
        return res.redirect('/login');
    }

    const userId = req.user.id;

    try {
        // 1. 장바구니에 담긴 아이템 조회 (가격 계산용)
        const query = `
            SELECT 
                ci.quantity,
                p.name AS product_name,
                p.price AS base_price,
                po.option_name,
                po.extra_price
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.id
            JOIN product_options po ON ci.product_option_id = po.id
            JOIN carts c ON ci.cart_id = c.id
            WHERE c.user_id = $1
        `;
        
        const result = await req.db.query(query, [userId]);
        const cartItems = result.rows;

        // 장바구니가 비었으면 쇼핑으로 돌려보냄
        if (cartItems.length === 0) {
            return res.send('<script>alert("장바구니가 비어있습니다."); location.href="/products";</script>');
        }

        // 2. 금액 계산
        let totalProductPrice = 0;
        cartItems.forEach(item => {
            totalProductPrice += (item.base_price + item.extra_price) * item.quantity;
        });

        let deliveryFee = (totalProductPrice < 100000) ? 3000 : 0;
        const finalPrice = totalProductPrice + deliveryFee;

        // 3. 뷰 렌더링
        // user 정보는 res.locals.user에 있으므로 뷰에서 바로 사용 가능 (주문자 정보 자동입력용)
        res.render('orders/checkout', {
            title: '주문서 작성',
            cartItems: cartItems,
            totalProductPrice,
            deliveryFee,
            finalPrice
        });

    } catch (error) {
        console.error('주문 페이지 오류:', error);
        res.status(500).send('오류가 발생했습니다.');
    }
};

// 주문 생성 처리 (POST /orders)
exports.createOrder = async (req, res) => {
    const userId = req.user.id;
    const { receiver_name, receiver_phone, zipcode, address, detail_address } = req.body;

    const client = await req.db.pool.connect();

    try {
        // 1. 장바구니 데이터 다시 조회 (프론트에서 보낸 금액은 믿을 수 없음)
        const cartQuery = `
            SELECT 
                ci.product_id,
                ci.product_option_id,
                ci.quantity,
                p.price AS base_price,
                po.extra_price,
                po.option_name,
                po.stock_quantity -- 재고 확인용
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

        // 2. 가격 재계산 및 재고 검증
        let totalAmount = 0;
        
        for (const item of cartItems) {
            // 재고 부족 체크
            if (item.stock_quantity < item.quantity) {
                return res.send(`<script>alert("죄송합니다. '${item.option_name}' 옵션의 재고가 부족합니다. (남은수량: ${item.stock_quantity})"); history.back();</script>`);
            }
            totalAmount += (item.base_price + item.extra_price) * item.quantity;
        }

        const deliveryFee = (totalAmount < 100000) ? 3000 : 0;
        const finalAmount = totalAmount + deliveryFee;

        // ==========================
        // ★ 트랜잭션 시작 (BEGIN) ★
        // ==========================
        await client.query('BEGIN');

        // [3] 주문서(Orders) 생성
        const orderQuery = `
            INSERT INTO orders 
            (user_id, total_amount, delivery_fee, final_amount, receiver_name, receiver_phone, zipcode, address, detail_address, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'PAID') -- 무통장이지만 편의상 결제완료(PAID) 처리
            RETURNING id
        `;
        const orderRes = await client.query(orderQuery, [
            userId, totalAmount, deliveryFee, finalAmount,
            receiver_name, receiver_phone, zipcode, address, detail_address
        ]);
        const orderId = orderRes.rows[0].id;

        // [4] 주문 상세(OrderItems) 저장 & 재고 차감
        for (const item of cartItems) {
            const priceSnapshot = item.base_price + item.extra_price;

            // 4-1. 상세 기록 (스냅샷 저장)
            await client.query(
                `INSERT INTO order_items (order_id, product_id, option_snapshot, quantity, price_snapshot)
                VALUES ($1, $2, $3, $4, $5)`,
                [orderId, item.product_id, item.option_name, item.quantity, priceSnapshot]
            );

            // 4-2. 재고 차감 (UPDATE)
            await client.query(
                `UPDATE product_options SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
                [item.quantity, item.product_option_id]
            );
        }

        // [5] 장바구니 비우기
        // carts 테이블의 id를 찾아서 해당 장바구니의 모든 아이템 삭제
        await client.query(
            `DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = $1)`,
            [userId]
        );

        // ==========================
        // ★ 트랜잭션 커밋 (COMMIT) ★
        // ==========================
        await client.query('COMMIT');

        // 주문 완료 페이지로 리다이렉트
        res.redirect(`/orders/complete?id=${orderId}`);

    } catch (error) {
        // 에러 발생 시 롤백 (ROLLBACK)
        await client.query('ROLLBACK');
        console.error('주문 생성 오류:', error);
        res.status(500).send('<script>alert("주문 처리 중 오류가 발생했습니다."); history.back();</script>');
    } finally {
        client.release();
    }
};

// 주문 완료 페이지 (GET /orders/complete)
exports.getOrderComplete = async (req, res) => {
    const orderId = req.query.id;
    // 보안상 내 주문인지 확인하는 로직이 필요하지만, MVP에서는 생략하고 간단히 렌더링
    res.render('orders/complete', { orderId });
};

// 내 주문 내역 조회 (GET /mypage/orders)
exports.getOrderList = async (req, res) => {
    const userId = req.user.id;

    try {
        const query = `
            SELECT * FROM orders 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await req.db.query(query, [userId]);

        res.render('users/mypage-orders', {
            title: '주문 내역',
            orders: result.rows
        });
    } catch (error) {
        console.error('주문 내역 조회 오류:', error);
        res.status(500).send('오류가 발생했습니다.');
    }
};

//  주문 취소 처리 (POST /orders/:id/cancel)
exports.cancelOrder = async (req, res) => {
    const userId = req.user.id;
    const orderId = req.params.id;
    const client = await req.db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. 주문 조회 (내 주문이 맞는지, 취소 가능한 상태인지 확인)
        const orderRes = await client.query(
            `SELECT * FROM orders WHERE id = $1 AND user_id = $2`,
            [orderId, userId]
        );

        if (orderRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).send('<script>alert("주문을 찾을 수 없습니다."); history.back();</script>');
        }

        const order = orderRes.rows[0];
        if (order.status !== 'PENDING' && order.status !== 'PAID') {
            await client.query('ROLLBACK');
            return res.send('<script>alert("이미 배송 준비 중이거나 취소된 주문은 취소할 수 없습니다."); history.back();</script>');
        }

        // 2. 주문 상태 변경 ('CANCELLED')
        await client.query(
            `UPDATE orders SET status = 'CANCELLED' WHERE id = $1`, 
            [orderId]
        );

        // 3. 재고 복구 (중요 logic)
        // 주문했던 상품(order_items)들을 가져와서, 해당 옵션의 재고를 다시 (+) 해줍니다.
        // 주의: order_items에는 option_id가 없으므로 option_snapshot(이름)과 product_id로 찾아야 합니다.
        const itemsRes = await client.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
        const items = itemsRes.rows;

        for (const item of items) {
            // 옵션 이름과 상품 ID로 product_options 테이블의 ID를 찾아서 재고 증가
            await client.query(`
                UPDATE product_options 
                SET stock_quantity = stock_quantity + $1 
                WHERE product_id = $2 AND option_name = $3
            `, [item.quantity, item.product_id, item.option_snapshot]);
        }

        await client.query('COMMIT');
        res.send('<script>alert("주문이 취소되었습니다."); location.href="/mypage/orders";</script>');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('주문 취소 오류:', error);
        res.status(500).send('<script>alert("오류가 발생했습니다."); history.back();</script>');
    } finally {
        client.release();
    }
};