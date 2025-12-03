const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isNotAuthenticated } = require('../middlewares/authMiddleware');

// 회원가입 페이지 보여주기
router.get('/signup', isNotAuthenticated, authController.getSignupPage);

// 회원가입 데이터 처리하기
router.post('/signup', isNotAuthenticated, authController.signup);

// [AJAX] 이메일 중복 확인 API
router.post('/api/check-email', isNotAuthenticated, authController.checkEmail);

// 로그인 페이지 보여주기
router.get('/login', isNotAuthenticated, authController.getLoginPage);

// 로그인 처리 (Passport 인증)
router.post('/login', isNotAuthenticated, authController.login);

// 로그아웃 처리
router.get('/logout', isAuthenticated,authController.logout);


module.exports = router;