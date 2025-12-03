// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 상품 목록 페이지 (GET /products)
router.get('/products', productController.getProducts);

// [추가] 상세 조회 (순서 중요: 목록 조회보다 아래에!)
router.get('/products/:id', productController.getProductDetail);

module.exports = router;