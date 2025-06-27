const Product = require('../models/Product');
const { logActivity } = require('./activityController');

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
