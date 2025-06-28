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
const generateInvoiceCode = () => {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${Date.now()}`;
};

const addSale = async (req, res) => {
  const { date, productId, items, qty, total, status } = req.body;

  if (!productId || !qty || qty <= 0) {
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
      date: date || Date.now(),
      productId,
      items,
      qty,
      total: total || (product.price * qty),
      invoice: generateInvoiceCode(), // 🟢 Tambahkan invoice di sini
      status: status || 'completed'
    });

    await sale.save();

    res.status(201).json({ message: 'Penjualan berhasil ditambahkan dan stok diperbarui' });
  } catch (err) {
    console.error('❌ Error saat menambahkan penjualan:', err.message);
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
    const rawData = req.body;

    if (!Array.isArray(rawData)) {
      return res.status(400).json({ message: 'Format JSON tidak valid (harus array)' });
    }

    // Bersihkan data
    const cleanedData = rawData.map(({ _id, __v, createdAt, updatedAt, ...rest }) => {
      // Hindari duplikat invoice: jika invoice null atau tidak ada, beri nilai random
      if (!rest.invoice || rest.invoice === null) {
        rest.invoice = `INV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      }

      return rest;
    });
    const inserted = await Sale.insertMany(cleanedData, { ordered: false });
    if (user) {
      await logActivity(user, `Import data penjualan: ${inserted.length} transaksi`);
    }

    res.json({ message: `${inserted.length} transaksi berhasil diimpor` });
  } catch (err) {
    console.error('❌ Gagal import JSON:', err);
    res.status(500).json({ message: 'Gagal import data penjualan' });
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
  const userHeader = req.headers['x-user'];
  const user = userHeader ? JSON.parse(userHeader) : null;

  try {
    const result = await Sale.deleteMany({});

    if (user) {
      await logActivity(user, `Reset semua data penjualan (${result.deletedCount} entri dihapus)`);
    }

    res.status(200).json({ message: `✅ Semua data penjualan berhasil dihapus (${result.deletedCount})` });
  } catch (err) {
    console.error('❌ Gagal reset penjualan:', err);
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
