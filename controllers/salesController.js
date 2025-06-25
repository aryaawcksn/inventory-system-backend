const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

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
  const { date, customer, productId, items, qty, total, status } = req.body;

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
      customer,
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

// === EXPORT ke CSV ===
const exportSales = async (req, res) => {
  try {
    const sales = await Sale.find();
    const fields = ['_id', 'date', 'customer', 'items', 'qty', 'total', 'status'];
    const parser = new Parser({ fields });
    const csvData = parser.parse(sales);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales_export.csv');
    res.send(csvData);
  } catch (err) {
    res.status(500).json({ message: 'Gagal export data' });
  }
};

// === IMPORT dari CSV ===
const upload = multer({ dest: 'uploads/' }).single('file');

const importSales = (req, res) => {
  upload(req, res, async function (err) {
    if (err || !req.file) {
      return res.status(400).json({ message: 'Gagal upload file' });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const salesData = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const { date, customer, items, qty, total, status } = row;
        if (date && customer && items && qty && total) {
          salesData.push({
            date,
            customer,
            items,
            qty: parseInt(qty),
            total: parseFloat(total),
            status: status || 'completed',
          });
        }
      })
      .on('end', async () => {
        try {
          await Sale.insertMany(salesData);
          fs.unlinkSync(filePath);
          res.status(200).json({ message: `✅ Berhasil import ${salesData.length} transaksi` });
        } catch (error) {
          res.status(500).json({ message: 'Gagal import ke database' });
        }
      })
      .on('error', (error) => {
        console.error('❌ Gagal parsing CSV:', error);
        res.status(500).json({ message: 'Gagal parsing CSV' });
      });
  });
};

// === RESET penjualan ===
const resetSales = async (req, res) => {
  try {
    await Sale.deleteMany({});
    res.status(200).json({ message: '🧹 Semua data penjualan berhasil dihapus' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal reset data penjualan' });
  }
};

module.exports = {
  getAllSales,
  addSale,
  exportSales,
  importSales,
  resetSales
};
