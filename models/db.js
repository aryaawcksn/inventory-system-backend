// models/db.js
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', (err) => {
  console.error('❌ Gagal koneksi ke MongoDB:', err);
});

db.once('open', () => {
  console.log('✅ Terhubung ke MongoDB');
});

module.exports = db;
