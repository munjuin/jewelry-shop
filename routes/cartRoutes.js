// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { isAuthenticated } = require('../middlewares/authMiddleware'); // 인증 미들웨어

// 장바구니 담기 (로그인 필수)
router.post('/cart/add', isAuthenticated, cartController.addToCart);
// 장바구니 조회 (로그인 필수)
router.get('/cart', isAuthenticated, cartController.getCartPage);
// 수량 변경 API
router.patch('/api/cart/:itemId', isAuthenticated, cartController.updateCartItem);
// 삭제 API
router.delete('/api/cart/:itemId', isAuthenticated, cartController.deleteCartItem);

module.exports = router;