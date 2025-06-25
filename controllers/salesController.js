const db = require('../models/db');
const { Parser } = require('json2csv');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// === GET semua penjualan ===
const getAllSales = (req, res) => {
  db.query('SELECT * FROM sales', (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil penjualan' });
    res.json({ sales: result });
  });
};

// === Tambah penjualan baru + kurangi stok ===
const addSale = (req, res) => {
  const { date, customer, productId, items, qty, total, status } = req.body;

  if (!productId || !qty) {
    return res.status(400).json({ message: 'Produk dan jumlah wajib diisi' });
  }

  // Step 0: Cek stok
  const checkStockSql = 'SELECT stock FROM products WHERE id = ?';
  db.query(checkStockSql, [productId], (checkErr, checkResult) => {
    if (checkErr || checkResult.length === 0) {
      return res.status(400).json({ message: 'Produk tidak ditemukan' });
    }

    const currentStock = checkResult[0].stock;
    if (qty > currentStock) {
      return res.status(400).json({ message: `Stok tidak mencukupi. Tersedia: ${currentStock}` });
    }

    // Step 1: Simpan penjualan
    const insertSql = `
      INSERT INTO sales (date, customer, items, qty, total, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    db.query(insertSql, [date, customer, items, qty, total, status || 'completed'], (err, result) => {
      if (err) return res.status(500).json({ message: 'Gagal menambahkan penjualan' });

      // Step 2: Update stok produk
      const updateStockSql = 'UPDATE products SET stock = stock - ? WHERE id = ?';
      db.query(updateStockSql, [qty, productId], (updateErr) => {
        if (updateErr) {
          return res.status(500).json({ message: 'Penjualan berhasil, tapi gagal update stok' });
        }
        res.status(201).json({ message: 'Penjualan berhasil ditambahkan dan stok diperbarui' });
      });
    });
  });
};

// === EXPORT ke CSV ===
const exportSales = (req, res) => {
  db.query('SELECT * FROM sales', (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal ambil data' });

    const fields = ['id', 'date', 'customer', 'items', 'qty', 'total', 'status'];
    const parser = new Parser({ fields });
    const csvData = parser.parse(results);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales_export.csv');
    res.send(csvData);
  });
};

// === IMPORT dari CSV ===
const upload = multer({ dest: 'uploads/' }).single('file');

const importSales = (req, res) => {
  upload(req, res, function (err) {
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
          salesData.push([date, customer, items, parseInt(qty), parseFloat(total), status || 'completed']);
        }
      })
      .on('end', () => {
        const sql = `INSERT INTO sales (date, customer, items, qty, total, status) VALUES ?`;
        db.query(sql, [salesData], (err, result) => {
          fs.unlinkSync(filePath); // hapus file setelah selesai

          if (err) {
            console.error('❌ Gagal import:', err);
            return res.status(500).json({ message: 'Gagal import ke database' });
          }

          res.status(200).json({ message: `✅ Berhasil import ${result.affectedRows} transaksi` });
        });
      })
      .on('error', (err) => {
        console.error('❌ Gagal parsing CSV:', err);
        res.status(500).json({ message: 'Gagal parsing CSV' });
      });
  });
};

// === RESET penjualan ===
const resetSales = (req, res) => {
  db.query('DELETE FROM sales', (err) => {
    if (err) return res.status(500).json({ message: 'Gagal reset data penjualan' });
    res.json({ message: '🧹 Semua data penjualan berhasil dihapus' });
  });
};

// === Export semua handler ===
module.exports = {
  getAllSales,
  addSale,
  exportSales,
  importSales,
  resetSales
};
