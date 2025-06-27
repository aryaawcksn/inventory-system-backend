const Product = require('../models/Product');
const mongoose = require('mongoose');
const logActivity = require('../utils/logger');
 // pastikan path-nya benar
 // pastikan path ini benar

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

      await logActivity(user, `Menambahkan stok produk: ${existing.name} (SKU: ${existing.sku}) sebanyak ${stock}`);
      return res.status(200).json({ message: 'Stok produk berhasil diperbarui' });
    } else {
      const newProduct = new Product({ name, sku, stock, price, status: status || 'active' });
      await newProduct.save();

      await logActivity(user, `Menambahkan produk baru: ${name} (SKU: ${sku})`);
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

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID tidak valid' });
  }

  try {
    const updated = await Product.findByIdAndUpdate(id, {
      name, stock, price, sku, status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    await logActivity(user, `Memperbarui produk: ${name} (SKU: ${sku})`);
    res.json({ message: 'Produk berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal update produk:', err);
    res.status(500).json({ message: 'Gagal update produk' });
  }
};



// DELETE produk
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  console.log('🟡 ID yang diterima untuk delete:', id);
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID tidak valid' });
  }

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

// DELETE semua produk
exports.resetProducts = async (req, res) => {
  const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

  try {
    const deleted = await Product.deleteMany({});
    logActivity(user, `Mereset semua data produk (${deleted.deletedCount} produk dihapus)`);

    res.json({ message: 'Semua data produk berhasil direset' });
  } catch (err) {
    console.error('Gagal reset produk:', err);
    res.status(500).json({ message: 'Gagal mereset produk' });
  }
};

// controllers/productController.js
exports.exportProductsJSON = async (req, res) => {
  try {
    const products = await Product.find().lean();
    const jsonData = JSON.stringify(products, null, 2);

    res.setHeader('Content-Disposition', 'attachment; filename="produk.json"');
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonData);
  } catch (err) {
    console.error('Gagal export produk:', err);
    res.status(500).json({ message: 'Gagal export produk' });
  }
};

// POST import produk dari file JSON
exports.importProducts = async (req, res) => {
  try {
    const products = req.body;

    if (!Array.isArray(products)) {
      return res.status(400).json({ message: 'Format data tidak valid (harus array).' });
    }

    let inserted = 0;
    let updated = 0;

    for (const p of products) {
      if (!p.sku || !p.name) continue;

      const existing = await Product.findOne({ sku: p.sku });
      if (existing) {
        await Product.updateOne({ sku: p.sku }, p);
        updated++;
      } else {
        await Product.create(p);
        inserted++;
      }
    }

    res.json({ message: `Import selesai. Ditambahkan: ${inserted}, Diperbarui: ${updated}` });
  } catch (err) {
    console.error('Gagal import produk:', err);
    res.status(500).json({ message: 'Gagal import data produk' });
  }
};




