// models/Sale.js
const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  customer: String,
  items: String,
  qty: Number,
  total: Number,
  status: { type: String, default: 'completed' },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  }
});

module.exports = mongoose.model('Sale', saleSchema);
