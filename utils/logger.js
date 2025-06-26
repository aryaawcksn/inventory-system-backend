// utils/logger.js (versi MongoDB / Mongoose)
const ActivityLog = require('../models/activitylog'); // pastikan path ini benar

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
