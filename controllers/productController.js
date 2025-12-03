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