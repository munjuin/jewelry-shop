// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// 미들웨어 불러오기
const { isAuthenticated, isNotAuthenticated } = require('../middlewares/authMiddleware');

// --- 회원가입 관련 ---
// (이미 로그인한 사람은 회원가입 페이지 접근 차단)
router.get('/signup', isNotAuthenticated, authController.getSignupPage);
router.post('/signup', isNotAuthenticated, authController.signup);
router.post('/api/check-email', authController.checkEmail); // API는 유연하게 둠

// --- 로그인/로그아웃 관련 ---
// (이미 로그인한 사람은 로그인 페이지 접근 차단)
router.get('/login', isNotAuthenticated, authController.getLoginPage);
router.post('/login', isNotAuthenticated, authController.login);

// (로그인한 사람만 로그아웃 가능)
router.get('/logout', isAuthenticated, authController.logout);

module.exports = router;