const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

router.get('/', productController.getAllProducts);
router.post('/', productController.addProduct);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.delete('/reset', productController.resetProducts);
router.get('/export-json', productController.exportProductsJSON);
router.post('/import-json', productController.importProducts);

module.exports = router;
