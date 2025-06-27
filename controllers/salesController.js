const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { Parser } = require('json2csv');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const { logActivity } = require('./activityController');

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

const exportSales = async (req, res) => {
  try {
    const sales = await Sale.find().lean(); // gunakan lean() agar lebih ringan

    const formattedSales = sales.map((sale) => ({
      _id: sale._id.toString(), // konversi ke string
      date: new Date(sale.date).toISOString(),
      items: sale.items,
      qty: sale.qty,
      total: sale.total,
      status: sale.status
    }));

    const fields = ['_id', 'date', 'items', 'qty', 'total', 'status'];
    const parser = new Parser({ fields });
    const csvData = parser.parse(formattedSales);

    res.header('Content-Type', 'text/csv');
    res.attachment('sales_export.csv');
    res.send(csvData);
  } catch (err) {
    console.error('❌ Gagal export CSV:', err);
    res.status(500).json({ message: 'Gagal export data' });
  }
};


// === IMPORT dari CSV ===
const importSales = (req, res) => {
  upload(req, res, async function (err) {
    if (err || !req.file) {
      return res.status(400).json({ message: 'Gagal upload file' });
    }

    const filePath = path.join(__dirname, '../uploads', req.file.filename);
    const sales = [];
    const user = req.headers['x-user'] ? JSON.parse(req.headers['x-user']) : null;

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const { date, items, qty, total, status } = row;
        if (date && items && qty && total) {
          sales.push({
            date: new Date(date),
            items,
            qty: parseInt(qty),
            total: parseFloat(total),
            status: status || 'completed',
          });
        }
      })
      .on('end', async () => {
        try {
          const inserted = await Sale.insertMany(sales);
          fs.unlinkSync(filePath);
          logActivity(user, `Import data penjualan: ${inserted.length} entri`);
          res.json({ message: `${inserted.length} transaksi diimpor` });
        } catch (e) {
          console.error('❌ Gagal simpan:', e);
          res.status(500).json({ message: 'Gagal menyimpan transaksi' });
        }
      })
      .on('error', (err) => {
        console.error('❌ Gagal parsing CSV:', err);
        res.status(500).json({ message: 'Gagal parsing CSV' });
      });
  });
};

// === RESET penjualan ===
const resetSales = async (req, res) => {
  try {
    await Sale.deleteMany({});
    res.status(200).json({ message: '✅ Semua data penjualan berhasil dihapus' });
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
