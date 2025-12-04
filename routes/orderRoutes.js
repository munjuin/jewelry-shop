// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// 주문서 작성 페이지
router.get('/checkout', isAuthenticated, orderController.getCheckoutPage);

// 주문 생성 처리 (POST)
router.post('/orders', isAuthenticated, orderController.createOrder);

// 주문 완료 페이지 (GET)
router.get('/orders/complete', isAuthenticated, orderController.getOrderComplete);

module.exports = router;