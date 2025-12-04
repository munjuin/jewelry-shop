// controllers/cartController.js

// 장바구니 담기 (POST /cart/add)
exports.addToCart = async (req, res) => {
    // 1. 로그인 확인 (미들웨어로도 막지만 이중 체크)
    if (!req.user) {
        return res.status(401).send('<script>alert("로그인이 필요합니다."); location.href="/login";</script>');
    }

    const userId = req.user.id;
    const { product_id, product_option_id, quantity } = req.body;
    const qty = parseInt(quantity) || 1;

    const client = await req.db.pool.connect();

    try {
        await client.query('BEGIN');

        // 2. 사용자의 장바구니(Cart)가 있는지 확인하고, 없으면 생성
        let cartRes = await client.query('SELECT id FROM carts WHERE user_id = $1', [userId]);
        let cartId;

        if (cartRes.rows.length === 0) {
            const newCart = await client.query('INSERT INTO carts (user_id) VALUES ($1) RETURNING id', [userId]);
            cartId = newCart.rows[0].id;
        } else {
            cartId = cartRes.rows[0].id;
        }

        // 3. 이미 담긴 상품(동일 옵션)인지 확인
        const itemRes = await client.query(
            `SELECT id FROM cart_items WHERE cart_id = $1 AND product_option_id = $2`,
            [cartId, product_option_id]
        );

        if (itemRes.rows.length > 0) {
            // [CASE A] 이미 있으면 수량 증가 (UPDATE)
            await client.query(
                `UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2`,
                [qty, itemRes.rows[0].id]
            );
        } else {
            // [CASE B] 없으면 새로 추가 (INSERT)
            await client.query(
                `INSERT INTO cart_items (cart_id, product_id, product_option_id, quantity) VALUES ($1, $2, $3, $4)`,
                [cartId, product_id, product_option_id, qty]
            );
        }

        await client.query('COMMIT');
        
        // 4. 성공 후 장바구니 페이지로 이동 볼까요? 아니면 계속 쇼핑할까요?
        // 보통은 confirm 창을 띄웁니다.
        res.send(`
            <script>
                if(confirm("장바구니에 담았습니다. 장바구니로 이동하시겠습니까?")) {
                    location.href = "/cart";
                } else {
                    history.back();
                }
            </script>
        `);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('장바구니 담기 오류:', error);
        res.status(500).send('<script>alert("오류가 발생했습니다."); history.back();</script>');
    } finally {
        client.release();
    }
};

// [추가] 장바구니 페이지 조회 (GET /cart)
exports.getCartPage = async (req, res) => {
    // 1. 로그인 체크 (미들웨어로도 처리되지만 안전장치)
    if (!req.user) {
        return res.redirect('/login');
    }

    const userId = req.user.id;

    try {
        // 2. 장바구니 목록 조회 쿼리 (JOIN의 향연)
        // cart_items를 기준으로 products(이름, 가격), product_options(옵션명, 추가금), product_images(썸네일)을 합칩니다.
        const query = `
            SELECT 
                ci.id AS item_id,
                ci.quantity,
                p.id AS product_id,
                p.name AS product_name,
                p.price AS base_price,
                po.option_name,
                po.extra_price,
                pi.image_url
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            JOIN products p ON ci.product_id = p.id
            JOIN product_options po ON ci.product_option_id = po.id
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = true
            WHERE c.user_id = $1
            ORDER BY ci.created_at DESC
        `;

        const result = await req.db.query(query, [userId]);
        const cartItems = result.rows;

        // 3. 가격 및 배송비 계산 로직 (Backend에서 처리)
        let totalProductPrice = 0; // 총 상품 금액

        // 개별 상품 금액 합산
        cartItems.forEach(item => {
            // 개당 가격 = 기본가 + 옵션추가금
            const unitPrice = item.base_price + item.extra_price;
            // 항목 총액 = 개당 가격 * 수량
            item.total_price = unitPrice * item.quantity;
            
            totalProductPrice += item.total_price;
        });

        // 배송비 정책 적용: 100,000원 이상 무료, 아니면 3,000원
        // 단, 장바구니가 비어있으면 배송비 0원
        let deliveryFee = 0;
        if (cartItems.length > 0 && totalProductPrice < 100000) {
            deliveryFee = 3000;
        }

        // 최종 결제 예정 금액
        const finalPrice = totalProductPrice + deliveryFee;

        // 4. 뷰 렌더링
        res.render('cart/list', {
            title: 'My Cart',
            cartItems: cartItems,
            totalProductPrice: totalProductPrice,
            deliveryFee: deliveryFee,
            finalPrice: finalPrice
        });

    } catch (error) {
        console.error('장바구니 조회 오류:', error);
        res.status(500).send('장바구니를 불러오는 중 오류가 발생했습니다.');
    }
};

// [Helper] 현재 사용자의 장바구니 총액 재계산 함수 (중복 로직 제거용)
const getCartTotals = async (userId, req) => {
    const query = `
        SELECT 
            ci.quantity,
            p.price AS base_price,
            po.extra_price
        FROM cart_items ci
        JOIN carts c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        JOIN product_options po ON ci.product_option_id = po.id
        WHERE c.user_id = $1
    `;
    const result = await req.db.query(query, [userId]);
    
    let totalProductPrice = 0;
    result.rows.forEach(item => {
        totalProductPrice += (item.base_price + item.extra_price) * item.quantity;
    });

    let deliveryFee = (result.rows.length > 0 && totalProductPrice < 100000) ? 3000 : 0;
    
    return {
        totalProductPrice,
        deliveryFee,
        finalPrice: totalProductPrice + deliveryFee,
        itemCount: result.rows.length
    };
};

// [추가] 장바구니 수량 변경 (PATCH /api/cart/:itemId)
exports.updateCartItem = async (req, res) => {
    const userId = req.user.id;
    const itemId = req.params.itemId;
    const { quantity } = req.body;

    if (quantity < 1) {
        return res.status(400).json({ message: '수량은 1개 이상이어야 합니다.' });
    }

    const client = await req.db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. 수량 업데이트
        // (내 장바구니의 아이템인지 확인하는 로직 포함: USING 절 활용)
        const updateQuery = `
            UPDATE cart_items ci
            SET quantity = $1
            FROM carts c
            WHERE ci.cart_id = c.id AND ci.id = $2 AND c.user_id = $3
            RETURNING ci.product_id, ci.product_option_id
        `;
        const result = await client.query(updateQuery, [quantity, itemId, userId]);

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: '항목을 찾을 수 없거나 권한이 없습니다.' });
        }

        // 2. 해당 아이템의 개별 총액 계산 (화면 업데이트용)
        // (상품 기본가 + 옵션가) 정보를 다시 가져옴
        const priceQuery = `
            SELECT (p.price + po.extra_price) as unit_price
            FROM products p, product_options po
            WHERE p.id = $1 AND po.id = $2
        `;
        const priceRes = await client.query(priceQuery, [result.rows[0].product_id, result.rows[0].product_option_id]);
        const unitPrice = priceRes.rows[0].unit_price;
        const itemTotalPrice = unitPrice * quantity;

        await client.query('COMMIT');

        // 3. 전체 총액 재계산
        const totals = await getCartTotals(userId, req);

        // 4. 응답 (아이템별 총액 + 전체 총액 정보)
        res.json({
            message: '수정되었습니다.',
            itemTotalPrice,
            ...totals
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    } finally {
        client.release();
    }
};

// [추가] 장바구니 삭제 (DELETE /api/cart/:itemId)
exports.deleteCartItem = async (req, res) => {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    try {
        // 내 장바구니 항목만 삭제
        const query = `
            DELETE FROM cart_items ci
            USING carts c
            WHERE ci.cart_id = c.id AND ci.id = $1 AND c.user_id = $2
        `;
        const result = await req.db.query(query, [itemId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: '삭제할 항목이 없습니다.' });
        }

        // 전체 총액 재계산
        const totals = await getCartTotals(userId, req);

        res.json({
            message: '삭제되었습니다.',
            ...totals
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: '서버 오류' });
    }
};