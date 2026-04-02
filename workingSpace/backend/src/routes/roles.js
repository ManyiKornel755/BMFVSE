const express = require('express');
const Role = require('../models/Role');
const { authenticate, isAdmin } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication and admin access
router.use(authenticate);
router.use(isAdmin);

// GET /api/roles (admin) - Include permissions
router.get('/', async (req, res, next) => {
  try {
    const { sql, poolPromise } = require('../config/database');
    const pool = await poolPromise;

    const result = await pool.request().query(`
      SELECT
        r.id,
        r.name,
        r.description,
        r.created_at,
        (
          SELECT p.id, p.name, p.description
          FROM permissions p
          INNER JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = r.id
          FOR JSON PATH
        ) as permissions_json
      FROM roles r
      ORDER BY r.id
    `);

    const roles = result.recordset.map(role => ({
      ...role,
      permissions: role.permissions_json ? JSON.parse(role.permissions_json) : []
    }));

    res.json(roles);
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/:id (admin)
router.get('/:id', async (req, res, next) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({
        error: 'Role not found',
        status: 404
      });
    }

    res.json(role);
  } catch (error) {
    next(error);
  }
});

// POST /api/roles (admin) - Create role with permissions
router.post('/', async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return res.status(400).json({
        error: 'Role name is required',
        status: 400
      });
    }

    const role = await Role.create({ name, description });

    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      const { sql, poolPromise } = require('../config/database');
      const pool = await poolPromise;

      for (const permId of permissions) {
        await pool.request()
          .input('roleId', sql.Int, role.id)
          .input('permId', sql.Int, permId)
          .query('INSERT INTO role_permissions (role_id, permission_id) VALUES (@roleId, @permId)');
      }
    }

    res.status(201).json(role);
  } catch (error) {
    next(error);
  }
});

// PUT /api/roles/:id (admin) - Update role with permissions
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    const updatedRole = await Role.update(req.params.id, {
      name,
      description
    });

    // Update permissions if provided
    if (permissions !== undefined && Array.isArray(permissions)) {
      const { sql, poolPromise } = require('../config/database');
      const pool = await poolPromise;

      // Remove all existing permissions
      await pool.request()
        .input('roleId', sql.Int, req.params.id)
        .query('DELETE FROM role_permissions WHERE role_id = @roleId');

      // Add new permissions
      for (const permId of permissions) {
        await pool.request()
          .input('roleId', sql.Int, req.params.id)
          .input('permId', sql.Int, permId)
          .query('INSERT INTO role_permissions (role_id, permission_id) VALUES (@roleId, @permId)');
      }
    }

    res.json(updatedRole);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id (admin)
router.delete('/:id', async (req, res, next) => {
  try {
    await Role.delete(req.params.id);
    res.json({ message: 'Role deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST /api/roles/:id/assign/:userId (admin)
router.post('/:id/assign/:userId', async (req, res, next) => {
  try {
    await Role.assignToUser(req.params.userId, req.params.id);
    res.json({ message: 'Role assigned to user successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/roles/:id/assign/:userId (admin)
router.delete('/:id/assign/:userId', async (req, res, next) => {
  try {
    await Role.removeFromUser(req.params.userId, req.params.id);
    res.json({ message: 'Role removed from user successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/user/:userId (admin)
router.get('/user/:userId', async (req, res, next) => {
  try {
    const roles = await Role.getUserRoles(req.params.userId);
    res.json(roles);
  } catch (error) {
    next(error);
  }
});

// GET /api/roles/permissions/all (admin) - Get all available permissions
router.get('/permissions/all', async (req, res, next) => {
  try {
    const { poolPromise } = require('../config/database');
    const pool = await poolPromise;

    const result = await pool.request().query('SELECT * FROM permissions ORDER BY name');
    res.json(result.recordset);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
