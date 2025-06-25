const Product = require('../models/Product');

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
  const { name, category, sku, stock, price, status } = req.body;

  if (!name || !category || !sku || stock == null || price == null) {
    return res.status(400).json({ message: 'Lengkapi semua data produk' });
  }

  try {
    const existing = await Product.findOne({ sku });

    if (existing) {
      // SKU sudah ada, update stok saja
      existing.stock += parseInt(stock);
      await existing.save();
      return res.status(200).json({ message: 'Stok produk berhasil diperbarui' });
    } else {
      // SKU belum ada, tambah produk baru
      const newProduct = new Product({ name, category, sku, stock, price, status: status || 'active' });
      await newProduct.save();
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
  const { name, category, stock, price, sku, status } = req.body;

  try {
    const updated = await Product.findByIdAndUpdate(id, {
      name, category, stock, price, sku, status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal update produk:', err);
    res.status(500).json({ message: 'Gagal update produk' });
  }
};

// DELETE produk
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Product.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Produk tidak ditemukan' });
    }

    res.json({ message: 'Produk berhasil dihapus' });
  } catch (err) {
    console.error('Gagal hapus produk:', err);
    res.status(500).json({ message: 'Gagal menghapus produk' });
  }
};
