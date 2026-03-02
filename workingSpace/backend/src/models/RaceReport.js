const { sql, poolPromise } = require('../config/database');

class RaceReport {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM race_reports ORDER BY race_date DESC');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM race_reports WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ race_name, race_date, location, status = 'draft', created_by = null }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('race_name', sql.NVarChar, race_name)
      .input('race_date', sql.DateTime2, new Date(race_date))
      .input('location', sql.NVarChar, location || null)
      .input('status', sql.NVarChar, status)
      .input('created_by', sql.Int, created_by)
      .query('INSERT INTO race_reports (race_name, race_date, location, status, created_by) OUTPUT INSERTED.id VALUES (@race_name, @race_date, @location, @status, @created_by)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];
    const allowed = ['race_name', 'location', 'status', 'notes'];
    allowed.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, data[key]);
      }
    });
    if (data.race_date !== undefined) {
      fields.push('race_date = @race_date');
      request.input('race_date', sql.DateTime2, new Date(data.race_date));
    }
    if (fields.length === 0) throw new Error('No fields to update');
    await request.query(`UPDATE race_reports SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM race_reports WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }

  static async getParticipants(raceReportId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('raceReportId', sql.Int, raceReportId)
      .query(`
        SELECT rp.*, u.email, u.name
        FROM race_participants rp
        LEFT JOIN users u ON rp.user_id = u.id
        WHERE rp.race_report_id = @raceReportId
        ORDER BY rp.position, rp.created_at DESC
      `);
    return result.recordset;
  }

  static async addParticipant(raceReportId, data) {
    const { user_id, name, sail_number, boat_class, position, notes } = data;
    const pool = await poolPromise;
    const result = await pool.request()
      .input('race_report_id', sql.Int, raceReportId)
      .input('user_id', sql.Int, user_id || null)
      .input('name', sql.NVarChar, name)
      .input('sail_number', sql.NVarChar, sail_number || null)
      .input('boat_class', sql.NVarChar, boat_class || null)
      .input('position', sql.Int, position || null)
      .input('notes', sql.NVarChar, notes || null)
      .query('INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position, notes) OUTPUT INSERTED.id VALUES (@race_report_id, @user_id, @name, @sail_number, @boat_class, @position, @notes)');
    return { id: result.recordset[0].id };
  }

  static async addParticipantsBulk(raceReportId, participants) {
    if (!participants || participants.length === 0) return { inserted: 0 };
    const pool = await poolPromise;
    let inserted = 0;
    for (const p of participants) {
      await pool.request()
        .input('race_report_id', sql.Int, raceReportId)
        .input('user_id', sql.Int, p.user_id || null)
        .input('name', sql.NVarChar, p.name)
        .input('sail_number', sql.NVarChar, p.sail_number || null)
        .input('boat_class', sql.NVarChar, p.boat_class || null)
        .input('position', sql.Int, p.position || null)
        .input('notes', sql.NVarChar, p.notes || null)
        .query('INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position, notes) VALUES (@race_report_id, @user_id, @name, @sail_number, @boat_class, @position, @notes)');
      inserted++;
    }
    return { inserted };
  }

  static async updateParticipant(participantId, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, participantId);
    const fields = [];
    const allowed = ['name', 'sail_number', 'boat_class', 'notes'];
    allowed.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, data[key] === '' ? null : data[key]);
      }
    });
    if (data.position !== undefined) {
      fields.push('position = @position');
      request.input('position', sql.Int, data.position === '' ? null : data.position);
    }
    if (fields.length === 0) throw new Error('No fields to update');
    const result = await request.query(`UPDATE race_participants SET ${fields.join(', ')} WHERE id = @id`);
    return result.rowsAffected[0] > 0;
  }

  static async removeParticipant(participantId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, participantId)
      .query('DELETE FROM race_participants WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = RaceReport;
