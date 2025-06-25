const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, default: 0 },
  price: { type: Number, default: 0 },
  status: { type: String, default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', productSchema);
