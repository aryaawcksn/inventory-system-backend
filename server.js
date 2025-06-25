const express = require('express');
const cors = require('cors');
require('dotenv').config();
require('./models/db'); // ✅ Hubungkan ke MongoDB

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const salesRoutes = require('./routes/sales');

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('API Inventory aktif!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
