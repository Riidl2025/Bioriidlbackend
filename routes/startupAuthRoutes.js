const express = require('express');
const router = express.Router();
const startupAuthController = require('../controllers/startupAuthController');
const { signup, login, googleLogin, logout, getProfile, updateProfile } = require('../controllers/startupAuthController');
const { protect } = require('../middleware/startupAuthMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/forgot-password', startupAuthController.forgotPassword);
router.post('/logout', protect, logout);
router.post('/google', googleLogin);

router.get('/dashboard', protect, getProfile);

router.put('/dashboard', protect, updateProfile);

module.exports = router;