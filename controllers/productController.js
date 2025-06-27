const Product = require('../models/Product');
// controllers/productController.js
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const { logActivity } = require('./activityController');

// === MIDDLEWARE UNTUK IMPORT ===
const upload = multer({ dest: 'uploads/' }).single('file');

// GET semua produk
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json({ products });
  } catch (err) {
    console.error('Gagal mengambil produk:', err);
    res.status(500).json({ message: 'Gagal mengambil data produk' });
  }
};

// POST produk baru (atau update stok jika SKU sudah ada)
exports.addProduct = async (req, res) => {
  const { name, sku, stock, price, status } = req.body;
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  if (!name || !sku || stock == null || price == null) {
    return res.status(400).json({ message: 'Lengkapi semua data produk' });
  }

  try {
    const existing = await Product.findOne({ sku });

    if (existing) {
      existing.stock += parseInt(stock);
      await existing.save();
      logActivity(user, `Menambah stok untuk SKU ${sku}: +${stock} (Total: ${existing.stock})`);
      return res.status(200).json({ message: 'Stok produk berhasil diperbarui' });
    } else {
      const newProduct = new Product({ name, sku, stock, price, status: status || 'active' });
      await newProduct.save();
      logActivity(user, `Menambahkan produk baru: ${name} (SKU: ${sku})`);
      return res.status(201).json({ message: 'Produk berhasil ditambahkan' });
    }
  } catch (err) {
    console.error('Gagal tambah/update produk:', err);
    res.status(500).json({ message: 'Gagal menambahkan atau memperbarui produk' });
  }
};

// PUT edit produk
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, stock, price, sku, status } = req.body;
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  try {
    const updated = await Product.findByIdAndUpdate(id, {
      name, stock, price, sku, status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    logActivity(user, `Mengedit produk: ${name} (SKU: ${sku})`);
    res.json({ message: 'Produk berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal update produk:', err);
    res.status(500).json({ message: 'Gagal update produk' });
  }
};

// DELETE produk
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    logActivity(user, `Menghapus produk: ${deleted.name} (SKU: ${deleted.sku})`);
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Gagal hapus produk:', err);
    res.status(500).json({ message: 'Gagal menghapus produk' });
  }
};

// IMPORT produk dari CSV
exports.importProductJSON = async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  try {
    const productsData = req.body;

    if (!Array.isArray(productsData)) {
      return res.status(400).json({ message: 'Format JSON tidak valid (harus array produk)' });
    }

    const inserted = await Product.insertMany(productsData, { ordered: false });

    // ✅ Catat aktivitas
    if (user) {
      await logActivity(user, `Import data produk: ${inserted.length} produk berhasil ditambahkan`);
    }

    res.json({ message: `${inserted.length} produk berhasil diimpor` });
  } catch (err) {
    console.error('❌ Gagal import produk JSON:', err);

    // ❗ Jika error karena duplikat (kode 11000)
    if (err.code === 11000 || err.writeErrors) {
      const insertedCount = err.result?.result?.nInserted || 0;

      // ✅ Catat aktivitas meskipun sebagian gagal
      if (user) {
        await logActivity(user, `Import produk sebagian berhasil: ${insertedCount} ditambahkan`);
      }

      return res.status(400).json({
        message: `Sebagian gagal impor karena duplikat atau format salah. ${insertedCount} produk berhasil ditambahkan.`,
      });
    }

    res.status(500).json({ message: 'Gagal mengimpor produk' });
  }
};

// EXPORT produk ke CSV
exports.exportProductJSON = async (req, res) => {
  try {
    const products = await Product.find();
    res.header('Content-Type', 'application/json');
    res.attachment('products_backup.json');
    res.send(JSON.stringify(products, null, 2));
  } catch (err) {
    console.error('❌ Gagal export produk JSON:', err);
    res.status(500).json({ message: 'Gagal export data produk' });
  }
};


// RESET semua produk
exports.resetProducts = async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;
  try {
    const result = await Product.deleteMany();
    logActivity(user, `Reset semua produk (${result.deletedCount} data dihapus)`);
    res.json({ message: `✅ Semua produk berhasil dihapus (${result.deletedCount} produk)` });
  } catch (err) {
    console.error('❌ Gagal reset:', err);
    res.status(500).json({ message: 'Gagal reset produk' });
  }
};
