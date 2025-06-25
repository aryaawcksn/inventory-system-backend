const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET semua user
router.get('/', userController.getAllUsers); // ✅ ini dari instruksi sebelumnya

// POST register dan login
router.post('/register', userController.register);
router.post('/login', userController.login);

router.put('/:id', userController.updateUser); // Tambahkan ini

// PUT update password
router.put('/password', userController.updatePassword);

// DELETE hapus user
router.delete('/:id', userController.deleteUser);

router.post('/logout', userController.logout);

module.exports = router;
