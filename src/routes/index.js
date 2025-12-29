const express = require('express');
const router = express.Router();
const mainController = require('../controllers/mainController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

router.get('/', mainController.getHomePage);

module.exports = router;