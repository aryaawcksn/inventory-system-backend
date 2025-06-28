const ActivityLog = require('../models/activitylog');

const logActivity = async (user, action) => {
  if (!user || !action) return;

  try {
    await ActivityLog.create({
      user_id: user._id,
      name: user.name,
      role: user.role,
      action,
    });
  } catch (err) {
    console.error('❌ Gagal mencatat log aktivitas:', err.message);
  }
};

module.exports = logActivity;
