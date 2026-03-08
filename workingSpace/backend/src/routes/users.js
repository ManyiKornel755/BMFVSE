const express = require('express');
const User = require('../models/User');
const { authenticate, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const path = require('path');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/users/me → saját profil
router.get('/me', async (req, res, next) => {
  try {
    // KRITIKUS: req.user.id használata, NEM req.user.userId!
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/me → profil szerkesztés
router.patch('/me', async (req, res, next) => {
  try {
    const { name, email, phone, address, birth_date } = req.body;

    // KRITIKUS: req.user.id használata, NEM req.user.userId!
    const updatedUser = await User.update(req.user.id, {
      name,
      email,
      phone,
      address,
      birth_date
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/me/password → jelszó változtatás
router.patch('/me/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: 'Current password and new password are required',
        status: 400
      });
    }

    // KRITIKUS: req.user.id használata, NEM req.user.userId!
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    // Verify current password
    const isValidPassword = await User.verifyPassword(currentPassword, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Current password is incorrect',
        status: 401
      });
    }

    // Update password
    await User.updatePassword(req.user.id, newPassword);

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/users/me/profile-image → profilkép feltöltés
router.post('/me/profile-image', upload.single('profileImage'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file uploaded',
        status: 400
      });
    }

    const imageUrl = `/uploads/profiles/${req.file.filename}`;

    // Update user profile image in database
    await User.updateProfileImage(req.user.id, imageUrl);

    res.json({
      message: 'Profile image uploaded successfully',
      imageUrl: imageUrl
    });
  } catch (error) {
    next(error);
  }
});

// Admin routes
// GET /api/users → list all users (admin only)
router.get('/', isAdmin, async (req, res, next) => {
  try {
    const users = await User.getAllWithRoles();

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    res.json(usersWithoutPasswords);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id → get user by id (admin only)
router.get('/:id', isAdmin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        status: 404
      });
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// POST /api/users → create new user (admin only)
router.post('/', isAdmin, async (req, res, next) => {
  try {
    const { name, email, password, phone, address, birth_date, parent_name, parent_email, parent_phone, relationship } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required',
        status: 400
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        error: 'User with this email already exists',
        status: 409
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      birth_date,
      parent_name,
      parent_email,
      parent_phone,
      relationship
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id → update user (admin only)
router.patch('/:id', isAdmin, async (req, res, next) => {
  try {
    const { name, email, phone, address, birth_date, parent_name, parent_email, parent_phone, relationship } = req.body;

    const updatedUser = await User.update(req.params.id, {
      name,
      email,
      phone,
      address,
      birth_date,
      parent_name,
      parent_email,
      parent_phone,
      relationship
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = updatedUser;

    res.json(userWithoutPassword);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id → csak admin!
router.delete('/:id', isAdmin, async (req, res, next) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
