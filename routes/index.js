const express = require('express');
const router = express();
const mainController = require('../controllers/mainController');

router.get('/', mainController.getHomePage);

module.exports = router