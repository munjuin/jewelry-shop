const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.get('/', mainController.getHomePage);

router.get('/mypage', isAuthenticated, (req, res)=>{
  res.send('여기는 로그인한 사람만 볼수있는 마이페이지임');
})

module.exports = router;