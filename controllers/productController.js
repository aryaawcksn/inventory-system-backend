const Product = require('../models/Product');
// controllers/productController.js
const logActivity = require('../utils/logger');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');

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
exports.importProducts = (req, res) => {
  upload(req, res, async function (err) {
    if (err || !req.file) {
      return res.status(400).json({ message: 'Gagal upload file' });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const products = [];
    const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const { name, sku, stock, price, status } = row;
        if (name && sku && stock && price) {
          products.push({
            name,
            sku,
            stock: parseInt(stock),
            price: parseFloat(price),
            status: status || 'active',
          });
        }
      })
      .on('end', async () => {
        let inserted = 0;
        let updated = 0;

        for (let p of products) {
          const existing = await Product.findOne({ sku: p.sku });
          if (existing) {
            existing.stock = p.stock;
            existing.price = p.price;
            existing.status = p.status;
            await existing.save();
            updated++;
          } else {
            await Product.create(p);
            inserted++;
          }
        }

        fs.unlinkSync(filePath);
        logActivity(user, `Import produk: ${products.length} total (${inserted} baru, ${updated} update)`);
        res.json({
          message: `✅ Berhasil import ${products.length} produk (${inserted} baru, ${updated} update)`,
        });
      })
      .on('error', (err) => {
        console.error('❌ Gagal parsing CSV:', err);
        res.status(500).json({ message: 'Gagal parsing CSV' });
      });
  });
};

// EXPORT produk ke CSV
exports.exportProducts = async (req, res) => {
  try {
    const products = await Product.find();
    const fields = ['_id', 'name', 'sku', 'stock', 'price', 'status'];
    const parser = new Parser({ fields });
    const csvData = parser.parse(products);

    res.header('Content-Type', 'text/csv');
    res.attachment('products_export.csv');
    res.send(csvData);
  } catch (err) {
    console.error('❌ Gagal export:', err);
    res.status(500).json({ message: 'Gagal export produk' });
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
