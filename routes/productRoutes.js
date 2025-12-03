// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 상품 목록 페이지 (GET /products)
router.get('/products', productController.getProducts);

module.exports = router;