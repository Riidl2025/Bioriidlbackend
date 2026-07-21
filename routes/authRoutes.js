const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { signup, login, logout, getProfile, updateProfile, forgotPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/logout', protect, logout);
router.get('/dashboard', protect, getProfile);

router.put('/dashboard', protect, updateProfile);

module.exports = router;