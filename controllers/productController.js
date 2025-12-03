// controllers/productController.js

exports.getProducts = async (req, res) => {
    try {
        // 1. 쿼리 파라미터 처리 (페이지, 카테고리)
        const page = parseInt(req.query.page) || 1;
        const category = req.query.category || 'all';
        const limit = 12; // 한 페이지당 12개
        const offset = (page - 1) * limit;

        // 2. SQL 조건문 동적 생성
        let whereClause = '';
        let queryParams = [];
        
        if (category !== 'all') {
            whereClause = 'WHERE p.category = $1';
            queryParams.push(category);
        }

        // 3. 상품 목록 조회 쿼리 (대표 이미지 포함)
        // LEFT JOIN을 써서 이미지가 없더라도 상품은 나오게 함
        // pi.is_thumbnail = true 조건으로 대표 이미지만 가져옴
        const listQuery = `
            SELECT p.*, pi.image_url 
            FROM products p
            LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_thumbnail = true
            ${whereClause}
            ORDER BY p.created_at DESC
            LIMIT ${limit} OFFSET ${offset}
        `;
        
        const productsResult = await req.db.query(listQuery, queryParams);

        // 4. 전체 상품 수 조회 (페이지네이션 계산용)
        const countQuery = `SELECT COUNT(*) FROM products p ${whereClause}`;
        const countResult = await req.db.query(countQuery, queryParams);
        const totalItems = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(totalItems / limit);

        // 5. 뷰 렌더링
        res.render('products/list', { 
            title: 'Shop',
            products: productsResult.rows,
            currentPage: page,
            totalPages: totalPages,
            currentCategory: category
        });

    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};

exports.getProductDetail = async (req, res) => {
    try {
        const productId = req.params.id;

        // 1. 상품 기본 정보 + 이미지 조회
        // (대표 이미지뿐만 아니라 모든 이미지를 가져와야 함)
        const productQuery = `SELECT * FROM products WHERE id = $1`;
        const productResult = await req.db.query(productQuery, [productId]);
        const product = productResult.rows[0];

        if (!product) {
            return res.status(404).send('상품을 찾을 수 없습니다.');
        }

        // 2. 관련 이미지 조회
        const imagesQuery = `SELECT * FROM product_images WHERE product_id = $1 ORDER BY id ASC`;
        const imagesResult = await req.db.query(imagesQuery, [productId]);

        // 3. 관련 옵션 조회 (재고 있는 것만 보여주거나, 품절 표시 로직 가능)
        const optionsQuery = `SELECT * FROM product_options WHERE product_id = $1 ORDER BY id ASC`;
        const optionsResult = await req.db.query(optionsQuery, [productId]);
        // 4. 뷰 렌더링
        res.render('products/detail', {
            title: product.name,
            product: product,
            images: imagesResult.rows,
            options: optionsResult.rows
        });

    } catch (error) {
        console.error('상품 상세 조회 오류:', error);
        res.status(500).send('서버 오류가 발생했습니다.');
    }
};