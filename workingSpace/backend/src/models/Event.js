const { sql, poolPromise } = require('../config/database');

class Event {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM events ORDER BY event_date DESC');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM events WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ title, description, event_date, end_date = null, location, event_type, target_group_id = null, created_by = null }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('event_date', sql.DateTime2, new Date(event_date))
      .input('end_date', sql.DateTime2, end_date ? new Date(end_date) : null)
      .input('location', sql.NVarChar, location || null)
      .input('event_type', sql.NVarChar, event_type || null)
      .input('target_group_id', sql.Int, target_group_id)
      .input('created_by', sql.Int, created_by)
      .query('INSERT INTO events (title, description, event_date, end_date, location, event_type, target_group_id, created_by) OUTPUT INSERTED.id VALUES (@title, @description, @event_date, @end_date, @location, @event_type, @target_group_id, @created_by)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];
    if (data.title !== undefined) { fields.push('title = @title'); request.input('title', sql.NVarChar, data.title); }
    if (data.description !== undefined) { fields.push('description = @description'); request.input('description', sql.NVarChar, data.description); }
    if (data.event_date !== undefined) { fields.push('event_date = @event_date'); request.input('event_date', sql.DateTime2, new Date(data.event_date)); }
    if (data.end_date !== undefined) { fields.push('end_date = @end_date'); request.input('end_date', sql.DateTime2, data.end_date ? new Date(data.end_date) : null); }
    if (data.location !== undefined) { fields.push('location = @location'); request.input('location', sql.NVarChar, data.location); }
    if (fields.length === 0) throw new Error('No fields to update');
    await request.query(`UPDATE events SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM events WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async addParticipant(eventId, userId, status = 'pending') {
    const pool = await poolPromise;
    const check = await pool.request()
      .input('eventId', sql.Int, eventId)
      .input('userId', sql.Int, userId)
      .query('SELECT 1 FROM event_participants WHERE event_id = @eventId AND user_id = @userId');
    if (check.recordset.length > 0) {
      await pool.request()
        .input('eventId', sql.Int, eventId)
        .input('userId', sql.Int, userId)
        .input('status', sql.NVarChar, status)
        .query('UPDATE event_participants SET status = @status WHERE event_id = @eventId AND user_id = @userId');
    } else {
      await pool.request()
        .input('eventId', sql.Int, eventId)
        .input('userId', sql.Int, userId)
        .input('status', sql.NVarChar, status)
        .query('INSERT INTO event_participants (event_id, user_id, status) VALUES (@eventId, @userId, @status)');
    }
    return true;
  }

  static async removeParticipant(eventId, userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM event_participants WHERE event_id = @eventId AND user_id = @userId');
    return result.rowsAffected[0] > 0;
  }

  static async getParticipants(eventId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('eventId', sql.Int, eventId)
      .query(`
        SELECT u.id, u.email, u.name, ep.status, ep.registered_at
        FROM event_participants ep
        INNER JOIN users u ON ep.user_id = u.id
        WHERE ep.event_id = @eventId
        ORDER BY ep.registered_at DESC
      `);
    return result.recordset;
  }
}

module.exports = Event;
