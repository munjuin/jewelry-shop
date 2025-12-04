// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

// 주문서 작성 페이지
router.get('/checkout', isAuthenticated, orderController.getCheckoutPage);

module.exports = router;