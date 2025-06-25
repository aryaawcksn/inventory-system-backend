// server/models/db.js
const mysql = require('mysql2');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'inventory_db',
  port: process.env.DB_PORT || 3306
});

db.connect((err) => {
  if (err) {
    console.error('❌ Gagal koneksi ke database:', err);
  } else {
    console.log('✅ Terhubung ke MySQL (inventory_db)');
  }
});

module.exports = db;
