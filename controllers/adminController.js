// controllers/adminController.js

// 1. 상품 등록 페이지 렌더링 (GET)
exports.getProductForm = (req, res) => {
    res.render('admin/product-new', { title: '상품 등록' });
};

// 2. 상품 등록 처리 (POST)
exports.createProduct = async (req, res) => {
    // 트랜잭션을 위해 커넥션 풀에서 클라이언트 하나를 빌려옵니다.
    const client = await req.db.pool.connect();

    try {
        const { name, price, description, category, option_name, extra_price, stock_quantity } = req.body;
        const files = req.files; // S3 업로드 완료된 파일 정보들

        // [트랜잭션 시작]
        await client.query('BEGIN');

        // [1] 상품 기본 정보 저장
        const productQuery = `
            INSERT INTO products (name, price, description, category)
            VALUES ($1, $2, $3, $4) RETURNING id
        `;
        const productResult = await client.query(productQuery, [name, price, description, category]);
        const productId = productResult.rows[0].id;

        // [2] 이미지 정보 저장 (S3 URL 사용)
        if (files && files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                // ★ 중요: S3 업로드 시 파일 경로는 file.location에 있습니다.
                const imageUrl = files[i].location; 
                const isThumbnail = (i === 0); // 첫 번째 이미지를 대표 이미지로 설정
                
                await client.query(
                    `INSERT INTO product_images (product_id, image_url, is_thumbnail) VALUES ($1, $2, $3)`,
                    [productId, imageUrl, isThumbnail]
                );
            }
        }

        // [3] 옵션 정보 저장
        // 옵션이 1개면 문자열, 여러 개면 배열로 들어오므로 배열로 통일해줍니다.
        const optionNames = Array.isArray(option_name) ? option_name : (option_name ? [option_name] : []);
        const extraPrices = Array.isArray(extra_price) ? extra_price : (extra_price ? [extra_price] : []);
        const stocks = Array.isArray(stock_quantity) ? stock_quantity : (stock_quantity ? [stock_quantity] : []);

        if (optionNames.length > 0) {
            for (let i = 0; i < optionNames.length; i++) {
                if (!optionNames[i]) continue; // 빈 값 방지
                
                await client.query(
                    `INSERT INTO product_options (product_id, option_name, extra_price, stock_quantity) VALUES ($1, $2, $3, $4)`,
                    [productId, optionNames[i], extraPrices[i] || 0, stocks[i] || 0]
                );
            }
        }

        // [트랜잭션 커밋]
        await client.query('COMMIT');
        
        res.send('<script>alert("상품이 성공적으로 등록되었습니다!"); location.href="/";</script>');

    } catch (error) {
        // [에러 발생 시 롤백]
        await client.query('ROLLBACK');
        console.error('상품 등록 오류:', error);
        res.status(500).send('<script>alert("등록 중 오류가 발생했습니다."); history.back();</script>');
    } finally {
        // [연결 반납]
        client.release();
    }
};

// 관리자 주문 목록 조회 (GET /admin/orders)
exports.getOrders = async (req, res) => {
    try {
        // 모든 주문을 최신순으로 조회 (사용자 정보 포함)
        const query = `
            SELECT o.*, u.email, u.name AS user_name 
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `;
        const result = await req.db.query(query);

        res.render('admin/order-list', {
            title: '주문 관리',
            orders: result.rows
        });
    } catch (error) {
        console.error('관리자 주문 조회 오류:', error);
        res.status(500).send('서버 오류');
    }
};

// 주문 상태 및 송장번호 업데이트 (POST /admin/orders/:id/status)
exports.updateOrderStatus = async (req, res) => {
    const orderId = req.params.id;
    const { status, courier, tracking_number } = req.body;

    try {
        // 상태, 택배사, 송장번호 업데이트
        const query = `
            UPDATE orders 
            SET status = $1, courier = $2, tracking_number = $3
            WHERE id = $4
        `;
        await req.db.query(query, [status, courier, tracking_number, orderId]);

        res.send('<script>alert("주문 상태가 수정되었습니다."); location.href="/admin/orders";</script>');
    } catch (error) {
        console.error('주문 상태 변경 오류:', error);
        res.status(500).send('<script>alert("오류가 발생했습니다."); history.back();</script>');
    }
};