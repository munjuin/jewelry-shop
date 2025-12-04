// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../config/multer'); // 작성한 S3 Multer 설정

// 미들웨어: 관리자 권한 확인 (나중에 authMiddleware의 isAdmin 추가 권장)
// router.use(authMiddleware.isAdmin); 

// 1. 상품 등록 폼 (GET)
router.get('/products/new', adminController.getProductForm);

// 2. 상품 등록 처리 (POST)
// 'images'는 html input의 name 속성값, 10은 최대 파일 개수
router.post('/products', upload.array('images', 10), adminController.createProduct);

// [추가] 전체 주문 관리 페이지
router.get('/orders', adminController.getOrders);

// [추가] 주문 상태 변경 처리
router.post('/orders/:id/status', adminController.updateOrderStatus);

module.exports = router;