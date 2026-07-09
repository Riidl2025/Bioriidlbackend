// aiconfig.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const { OpenAI } = require('openai');

if (!process.env.OPENAI_API_KEY) {
  throw new Error("❌ OPENAI_API_KEY missing — check your .env file");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = openai;