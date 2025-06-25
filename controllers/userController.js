const db = require('../models/db');
const bcrypt = require('bcrypt');

// Ambil semua user
const getAllUsers = (req, res) => {
  const sql = 'SELECT id, name, email, role, last_logout FROM users';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Gagal ambil data:', err);
      return res.status(500).json({ message: 'Gagal mengambil data pengguna' });
    }
    res.status(200).json({ users: results });
  });
};

// Update user berdasarkan ID
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Lengkapi semua data' });
  }

  try {
    let sql, params;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      sql = 'UPDATE users SET name = ?, email = ?, password = ?, role = ? WHERE id = ?';
      params = [name, email, hashedPassword, role, id];
    } else {
      sql = 'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?';
      params = [name, email, role, id];
    }

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error('Gagal update user:', err);
        return res.status(500).json({ message: 'Gagal update user' });
      }
      res.status(200).json({ message: 'User berhasil diperbarui' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Hapus user
const deleteUser = (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM users WHERE id = ?';
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('❌ Gagal menghapus user:', err);
      return res.status(500).json({ message: 'Gagal menghapus user' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.status(200).json({ message: 'User berhasil dihapus' });
  });
};

// Register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Lengkapi semua data' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [name, email, hashedPassword, role || 'kasir'], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal register user' });
      }
      res.status(201).json({ message: 'User berhasil didaftarkan' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Login
const login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ message: 'Error server saat login' });

    const user = results[0];
    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Password salah' });

    res.status(200).json({
      message: 'Login berhasil',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        last_logout: user.last_logout
      }
    });
  });
};

// Logout
const logout = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: 'Email tidak ditemukan' });
  }

  const logoutSql = 'UPDATE users SET last_logout = NOW() WHERE email = ?';
  db.query(logoutSql, [email], (err) => {
    if (err) {
      return res.status(500).json({ message: 'Gagal mencatat logout' });
    }
    res.status(200).json({ message: 'Logout berhasil' });
  });
};

// Get profile
const getProfile = (req, res) => {
  const email = req.query.email;
  db.query('SELECT name, email, role FROM users WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil data.' });
    if (result.length === 0) return res.status(404).json({ message: 'User tidak ditemukan.' });
    return res.status(200).json(result[0]);
  });
};

// Update password
const updatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'UPDATE users SET password = ? WHERE email = ?';
    db.query(sql, [hashedPassword, email], (err) => {
      if (err) {
        return res.status(500).json({ message: 'Gagal mengubah password' });
      }
      res.status(200).json({ message: 'Password berhasil diubah' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Ekspor semua fungsi
module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  register,
  login,
  logout,
  getProfile,
  updatePassword
};
