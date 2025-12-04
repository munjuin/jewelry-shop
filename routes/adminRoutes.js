// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const upload = require('../config/multer'); // 작성한 S3 Multer 설정

// 미들웨어: 관리자 권한 확인 (나중에 authMiddleware의 isAdmin 추가 권장)
// router.use(authMiddleware.isAdmin); 

// 상품 등록 폼 (GET)
router.get('/products/new', adminController.getProductForm);

// 상품 등록 처리 (POST)
// 'images'는 html input의 name 속성값, 10은 최대 파일 개수
router.post('/products', upload.array('images', 10), adminController.createProduct);

// 전체 주문 관리 페이지
router.get('/orders', adminController.getOrders);

// 주문 상태 변경 처리
router.post('/orders/:id/status', adminController.updateOrderStatus);

// 관리자 상품 목록
router.get('/products', adminController.getAdminProducts);

// 상품 수정 폼 및 처리
router.get('/products/:id/edit', adminController.getEditProductForm);
router.post('/products/:id/update', adminController.updateProduct);

// 상품 삭제 처리
router.post('/products/:id/delete', adminController.deleteProduct);

module.exports = router;