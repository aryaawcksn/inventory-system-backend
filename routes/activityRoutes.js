// routes/activityRoutes.js
const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/activitylog');

// Tambah log aktivitas (POST)
router.post('/', async (req, res) => {
  try {
    const { name, role, action } = req.body;

    const newLog = new ActivityLog({ name, role, action });
    const savedLog = await newLog.save();

    res.status(201).json({ message: 'Log berhasil ditambahkan', log: savedLog });
  } catch (err) {
    console.error('Gagal tambah log:', err);
    res.status(500).json({ message: 'Terjadi kesalahan saat menyimpan log' });
  }
});

// Ambil semua log (GET)
router.get('/', async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    res.json({ logs });
  } catch (err) {
    res.status(500).json({ message: 'Gagal ambil log aktivitas' });
  }
});

module.exports = router;
