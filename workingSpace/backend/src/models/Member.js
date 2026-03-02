const { sql, poolPromise } = require('../config/database');

class Member {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM users WHERE is_member = 1 ORDER BY created_at DESC');
    return result.recordset.map(m => ({
      ...m,
      first_name: m.name ? m.name.split(' ')[0] : '',
      last_name: m.name ? m.name.split(' ').slice(1).join(' ') : ''
    }));
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM users WHERE id = @id AND is_member = 1');
    if (!result.recordset[0]) return null;
    const m = result.recordset[0];
    return {
      ...m,
      first_name: m.name ? m.name.split(' ')[0] : '',
      last_name: m.name ? m.name.split(' ').slice(1).join(' ') : ''
    };
  }

  static async create({ email, password_hash, first_name, last_name, phone }) {
    const pool = await poolPromise;
    const name = `${first_name} ${last_name}`.trim();
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password_hash)
      .input('phone', sql.NVarChar, phone || null)
      .query('INSERT INTO users (name, email, password, phone, is_member) OUTPUT INSERTED.id VALUES (@name, @email, @password, @phone, 1)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];

    if (data.first_name !== undefined || data.last_name !== undefined) {
      const current = await this.findById(id);
      const fn = data.first_name !== undefined ? data.first_name : current.first_name;
      const ln = data.last_name !== undefined ? data.last_name : current.last_name;
      fields.push('name = @name');
      request.input('name', sql.NVarChar, `${fn} ${ln}`.trim());
    }
    if (data.email !== undefined) { fields.push('email = @email'); request.input('email', sql.NVarChar, data.email); }
    if (data.phone !== undefined) { fields.push('phone = @phone'); request.input('phone', sql.NVarChar, data.phone); }

    if (fields.length === 0) throw new Error('No fields to update');

    await request.query(`UPDATE users SET ${fields.join(', ')} WHERE id = @id AND is_member = 1`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM users WHERE id = @id AND is_member = 1');
    return result.rowsAffected[0] > 0;
  }

  static async getTags() { return []; }
  static async addTag() { return true; }
  static async removeTag() { return true; }
}

module.exports = Member;
