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