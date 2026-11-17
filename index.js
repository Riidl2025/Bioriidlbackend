require("dotenv").config();

const express = require("express");
const cors = require("cors");

const contactRoutes = require("./routes/contact.routes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

const allowedFrontendOrigins = (process.env.FRONTEND_URL ||
  "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedFrontendOrigins,
  })
);

app.use(express.json());

app.use("/api/contact", contactRoutes);
app.use("/api", chatRoutes);

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
