const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const { sendOtpEmail } = require('../services/otpService');
const otpStorage = new Map();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//generating the token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

// Sets the JWT as an httpOnly cookie on the response
const sendTokenCookie = (res, token) => {
  res.cookie("token", token, {
    httpOnly: true, // JS on the frontend can't read/steal this cookie
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax",
    maxAge:  60 * 60 * 1000, // 1 hour in milliseconds

  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    if (password.length < 6) {
      return res.status(409).json({
        message: "Password must be at least 6 characters",
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ message: "User already exists", redirectTo: "/login" });
    }

    const user = await User.create({ name, email, password });

    const token = generateToken(user._id);              
    sendTokenCookie(res, token);                        

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user._id);
    sendTokenCookie(res, token);

    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


// @desc    Authenticate with a Google ID token
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ message: "Missing Google credential" });
    }

    //Verify the Google Token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    //Get User Information eg { email : "..." , name : "..." , sub: googleId}
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;

    //checks if user exists
    let user = await User.findOne({ email });

    //if user does not exist creating user
    if (!user) {
      user = await User.create({ name, email, googleId });
    } 
    //Existing Email but No Google ID-user exists ,did normal signup but now trying to login with google
    else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    //Generate JWT Token
    const token = generateToken(user._id);
    //Store the JWT in Cookies
    sendTokenCookie(res, token);

    //Send User Information to frontend
    return res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return res.status(401).json({ message: "Google authentication failed" });
  }
};

// @desc    Log out user (clears the auth cookie)
// @route   POST /api/auth/logout
// @access  Private
const logout = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0), // instantly expires the cookie
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

// @desc    Get logged-in user's profile
// @route   GET /api/auth/dashboard
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

// @desc    Update user profile (Name & Email)
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ message: "Email is already in use" });
      }
      user.email = email;
    }

    if (name) {
      user.name = name;
    }

    const updatedUser = await user.save();

    return res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Handle forgot password OTP flow and password reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email, otp, step, newPassword } = req.body;

    if (step === 'request') {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User with this email does not exist' });
      }

      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      otpStorage.set(email, generatedOtp);
      
      await sendOtpEmail(email, generatedOtp);
      return res.status(200).json({ message: 'OTP sent successfully' });
    } 
    
    else if (step === 'verify') {
      if (otpStorage.get(email) === otp) {
        return res.status(200).json({ success: true, message: 'OTP verified' });
      } else {
        return res.status(400).json({ success: false, message: 'Invalid OTP' });
      }
    } 
    
    else if (step === 'reset') {
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Assigning plain password. Mongoose schema pre('save') hook will automatically hash it.
      user.password = newPassword;
      await user.save();

      // Clean up OTP from memory storage after successful reset
      otpStorage.delete(email);

      return res.status(200).json({ success: true, message: 'Password updated successfully in database' });
    } 
    
    else {
      return res.status(400).json({ error: 'Invalid step provided' });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: error.message || 'Server error' });
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  logout,
  getProfile,
  updateProfile,
  forgotPassword,
};