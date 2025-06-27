const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: String,
    sku: { type: String, unique: true },
    stock: Number,
    price: Number,
    status: { type: String, default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
