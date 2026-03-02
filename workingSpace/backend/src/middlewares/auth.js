const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required', status: 401 });
    }
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, roles: decoded.roles || [] };
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ error: 'Invalid token', status: 401 });
    if (error.name === 'TokenExpiredError') return res.status(401).json({ error: 'Token expired', status: 401 });
    return res.status(500).json({ error: 'Authentication error', status: 500 });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = @userId');
    if (!result.recordset.some(r => r.name === 'admin')) {
      return res.status(403).json({ error: 'Admin access required', status: 403 });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization error', status: 500 });
  }
};

const isAdminOrCoach = async (req, res, next) => {
  try {
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT r.name FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = @userId');
    if (!result.recordset.some(r => r.name === 'admin' || r.name === 'trainer' || r.name === 'coach')) {
      return res.status(403).json({ error: 'Admin or trainer access required', status: 403 });
    }
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Authorization error', status: 500 });
  }
};

module.exports = { authenticate, isAdmin, isAdminOrCoach };
