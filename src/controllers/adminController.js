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

// 관리자 상품 목록 조회 (GET /admin/products)
exports.getAdminProducts = async (req, res) => {
    try {
        const query = `
            SELECT p.*, count(pi.id) as image_count 
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `;
        const result = await req.db.query(query);

        res.render('admin/product-list', {
            title: '상품 관리',
            products: result.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
};

// 상품 수정 페이지 렌더링 (GET /admin/products/:id/edit)
exports.getEditProductForm = async (req, res) => {
    const productId = req.params.id;
    try {
        const productRes = await req.db.query('SELECT * FROM products WHERE id = $1', [productId]);
        if (productRes.rows.length === 0) return res.status(404).send('상품 없음');

        res.render('admin/product-edit', {
            title: '상품 수정',
            product: productRes.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('서버 오류');
    }
};

// 상품 수정 처리 (POST /admin/products/:id/update)
exports.updateProduct = async (req, res) => {
    const productId = req.params.id;
    const { name, price, description, category, status } = req.body;

    try {
        // 이미지와 옵션 수정은 로직이 복잡하므로, 이번 단계에선 '기본 정보'와 '판매 상태'만 수정합니다.
        const query = `
            UPDATE products 
            SET name = $1, price = $2, description = $3, category = $4, status = $5
            WHERE id = $6
        `;
        await req.db.query(query, [name, price, description, category, status, productId]);

        res.send('<script>alert("상품 정보가 수정되었습니다."); location.href="/admin/products";</script>');
    } catch (error) {
        console.error('상품 수정 오류:', error);
        res.status(500).send('<script>alert("수정 중 오류 발생"); history.back();</script>');
    }
};

// 상품 삭제 처리 (POST /admin/products/:id/delete)
exports.deleteProduct = async (req, res) => {
    const productId = req.params.id;
    try {
        // ON DELETE CASCADE 덕분에 products 테이블에서만 지우면
        // 연관된 options, images, cart_items가 모두 자동 삭제됩니다.
        await req.db.query('DELETE FROM products WHERE id = $1', [productId]);
        
        res.send('<script>alert("상품이 삭제되었습니다."); location.href="/admin/products";</script>');
    } catch (error) {
        console.error('상품 삭제 오류:', error);
        res.status(500).send('<script>alert("삭제 중 오류 발생"); history.back();</script>');
    }
};