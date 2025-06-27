// utils/logger.js
const ActivityLog = require('../models/activitylog');

const logActivity = async (user, action) => {
  if (!user || !user.name) return;

  try {
    await ActivityLog.create({
      userId: user.id,
      name: user.name,
      role: user.role,
      action,
    });
    console.log(`📝 Aktivitas: ${user.name} - ${action}`);
  } catch (err) {
    console.error('❌ Gagal mencatat aktivitas:', err);
  }
};

module.exports = logActivity;
