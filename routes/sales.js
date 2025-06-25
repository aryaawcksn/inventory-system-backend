const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

// Rute utama penjualan
router.get('/', salesController.getAllSales);
router.post('/', salesController.addSale);

// Rute tambahan: Export, Import, Reset
router.get('/export', salesController.exportSales);
router.post('/import', salesController.importSales);
router.delete('/reset', salesController.resetSales);

module.exports = router;
