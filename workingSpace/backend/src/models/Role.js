const { sql, poolPromise } = require('../config/database');

class Role {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM roles ORDER BY name');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM roles WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ name, description }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('description', sql.NVarChar, description || null)
      .query('INSERT INTO roles (name, description) OUTPUT INSERTED.id VALUES (@name, @description)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];

    if (data.name !== undefined) {
      fields.push('name = @name');
      request.input('name', sql.NVarChar, data.name);
    }
    if (data.description !== undefined) {
      fields.push('description = @description');
      request.input('description', sql.NVarChar, data.description);
    }

    if (fields.length === 0) throw new Error('No fields to update');

    const result = await request.query(`UPDATE roles SET ${fields.join(', ')} WHERE id = @id`);
    if (result.rowsAffected[0] === 0) throw new Error('Role not found');
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM roles WHERE id = @id');
    if (result.rowsAffected[0] === 0) throw new Error('Role not found');
    return { message: 'Role deleted successfully' };
  }

  static async assignToUser(userId, roleId) {
    const pool = await poolPromise;
    const check = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('SELECT 1 FROM user_roles WHERE user_id = @userId AND role_id = @roleId');
    if (check.recordset.length === 0) {
      await pool.request()
        .input('userId', sql.Int, userId)
        .input('roleId', sql.Int, roleId)
        .query('INSERT INTO user_roles (user_id, role_id) VALUES (@userId, @roleId)');
    }
    return { userId, roleId };
  }

  static async removeFromUser(userId, roleId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('DELETE FROM user_roles WHERE user_id = @userId AND role_id = @roleId');
    if (result.rowsAffected[0] === 0) throw new Error('Role assignment not found');
    return { message: 'Role removed from user successfully' };
  }

  static async getUserRoles(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT r.*
        FROM roles r
        INNER JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = @userId
        ORDER BY r.name
      `);
    return result.recordset;
  }
}

module.exports = Role;
