const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  family: 4,    
  auth: {
    user: process.env.EMAIL_ADDRESS,
    pass: process.env.EMAIL_PASSWORD,
  },
  // Adding a timeout setting to help with slow network connections
  connectionTimeout: 10000, 
});

const sendOtpEmail = async (email, otp) => {
  try {
    return await transporter.sendMail({
      from: `"Member Hub" <${process.env.EMAIL_ADDRESS}>`,
      to: email,
      subject: 'Your OTP Verification Code',
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    });
  } catch (error) {
    console.error("Nodemailer Internal Error:", error);
    throw error;
  }
};

module.exports = { sendOtpEmail };