// routes/system.js
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');

router.delete('/reset-all', systemController.resetAllData);

module.exports = router;
