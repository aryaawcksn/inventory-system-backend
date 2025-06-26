const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/activityController');

router.get('/', getLogs);

module.exports = router;
