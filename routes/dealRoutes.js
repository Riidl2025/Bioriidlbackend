
const express = require('express');
const router = express.Router();
const ClaimLog = require('../models/ClaimLog'); // Create a Mongoose schema for this
const { protect } = require('../middleware/authMiddleware');

router.post('/claim', protect, async (req, res) => {
  try {
    const { startupName, dealName, redirectUrl } = req.body;
    const user = req.user;
    
    await ClaimLog.create({
      userName: user.name,
      email: user.email,
      startupName,
      dealName,
      redirectUrl,
      timestamp: new Date()
    });

    res.status(200).json({ success: true, message: 'Claim logged successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error logging claim' });
  }
});

module.exports = router;