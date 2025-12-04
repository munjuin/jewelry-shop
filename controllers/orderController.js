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