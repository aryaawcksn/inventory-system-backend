const ActivityLog = require('../models/activitylog');


exports.getAllLogs = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 });
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil log aktivitas' });
  }
};

exports.addLog = async (req, res) => {
  try {
    const { user_id, name, role, action } = req.body;
    const log = new ActivityLog({ user_id, name, role, action });
    await log.save();
    res.status(201).json({ message: 'Log berhasil ditambahkan', log });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan log' });
  }
};
