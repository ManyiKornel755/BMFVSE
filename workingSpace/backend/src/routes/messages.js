const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// GET /api/messages
router.get('/', authenticate, async (req, res, next) => {
  try {
    const messages = await Message.getAll();
    res.json(messages);
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    res.json(message);
  } catch (error) {
    next(error);
  }
});

// POST /api/messages (admin only)
router.post('/',
  authenticate,
  authorize('admin'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { title, content, status, expires_at } = req.body;

      const newMessage = await Message.create({
        title,
        content,
        status: status || 'draft',
        created_by: req.user.id,
        expires_at: expires_at || null
      });

      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/messages/:id/send (admin only)
router.post('/:id/send', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }

    const users = await User.getAll();
    const recipients = users.map(u => u.email);

    const emailResult = await EmailService.sendBulkEmail(
      recipients,
      message.title,
      message.content
    );

    await Message.markAsSent(req.params.id);

    res.json({
      message: 'Message sent successfully',
      recipientCount: recipients.length,
      emailResult
    });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/messages/:id (admin only)
router.patch('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { title, content, status, expires_at } = req.body;

    const updatedMessage = await Message.update(req.params.id, {
      title,
      content,
      status,
      expires_at
    });

    if (!updatedMessage) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }

    res.json(updatedMessage);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/messages/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await Message.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Message not found' } });
    }
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
