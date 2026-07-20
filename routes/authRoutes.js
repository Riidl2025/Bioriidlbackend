const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/forgot-password', authController.forgotPassword);

module.exports = router;