const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.post('/', salesController.addSale);
router.get('/export-json', salesController.exportSalesJSON);
router.post('/import-json', salesController.importSalesJSON);
router.delete('/reset', salesController.resetSales);

module.exports = router;
