const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const logActivity = require('../utils/logger');

// === GET semua penjualan ===
const getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.status(200).json({ sales });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil penjualan' });
  }
};

// === Tambah penjualan baru + kurangi stok ===
const addSale = async (req, res) => {
  const { date, productId, items, qty, total, status } = req.body;

  if (!productId || !qty) {
    return res.status(400).json({ message: 'Produk dan jumlah wajib diisi' });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Produk tidak ditemukan' });

    if (product.stock < qty) {
      return res.status(400).json({ message: `Stok tidak mencukupi. Tersedia: ${product.stock}` });
    }

    // Kurangi stok
    product.stock -= qty;
    await product.save();

    // Simpan penjualan
    const sale = new Sale({
  date,

  productId, // ⬅️ tambahkan ini
  items,
  qty,
  total,
  status: status || 'completed'
});
    await sale.save();

    res.status(201).json({ message: 'Penjualan berhasil ditambahkan dan stok diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal menambahkan penjualan' });
  }
};

// === EXPORT ke JSON ===
// === EXPORT ke JSON ===
const exportSalesJSON = async (req, res) => {
  try {
    const sales = await Sale.find();
    res.header('Content-Type', 'application/json');
    res.attachment('sales_backup.json');
    res.send(JSON.stringify(sales, null, 2));
  } catch (err) {
    console.error('❌ Gagal export JSON:', err);
    res.status(500).json({ message: 'Gagal export data JSON' });
  }
};

// === IMPORT dari JSON ===
const importSalesJSON = async (req, res) => {
  const userHeader = req.headers['x-user'];
  const user = userHeader ? JSON.parse(userHeader) : null;

  try {
    const salesData = req.body;

    if (!Array.isArray(salesData)) {
      return res.status(400).json({ message: 'Format JSON tidak valid (harus array)' });
    }

    const result = await Sale.insertMany(salesData, { ordered: false })
      .then((inserted) => ({ inserted, errors: [] }))
      .catch((error) => ({
        inserted: error.insertedDocs || [],
        errors: error.writeErrors?.map(err => ({
          index: err.index,
          message: err.err?.errmsg || err.err?.message || 'Data tidak valid'
        })) || []
      }));

    // Catat log jika ada data yang berhasil masuk
    if (user && user.name && user.role && result.inserted.length > 0) {
      await logActivity(user, `Import data penjualan: ${result.inserted.length} transaksi`);
    }

    return res.json({
      message:
        result.errors.length > 0
          ? `⚠️ Import selesai dengan ${result.inserted.length} berhasil, ${result.errors.length} gagal`
          : `${result.inserted.length} transaksi berhasil diimpor`,
      imported: result.inserted.length,
      failed: result.errors.length,
      errors: result.errors,
    });

  } catch (err) {
    console.error('❌ Gagal import JSON:', err);
    return res.status(500).json({ message: 'Terjadi kesalahan saat memproses file JSON' });
  }
};



// === IMPORT dari CSV ===
const importSales = (req, res) => {
  upload(req, res, async function (err) {
    if (err || !req.file) {
      return res.status(400).json({ message: 'Gagal upload file' });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const sales = JSON.parse(data).map((sale) => ({
        date: new Date(sale.date),
        items: sale.items,
        qty: parseInt(sale.qty),
        total: parseFloat(sale.total),
        status: sale.status || 'completed',
      }));

      const inserted = await Sale.insertMany(sales);
      fs.unlinkSync(filePath);

      logActivity(user, `Import data penjualan (JSON): ${inserted.length} entri`);
      res.json({ message: `${inserted.length} transaksi diimpor dari JSON` });
    } catch (error) {
      console.error('❌ Gagal import JSON:', error);
      res.status(500).json({ message: 'Gagal mengimpor data JSON' });
    }
  });
};


// === RESET penjualan ===
const resetSales = async (req, res) => {
  try {
    await Sale.deleteMany({});
    res.status(200).json({ message: '✅ Semua data penjualan berhasil dihapus' });
  } catch (err) {
    const logMessage = `✅ Import sales Berhasil: Added ${inserted}, Updated: ${updated}`;
    await logActivity(user, logMessage); // ✅ Tambahkan log
    res.status(500).json({ message: 'Gagal reset data penjualan' });
  }
};

module.exports = {
  getAllSales,
  addSale,
  exportSalesJSON,
  importSalesJSON,
  resetSales
};
