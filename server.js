// server/server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Inisialisasi aplikasi Express USERS
const app = express();
const PORT = process.env.PORT || 5000;
const userRoutes = require('./routes/users');

// Inisialisasi koneksi database PRODUCTS & SALES
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);

app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// Routing contoh
app.get('/', (req, res) => {
  res.send('API Inventory aktif!');
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
