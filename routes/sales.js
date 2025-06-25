const express = require('express');
const router = express.Router();
const salesController = require('../controllers/salesController');

router.get('/', salesController.getAllSales);
router.post('/', salesController.addSale);
router.get('/export', salesController.exportSales);
router.post('/import', salesController.importSales);
router.delete('/reset', salesController.resetSales);

module.exports = router;
