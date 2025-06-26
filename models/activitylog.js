const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  userId: String,
  name: String,
  role: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ActivityLog', activityLogSchema);
