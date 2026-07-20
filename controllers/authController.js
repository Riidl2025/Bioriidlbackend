const { sendOtpEmail } = require('../services/otpService');
const otpStorage = new Map();

exports.forgotPassword = async (req, res) => {
  const { email, otp, step } = req.body;

  if (step === 'request') {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStorage.set(email, generatedOtp);
    try {
      await sendOtpEmail(email, generatedOtp);
      res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ error: 'Failed to send OTP' });
    }
  } 
  
  else if (step === 'verify') {
    if (otpStorage.get(email) === otp) {
      otpStorage.delete(email);
      res.status(200).json({ success: true, message: 'OTP verified' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
  } 
  
  else {
    res.status(400).json({ error: 'Invalid step provided' });
  }
};