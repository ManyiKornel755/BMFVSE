const express = require('express');
const router = express.Router();
const fs = require('fs');
const PDFGenerator = require('../services/pdfGenerator');
const RaceMinute = require('../models/RaceMinute');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// POST /api/race-minutes/generate — direct PDF without saving
router.post('/generate', async (req, res, next) => {
  try {
    const pdfPath = await PDFGenerator.generateRaceMinute(req.body);
    const futam = req.body.futam_szama ? `_${req.body.futam_szama}` : '';
    res.download(pdfPath, `versenyjegyzokonyv${futam}.pdf`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(pdfPath, () => {});
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/race-minutes
router.get('/', authenticate, async (req, res, next) => {
  try {
    const minutes = await RaceMinute.getAll();
    res.json(minutes);
  } catch (error) {
    next(error);
  }
});

// GET /api/race-minutes/:id/pdf — generate PDF from saved record
router.get('/:id/pdf', authenticate, async (req, res, next) => {
  try {
    const minute = await RaceMinute.findById(req.params.id);
    if (!minute) return res.status(404).json({ error: { message: 'Not found' } });
    const pdfPath = await PDFGenerator.generateRaceMinute(minute);
    const futam = minute.futam_szama ? `_${minute.futam_szama}` : '';
    res.download(pdfPath, `versenyjegyzokonyv${futam}.pdf`, (err) => {
      if (err) console.error('Download error:', err);
      fs.unlink(pdfPath, () => {});
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/race-minutes/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const minute = await RaceMinute.findById(req.params.id);
    if (!minute) return res.status(404).json({ error: { message: 'Not found' } });
    res.json(minute);
  } catch (error) {
    next(error);
  }
});

// POST /api/race-minutes — create and save to DB
router.post('/', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const record = await RaceMinute.create(req.body, req.user.id);
    res.status(201).json(record);
  } catch (error) {
    next(error);
  }
});

// PUT /api/race-minutes/:id
router.put('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const record = await RaceMinute.update(req.params.id, req.body);
    if (!record) return res.status(404).json({ error: { message: 'Not found' } });
    res.json(record);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/race-minutes/:id
router.delete('/:id', authenticate, authorize('admin'), async (req, res, next) => {
  try {
    const deleted = await RaceMinute.delete(req.params.id);
    if (!deleted) return res.status(404).json({ error: { message: 'Not found' } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
