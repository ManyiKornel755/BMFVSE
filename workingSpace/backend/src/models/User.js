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

  static async create({ name, email, password, phone = null, address = null, birth_date = null, parent_name = null, parent_email = null, parent_phone = null, relationship = null }) {
    const hash = await bcrypt.hash(password, 10);

    // Split name into first_name and last_name
    const nameParts = (name || '').trim().split(' ');
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || '';

    const pool = await poolPromise;
    const result = await pool.request()
      .input('first_name', sql.NVarChar, first_name)
      .input('last_name', sql.NVarChar, last_name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, hash)
      .input('phone', sql.NVarChar, phone)
      .input('address', sql.NVarChar, address)
      .input('birth_date', sql.Date, birth_date)
      .input('parent_name', sql.NVarChar, parent_name)
      .input('parent_email', sql.NVarChar, parent_email)
      .input('parent_phone', sql.NVarChar, parent_phone)
      .input('relationship', sql.NVarChar, relationship)
      .query('INSERT INTO users (first_name, last_name, email, password, phone, address, birth_date, parent_name, parent_email, parent_phone, relationship) OUTPUT INSERTED.id VALUES (@first_name, @last_name, @email, @password, @phone, @address, @birth_date, @parent_name, @parent_email, @parent_phone, @relationship)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const allowed = ['email', 'phone', 'address', 'birth_date', 'birth_place', 'mother_name', 'id_number', 'parent_name', 'parent_email', 'parent_phone', 'relationship'];
    const fields = [];
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);

    // Handle name field - split into first_name and last_name
    if (data.name !== undefined) {
      const nameParts = (data.name || '').trim().split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';
      fields.push('first_name = @first_name', 'last_name = @last_name');
      request.input('first_name', sql.NVarChar, first_name);
      request.input('last_name', sql.NVarChar, last_name);
    }

    allowed.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        if (key === 'birth_date') {
          request.input(key, sql.Date, data[key]);
        } else {
          request.input(key, sql.NVarChar, data[key]);
        }
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
        u.id, u.name, u.first_name, u.last_name, u.email, u.phone, u.address, u.is_member,
        u.birth_date, u.birth_place, u.mother_name, u.id_number, u.parent_name,
        u.created_at, u.updated_at,
        (
          SELECT r.id, r.name
          FROM roles r
          INNER JOIN user_roles ur2 ON r.id = ur2.role_id
          WHERE ur2.user_id = u.id
          FOR JSON PATH
        ) as roles_json
      FROM users u
      ORDER BY u.created_at DESC
    `);
    return result.recordset.map(user => ({
      ...user,
      roles: user.roles_json ? JSON.parse(user.roles_json) : [],
      roles_json: undefined
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
    await pool.request()
      .input('userId', sql.Int, userId)
      .query('DELETE FROM user_roles WHERE user_id = @userId');
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('roleId', sql.Int, roleId)
      .query('INSERT INTO user_roles (user_id, role_id) VALUES (@userId, @roleId)');
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

  static async updateProfileImage(id, imageUrl) {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .input('profile_image', sql.NVarChar, imageUrl)
      .query('UPDATE users SET profile_image = @profile_image WHERE id = @id');
    return this.findById(id);
  }
}

module.exports = User;
