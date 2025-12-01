const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');

// routes/index.js 임시 테스트용
const { isAuthenticated } = require('../middlewares/authMiddleware');
router.get('/mypage', isAuthenticated, (req, res) => {
    res.send('여기는 로그인한 사람만 보는 마이페이지입니다.');
});

router.get('/', mainController.getHomePage);



module.exports = router