const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'WaveAlert API is running' });
});

// Routes
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/members', require('./src/routes/members'));
app.use('/api/groups', require('./src/routes/groups'));
app.use('/api/messages', require('./src/routes/messages'));
app.use('/api/trainings', require('./src/routes/trainings'));
app.use('/api/documents', require('./src/routes/documents'));
app.use('/api/race-reports', require('./src/routes/race-reports'));
app.use('/api/users', require('./src/routes/users'));
app.use('/api/roles', require('./src/routes/roles'));
app.use('/api/events', require('./src/routes/events'));
app.use('/api/user-documents', require('./src/routes/user-documents'));
app.use('/api/emails', require('./src/routes/emails'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: { message: 'Route not found' } });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
