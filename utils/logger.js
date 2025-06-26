const db = require('../models/db');

const logActivity = (user, action) => {
  const sql = `INSERT INTO activity_logs (user_id, name, role, action) VALUES (?, ?, ?, ?)`;
  db.query(sql, [user.id, user.name, user.role, action], (err) => {
    if (err) {
      console.error('❌ Gagal mencatat aktivitas:', err);
    } else {
      console.log(`📝 Aktivitas: ${user.name} - ${action}`);
    }
  });
};

module.exports = logActivity;
