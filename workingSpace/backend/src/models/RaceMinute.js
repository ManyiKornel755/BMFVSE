const { sql, poolPromise } = require('../config/database');

const FIELDS = [
  'verseny_neve', 'helye', 'ideje', 'rendezoje', 'versenyvezeto', 'jegyzokonyvvezeto',
  'korosztaly', 'palya_jellege', 'futam_szama', 'rajthajo', 'celhajo', 'motorosok',
  'birosag_elnok', 'birosag_birok', 'szel_rajtnal', 'szel_futam_kozben',
  'elrajtoltak_szama', 'nem_rajtoltak', 'nem_futottak', 'korai_rajtolok',
  'z_lobogos', 'fekete_lobogos', 'ovast_bejelento', 'elsonek_ideje', 'utolsonak_ideje',
];

class RaceMinute {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(
      'SELECT id, verseny_neve, futam_szama, korosztaly, helye, ideje, created_at FROM race_minutes ORDER BY created_at DESC'
    );
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM race_minutes WHERE id = @id');
    const row = result.recordset[0];
    if (!row) return null;
    if (row.esemenyek) {
      try { row.esemenyek = JSON.parse(row.esemenyek); } catch { row.esemenyek = []; }
    } else {
      row.esemenyek = [];
    }
    return row;
  }

  static async create(data, userId) {
    const pool = await poolPromise;
    const r = pool.request();
    FIELDS.forEach(f => r.input(f, sql.NVarChar, String(data[f] || '')));
    r.input('esemenyek', sql.NVarChar, JSON.stringify(data.esemenyek || []));
    r.input('created_by', sql.Int, userId || null);

    const allFields = [...FIELDS, 'esemenyek', 'created_by'];
    const cols = allFields.join(', ');
    const vals = allFields.map(f => `@${f}`).join(', ');

    const result = await r.query(
      `INSERT INTO race_minutes (${cols}) OUTPUT INSERTED.id VALUES (${vals})`
    );
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const r = pool.request().input('id', sql.Int, id);
    FIELDS.forEach(f => r.input(f, sql.NVarChar, String(data[f] || '')));
    r.input('esemenyek', sql.NVarChar, JSON.stringify(data.esemenyek || []));

    const setClause = [...FIELDS, 'esemenyek'].map(f => `${f} = @${f}`).join(', ');
    await r.query(
      `UPDATE race_minutes SET ${setClause}, updated_at = GETDATE() WHERE id = @id`
    );
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM race_minutes WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = RaceMinute;
