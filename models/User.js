const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'kasir'], default: 'kasir' },
  last_logout: { type: Date, default: null }
}, { timestamps: true }); // optional: menambahkan createdAt dan updatedAt

module.exports = mongoose.model('User', userSchema);
