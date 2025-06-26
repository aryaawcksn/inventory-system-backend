const Product = require('../models/Product');
const { logActivity } = require('./activityController');

exports.resetAllData = async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  try {
    const result = await Product.deleteMany({});
    logActivity(user, `Reset semua data produk (${result.deletedCount} item dihapus)`);
    
    res.json({ message: `✅ Semua data berhasil direset (${result.deletedCount} produk)` });
  } catch (err) {
    console.error('❌ Gagal reset data:', err);
    res.status(500).json({ message: 'Gagal mereset semua data' });
  }
};
