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
    const userRoles = req.user.roles || [];
    const isTrainer = userRoles.includes('trainer') && !userRoles.includes('admin');
    const isAdmin = userRoles.includes('admin');
    const filter = req.query.filter; // 'drafts' or 'active'

    let messages;

    if (isTrainer) {
      // Edzők: csak saját vázlatok + aktív közlemények (nem lezártak)
      if (filter === 'drafts') {
        // Csak saját vázlatok
        messages = await Message.getTrainerDrafts(req.user.id);
      } else {
        // Aktív közlemények (status = 'sent', nem lezárt, nem lejárt)
        messages = await Message.getActiveMessages();
      }
    } else if (isAdmin) {
      // Adminok: minden közlemény
      messages = await Message.getAll();
    } else {
      // Sima userek: csak aktív közlemények
      messages = await Message.getActiveMessages();
    }

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

// POST /api/messages (admin or trainer)
router.post('/',
  authenticate,
  authorize('admin', 'trainer'),
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

      const { title, content, status, expires_at, recipients } = req.body;

      // Debug logging
      console.log('=== CREATE MESSAGE DEBUG ===');
      console.log('User:', req.user);
      console.log('Recipients received:', recipients);
      console.log('Recipients type:', typeof recipients);
      console.log('Recipients length:', recipients ? recipients.length : 'null/undefined');

      // Trainer can only create drafts
      const userRoles = req.user.roles || [];
      const finalStatus = userRoles.includes('trainer') && !userRoles.includes('admin')
        ? 'draft'
        : (status || 'draft');

      const newMessage = await Message.create({
        title,
        content,
        status: finalStatus,
        created_by: req.user.id,
        expires_at: expires_at || null,
        recipients: recipients || []
      });

      console.log('Message created with ID:', newMessage.id);
      console.log('=== END DEBUG ===');

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

    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Message ID:', req.params.id);
    console.log('Message:', message);

    // Get recipients for this message from message_recipients table
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;
    let recipientsResult = await pool.request()
      .input('message_id', sql.Int, req.params.id)
      .query(`
        SELECT u.email
        FROM message_recipients mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = @message_id
      `);

    console.log('Recipients query result:', recipientsResult.recordset);

    let recipients = recipientsResult.recordset.map(r => r.email);

    // If no direct recipients, try to get recipients from group_id
    if (recipients.length === 0 && message.group_id) {
      const groupRecipientsResult = await pool.request()
        .input('group_id', sql.Int, message.group_id)
        .query(`
          SELECT u.email
          FROM group_members gm
          JOIN users u ON gm.user_id = u.id
          WHERE gm.group_id = @group_id
        `);
      recipients = groupRecipientsResult.recordset.map(r => r.email);
    }

    if (recipients.length === 0) {
      return res.status(400).json({ error: { message: 'No recipients for this message. Please add recipients before sending.' } });
    }

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
