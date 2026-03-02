const { sql, poolPromise } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async findByEmail(email) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');
    return result.recordset[0] || null;
  }

  static async create({ name, email, password, phone = null, address = null }) {
    const hash = await bcrypt.hash(password, 10);
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hash)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .query('INSERT INTO users (name, email, password, phone, address) OUTPUT INSERTED.id VALUES (@name, @email, @password, @phone, @address)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const allowed = ['name', 'email', 'phone', 'address'];
    const fields = [];
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);

    allowed.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, data[key]);
      }
    });

    if (fields.length === 0) throw new Error('No fields to update');

    await request.query(`UPDATE users SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM users WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM users ORDER BY created_at DESC');
    return result.recordset;
  }

  static async getAllWithRoles() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT
        u.id, u.name, u.email, u.phone, u.address, u.is_member, u.created_at, u.updated_at,
        STRING_AGG(r.name, ',') as roles
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id, u.name, u.email, u.phone, u.address, u.is_member, u.created_at, u.updated_at
      ORDER BY u.created_at DESC
    `);
    return result.recordset.map(user => ({
      ...user,
      roles: user.roles ? user.roles.split(',') : []
    }));
  }

  static async getRoles(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query('SELECT r.* FROM roles r INNER JOIN user_roles ur ON r.id = ur.role_id WHERE ur.user_id = @userId');
    return result.recordset;
  }

  static async assignRole(userId, roleId) {
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
    return true;
  }

  static async removeRole(userId, roleId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('DELETE FROM user_roles WHERE user_id = @userId AND role_id = @roleId');
    return result.rowsAffected[0] > 0;
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updatePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar, hash)
      .query('UPDATE users SET password = @password WHERE id = @id');
  }
}

module.exports = User;
