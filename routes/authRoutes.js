const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const authController = require('../controllers/authController');

router.post('/forgot-password', authController.forgotPassword);

module.exports = router;
=======

const { signup, login, logout, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/dashboard', protect, getProfile);

module.exports = router;
>>>>>>> fc65d1a8361a07452df2e8dd92364caa01abc788
