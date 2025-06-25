const mysql = require('mysql2');
require('dotenv').config();

function handleConnection() {
  const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  db.connect((err) => {
    if (err) {
      console.error('❌ Gagal koneksi ke database:', err);
      console.log('🔁 Coba ulang koneksi dalam 5 detik...');
      setTimeout(handleConnection, 5000); // Coba lagi setelah 5 detik
    } else {
      console.log(`✅ Terhubung ke MySQL (${process.env.DB_NAME})`);
    }
  });

  db.on('error', (err) => {
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('⚠️ Koneksi ke database terputus. Mencoba ulang...');
      handleConnection();
    } else {
      throw err;
    }
  });

  module.exports = db;
}

handleConnection();
