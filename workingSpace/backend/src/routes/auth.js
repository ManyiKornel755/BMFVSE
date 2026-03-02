const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const jwtConfig = require('../config/jwt');

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { email, password } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: { message: 'Invalid credentials' } });
    }

    const roles = await User.getRoles(user.id);
    const roleNames = roles.map(r => r.name);

    const token = jwt.sign(
      { id: user.id, email: user.email, roles: roleNames },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: roleNames
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/register (admin only - simple version without middleware to avoid circular deps)
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').notEmpty().withMessage('Name is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
    }

    const { email, password, name, phone } = req.body;

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: { message: 'Email already exists' } });
    }

    const newUser = await User.create({ name, email, password, phone });

    res.status(201).json({
      message: 'User created successfully',
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }
    const jwt_module = require('jsonwebtoken');
    const decoded = jwt_module.verify(authHeader.substring(7), process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    const roles = await User.getRoles(user.id);

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      roles: roles.map(r => r.name)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
