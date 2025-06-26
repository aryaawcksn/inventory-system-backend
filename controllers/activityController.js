const ActivityLog = require('../models/activitylog');

exports.getLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas' });
  }
};

exports.logActivity = async (user, action) => {
  try {
    await ActivityLog.create({
      userId: user.id,
      name: user.name,
      role: user.role,
      action,
    });
  } catch (err) {
    console.error('❌ Gagal menyimpan log aktivitas:', err.message);
  }
};
