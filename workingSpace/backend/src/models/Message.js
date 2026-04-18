const { sql, poolPromise } = require('../config/database');

class Message {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.*,
        u.name as creator_name,
        r.name as creator_role
      FROM messages m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      ORDER BY m.created_at DESC
    `);
    return result.recordset;
  }

  static async getAllActive() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.*,
        u.name as creator_name,
        r.name as creator_role
      FROM messages m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE m.deleted_at IS NULL
        AND (m.expires_at IS NULL OR m.expires_at > GETDATE())
      ORDER BY m.created_at DESC
    `);
    return result.recordset;
  }

  static async getAllExpired() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.*,
        u.name as creator_name,
        r.name as creator_role
      FROM messages m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE m.deleted_at IS NOT NULL
        OR (m.expires_at IS NOT NULL AND m.expires_at <= GETDATE())
      ORDER BY m.created_at DESC
    `);
    return result.recordset;
  }

  static async getActiveMessages() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT m.*,
        u.name as creator_name,
        r.name as creator_role
      FROM messages m
      LEFT JOIN users u ON m.created_by = u.id
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE m.status = 'sent'
        AND m.deleted_at IS NULL
        AND (m.expires_at IS NULL OR m.expires_at > GETDATE())
      ORDER BY m.created_at DESC
    `);
    return result.recordset;
  }

  static async getTrainerDrafts(trainerId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('trainer_id', sql.Int, trainerId)
      .query(`
        SELECT m.*,
          u.name as creator_name,
          r.name as creator_role
        FROM messages m
        LEFT JOIN users u ON m.created_by = u.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE m.created_by = @trainer_id
          AND m.status = 'draft'
          AND m.deleted_at IS NULL
        ORDER BY m.created_at DESC
      `);
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM messages WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ title, content, status = 'draft', created_by = null, expires_at = null, recipients = [] }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('content', sql.NVarChar, content)
      .input('status', sql.NVarChar, status)
      .input('created_by', sql.Int, created_by)
      .input('expires_at', sql.DateTime, expires_at)
      .query('INSERT INTO messages (title, content, status, created_by, expires_at) OUTPUT INSERTED.id VALUES (@title, @content, @status, @created_by, @expires_at)');

    const messageId = result.recordset[0].id;

    // Add recipients
    console.log('Message.create - Adding recipients for message ID:', messageId);
    console.log('Recipients array:', recipients);
    if (recipients && recipients.length > 0) {
      for (const userId of recipients) {
        console.log('Inserting recipient user_id:', userId);
        await pool.request()
          .input('message_id', sql.Int, messageId)
          .input('user_id', sql.Int, userId)
          .query('INSERT INTO message_recipients (message_id, user_id) VALUES (@message_id, @user_id)');
      }
      console.log('All recipients inserted successfully');
    } else {
      console.log('No recipients to insert (empty or null array)');
    }

    return this.findById(messageId);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];

    if (data.title !== undefined) { fields.push('title = @title'); request.input('title', sql.NVarChar, data.title); }
    if (data.content !== undefined) { fields.push('content = @content'); request.input('content', sql.NVarChar, data.content); }
    if (data.status !== undefined) { fields.push('status = @status'); request.input('status', sql.NVarChar, data.status); }
    if (data.expires_at !== undefined) { fields.push('expires_at = @expires_at'); request.input('expires_at', sql.DateTime, data.expires_at); }

    if (fields.length === 0) throw new Error('No fields to update');

    await request.query(`UPDATE messages SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE messages SET deleted_at = GETDATE(), expires_at = GETDATE() WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async markAsSent(id) {
    const pool = await poolPromise;
    await pool.request()
      .input('id', sql.Int, id)
      .query("UPDATE messages SET status = 'sent', sent_at = GETDATE() WHERE id = @id");
    return this.findById(id);
  }

  static async getRecipients(messageId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('message_id', sql.Int, messageId)
      .query(`
        SELECT u.id, u.name, u.email
        FROM message_recipients mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = @message_id
      `);
    return result.recordset;
  }
}

module.exports = Message;
