require("dotenv").config();
require("dotenv").config({ path: require("path").join(__dirname, "chat-bot", ".env") });

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const express = require("express");
const cors= require('cors');
const cookieParser = require('cookie-parser');

const contactRoutes = require('./routes/contact.routes');
const chatRoutes = require('./routes/chatRoutes');
const sendEmail = require('./utils/sendEmail');
const { runFullSync } = require('./services/syncService');
const startupAuthRoutes = require('./routes/startupAuthRoutes');
const dealRoutes = require('./routes/dealRoutes');
const connectDB = require('./config/startupDB');

connectDB();

const app = express();

const allowedFrontendOrigins = (process.env.FRONTEND_URL ||
  'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedFrontendOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/api/contact', contactRoutes);
app.use('/api', chatRoutes);
app.use('/api/auth', startupAuthRoutes);
app.use('/api/deals', dealRoutes);


const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
