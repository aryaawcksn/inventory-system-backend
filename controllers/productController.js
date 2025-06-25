const db = require('../models/db');

// GET semua produk
exports.getAllProducts = (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Gagal mengambil produk:', err);
      return res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
    res.status(200).json({ products: results });
  });
};

// POST produk baru
exports.addProduct = (req, res) => {
  const { name, category, sku, stock, price, status } = req.body;

  if (!name || !category || !sku || stock == null || price == null) {
  return res.status(400).json({ message: 'Lengkapi semua data produk' });
}


  // Cek apakah produk dengan SKU yang sama sudah ada
  const checkSql = 'SELECT * FROM products WHERE sku = ?';
  db.query(checkSql, [sku], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal cek SKU' });

    if (results.length > 0) {
      // SKU sudah ada, update stok saja
      const currentStock = results[0].stock;
      const newStock = currentStock + parseInt(stock);
      const updateSql = 'UPDATE products SET stock = ? WHERE sku = ?';

      db.query(updateSql, [newStock, sku], (err2) => {
        if (err2) return res.status(500).json({ message: 'Gagal update stok' });
        return res.status(200).json({ message: 'Stok produk berhasil diperbarui' });
      });
    } else {
      // SKU belum ada, insert baru
      const insertSql = 'INSERT INTO products (name, category, sku, stock, price, status) VALUES (?, ?, ?, ?, ?, ?)';
      db.query(insertSql, [name, category, sku, stock, price, status || 'active'], (err3) => {
        if (err3) return res.status(500).json({ message: 'Gagal tambah produk baru' });
        return res.status(201).json({ message: 'Produk berhasil ditambahkan' });
      });
    }
  });
};


// PUT edit produk
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, category, stock, price, sku, status } = req.body;
  const sql = 'UPDATE products SET name = ?, category = ?, stock = ?, price = ?, sku = ?, status = ? WHERE id = ?';
  db.query(sql, [name, category, stock, price, sku, status, id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal update produk' });
    res.json({ message: 'Produk berhasil diperbarui' });
  });
};

// DELETE produk
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal menghapus produk' });
    res.json({ message: 'Produk berhasil dihapus' });
  });
};
