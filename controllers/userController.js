const bcrypt = require('bcrypt');
const User = require('../models/User');

// Ambil semua user
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'id name email role last_logout');
    res.status(200).json({ users });
  } catch (err) {
    console.error('Gagal ambil data:', err);
    res.status(500).json({ message: 'Gagal mengambil data pengguna' });
  }
};

// Update user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Lengkapi semua data' });
  }

  try {
    const updateData = { name, email, role };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    const result = await User.findByIdAndUpdate(id, updateData);
    if (!result) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    res.status(200).json({ message: 'User berhasil diperbarui' });
  } catch (err) {
    console.error('Gagal update user:', err);
    res.status(500).json({ message: 'Gagal update user' });
  }
};

// Hapus user
const deleteUser = async (req, res) => {
  try {
    const result = await User.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.status(200).json({ message: 'User berhasil dihapus' });
  } catch (err) {
    console.error('❌ Gagal hapus user:', err);
    res.status(500).json({ message: 'Gagal menghapus user' });
  }
};

// Register
const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Lengkapi semua data' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email sudah terdaftar' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'kasir'
    });

    await newUser.save();
    res.status(201).json({ message: 'User berhasil didaftarkan' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'User tidak ditemukan' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Password salah' });

    res.status(200).json({
      message: 'Login berhasil',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        last_logout: user.last_logout
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error server saat login' });
  }
};

// Logout
const logout = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email tidak ditemukan' });

  try {
    await User.updateOne({ email }, { last_logout: new Date() });
    res.status(200).json({ message: 'Logout berhasil' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencatat logout' });
  }
};

// Get profile
const getProfile = async (req, res) => {
  const email = req.query.email;
  try {
    const user = await User.findOne({ email }, 'name email role');
    if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data.' });
  }
};

// Update password
const updatePassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ email }, { password: hashedPassword });
    res.status(200).json({ message: 'Password berhasil diubah' });
  } catch (error) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};

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
