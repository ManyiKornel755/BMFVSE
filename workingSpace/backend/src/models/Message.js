const { sql, poolPromise } = require('../config/database');

class Message {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM messages ORDER BY created_at DESC');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM messages WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ title, content, status = 'draft', created_by = null }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('status', sql.NVarChar, status)
      .input('created_by', sql.Int, created_by)
      .query('INSERT INTO messages (title, content, status, created_by) OUTPUT INSERTED.id VALUES (@title, @content, @status, @created_by)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];

    if (data.title !== undefined) { fields.push('title = @title'); request.input('title', sql.NVarChar, data.title); }
    if (data.content !== undefined) { fields.push('content = @content'); request.input('content', sql.NVarChar, data.content); }
    if (data.status !== undefined) { fields.push('status = @status'); request.input('status', sql.NVarChar, data.status); }

    if (fields.length === 0) throw new Error('No fields to update');

    await request.query(`UPDATE messages SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM messages WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async markAsSent(id) {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE messages SET status = 'sent', sent_at = GETDATE() WHERE id = @id");
    return this.findById(id);
  }
}

module.exports = Message;
