// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 회원가입 페이지 보여주기
router.get('/signup', authController.getSignupPage);

// 회원가입 데이터 처리하기
router.post('/signup', authController.signup);

// [AJAX] 이메일 중복 확인 API
router.post('/api/check-email', authController.checkEmail);

// 1. 로그인 페이지 보여주기
router.get('/login', authController.getLoginPage);

// 2. 로그인 처리 (Passport 인증)
router.post('/login', authController.login);

// 3. 로그아웃 처리
router.get('/logout', authController.logout);

module.exports = router;