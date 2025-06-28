const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  customer: { type: String },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  items: { type: String },
  qty: { type: Number, required: true },
  total: { type: Number, required: true },
  invoice: { type: String, required: true, unique: true },
  status: { type: String, default: 'completed' }
}, { timestamps: true });

module.exports = mongoose.model('Sale', saleSchema);
