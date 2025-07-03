import User from '../models/User.js';
import bcrypt from 'bcryptjs';

// GET /api/users/me
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// PUT /api/users/me
export const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Check for email uniqueness if it's changed
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Email already in use' });
      user.email = email;
    }

    if (name) user.name = name;

    // Hash new password if provided
    if (password && password.trim().length >= 6) {
      user.password = await bcrypt.hash(password, 10);
    }

    user.updatedAt = new Date();
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({ msg: 'Profile updated', user: updatedUser });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
