const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.addProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.post('/import-json', productController.importProductJSON);
router.get('/export-json', productController.exportProductJSON);
router.get('/export', productController.exportProducts);
router.delete('/reset', productController.resetProducts);

module.exports = router;
