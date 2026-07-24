const express = require('express');
const router = express.Router();
const ClaimLog = require('../models/ClaimLog'); 
const { protect } = require('../middleware/startupAuthMiddleware');

router.post('/claim', protect, async (req, res) => {
  try {
    const { startupName, dealName, redirectUrl } = req.body;
    const user = req.user;

    await ClaimLog.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      startupName,
      dealName,
      redirectUrl,
      timestamp: new Date()
    });

    res.status(200).json({ success: true, message: 'Claim logged successfully' });
  } catch (error) {
    console.error('Error logging claim:', error);
    res.status(500).json({ success: false, message: 'Server error logging claim' });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const claims = await ClaimLog.find({ userId: req.user._id }).sort({ timestamp: -1 });
    res.status(200).json({ success: true, claims });
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({ success: false, message: 'Server error fetching claims' });
  }
});

router.delete('/my/:claimId', protect, async (req, res) => {
  try {
    const { claimId } = req.params;
    const userId = req.user._id;

    const claim = await ClaimLog.findOneAndDelete({
      _id: claimId,
      userId: userId
    });

    if (!claim) {
      return res.status(404).json({ 
        success: false, 
        message: 'Perk not found or you do not have permission to delete it' 
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Perk deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting claim:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error deleting claim' 
    });
  }
});

module.exports = router;