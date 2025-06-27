const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: String,
  sku: String,
  stock: Number,
  price: Number,
  status: String,
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
