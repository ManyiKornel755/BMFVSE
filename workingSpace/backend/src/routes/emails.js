const express = require('express');
const router = express.Router();
const EmailService = require('../services/emailService');
const { authenticate, isAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.use(isAdmin);

// POST /api/emails/send - tömeges email küldés kiválasztott tagoknak
router.post('/send', async (req, res, next) => {
  try {
    const { recipients, subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Tárgy és tartalom megadása kötelező', status: 400 });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Legalább egy címzett szükséges', status: 400 });
    }

    const result = await EmailService.sendBulkEmail(recipients, subject, content);

    res.json({
      message: 'Email sikeresen elküldve',
      recipientCount: recipients.length,
      result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
