const mongoose = require('mongoose');

const ClaimLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  startupName: { type: String, required: true },
  dealName: { type: String, required: true },
  redirectUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ClaimLog', ClaimLogSchema);
