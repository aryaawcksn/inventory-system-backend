const Product = require('../models/Product');
const { logActivity } = require('./activityController');

exports.resetAllData = async (req, res) => {
  try {
    const userHeader = req.headers['x-user'];
    const user = userHeader ? JSON.parse(userHeader) : null;

    const result = await Product.deleteMany({});

    // Log hanya jika user valid
    if (user && user.name && user.role) {
      await logActivity(user, `Reset semua data produk (${result.deletedCount} item dihapus)`);
    }

    return res.status(200).json({ message: `✅ Semua data berhasil direset (${result.deletedCount} produk)` });
  } catch (err) {
    console.error('❌ Gagal reset semua data:', err);
    return res.status(500).json({ message: 'Gagal mereset semua data' });
  }
};
