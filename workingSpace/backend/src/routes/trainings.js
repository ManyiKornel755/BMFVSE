const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const EmailService = require('../services/emailService');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// GET /api/trainings
router.get('/', authenticate, async (req, res, next) => {
  try {
    const trainings = await Event.getAll();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const trainingEvents = trainings.filter(e =>
      e.event_type === 'training' && new Date(e.event_date) >= today
    );
    res.json(trainingEvents);
  } catch (error) {
    next(error);
  }
});

// GET /api/trainings/log - Edzésnapló (lejárt edzések részletekkel)
router.get('/log', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;
    const now = new Date();

    const result = await pool.request()
      .input('now', sql.DateTime2, now)
      .query(`
        SELECT
          e.id,
          e.title,
          e.description,
          e.event_date,
          e.location,
          e.created_by as creator_id,
          u.name as creator_name,
          (SELECT COUNT(*) FROM event_participants ep WHERE ep.event_id = e.id) as participants_count,
          e.target_group_id
        FROM events e
        LEFT JOIN users u ON e.created_by = u.id
        WHERE e.event_type = 'training' AND e.event_date < @now
        ORDER BY e.event_date DESC
      `);

    res.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

// GET /api/trainings/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const training = await Event.findById(req.params.id);
    if (!training || training.event_type !== 'training') {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }
    
    const participants = await Event.getParticipants(req.params.id);
    res.json({ ...training, participants });
  } catch (error) {
    next(error);
  }
});

// POST /api/trainings (admin vagy coach) - KRITIKUS: értesítés küldés!
router.post('/',
  authenticate,
  authorize('admin', 'coach'),
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('event_date').isISO8601().withMessage('Valid date is required')
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ error: { message: 'Validation failed', details: errors.array() } });
      }

      const { title, description, event_date, location, target_group_id } = req.body;

      const newTraining = await Event.create({
        title,
        description,
        event_date,
        location,
        target_group_id: target_group_id || null,
        event_type: 'training',
        created_by: req.user.id
      });

      // KRITIKUS: User.getAllWithRoles() használata!
      const users = await User.getAllWithRoles();
      
      // Csak a nem-admin userek kapjanak emailt
      const regularUsers = users.filter(u => 
        u.roles && !u.roles.includes('admin')
      );

      if (regularUsers.length > 0) {
        const recipients = regularUsers.map(u => u.email);
        
        await EmailService.sendBulkEmail(
          recipients,
          `Új edzés: ${title}`,
          `Új edzés lett meghirdetve!\n\nCím: ${title}\nIdőpont: ${new Date(event_date).toLocaleString()}\nHelyszín: ${location || 'Nincs megadva'}\n\nLeírás: ${description || 'Nincs leírás'}`
        );
      }

      res.status(201).json(newTraining);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trainings/:id (admin vagy coach)
router.put('/:id', authenticate, authorize('admin', 'coach'), async (req, res, next) => {
  try {
    const { title, description, event_date, location, target_group_id } = req.body;

    const updatedTraining = await Event.update(req.params.id, {
      title,
      description,
      event_date,
      location,
      target_group_id
    });

    if (!updatedTraining) {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }

    res.json(updatedTraining);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/trainings/:id (admin vagy coach)
router.delete('/:id', authenticate, authorize('admin', 'coach'), async (req, res, next) => {
  try {
    const deleted = await Event.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: { message: 'Training not found' } });
    }
    res.json({ message: 'Training deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/trainings/stats/:userId - Személyenkénti edzés statisztika
router.get('/stats/:userId', authenticate, async (req, res, next) => {
  try {
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;
    const userId = parseInt(req.params.userId);

    // Összes training ahol a user résztvevő volt
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT
          e.id,
          e.title,
          e.event_date,
          e.location,
          e.description,
          ep.status,
          CASE
            WHEN ep.status IN ('confirmed', 'attended') THEN 1
            ELSE 0
          END as attended
        FROM events e
        LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.user_id = @userId
        WHERE e.event_type = 'training'
        ORDER BY e.event_date DESC
      `);

    const trainings = result.recordset;
    const now = new Date();

    // Csak azok az edzések amihez a user hozzá volt rendelve (van event_participants bejegyzés)
    const userTrainings = trainings.filter(t => t.status !== null);

    // Statisztikák számítása
    const totalTrainings = userTrainings.length;
    const attendedTrainings = userTrainings.filter(t => t.attended === 1).length;
    const upcomingTrainings = userTrainings.filter(t => new Date(t.event_date) > now).length;
    const attendanceRate = totalTrainings > 0
      ? Math.round((attendedTrainings / totalTrainings) * 100)
      : 0;

    res.json({
      total_trainings: totalTrainings,
      attended_trainings: attendedTrainings,
      attendance_rate: attendanceRate,
      upcoming_trainings: upcomingTrainings,
      trainings: userTrainings.map(t => ({
        id: t.id,
        title: t.title,
        event_date: t.event_date,
        location: t.location,
        description: t.description,
        attended: t.attended === 1
      }))
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
