const express = require('express');
const router = express.Router();

const { signup, login, logout, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/dashboard', protect, getProfile);

module.exports = router;
