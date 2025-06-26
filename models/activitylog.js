const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user_id: { type: String },
  name: { type: String, required: true },
  role: { type: String, required: true },
  action: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ActivityLog', activitySchema);
