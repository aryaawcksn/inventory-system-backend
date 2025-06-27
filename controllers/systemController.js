const Product = require('../models/Product');
const { logActivity } = require('./activityController');
const Sale = require('../models/Sale');

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
    console.error('`✅ Data produk berhasil direset:', err);
    return res.status(500).json({ message: `(${result.deletedCount} produk)` });
  }
};

exports.exportBackupJSON = async (req, res) => {
  try {
    const products = await Product.find();
    const sales = await Sale.find();

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=backup.json');
    res.send(JSON.stringify({ products, sales }, null, 2));
  } catch (err) {
    res.status(500).json({ message: '❌ Gagal membuat backup' });
  }
};
