const { sql, poolPromise } = require('../config/database');

class Document {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM documents ORDER BY created_at DESC');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM documents WHERE id = @id');
    return result.recordset[0] || null;
  }

  static async create({ title, description, file_path, category, uploaded_by = null }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('title', sql.NVarChar, title)
      .input('description', sql.NVarChar, description || null)
      .input('file_path', sql.NVarChar, file_path)
      .input('category', sql.NVarChar, category || null)
      .input('uploaded_by', sql.Int, uploaded_by)
      .query('INSERT INTO documents (title, description, file_path, category, uploaded_by) OUTPUT INSERTED.id VALUES (@title, @description, @file_path, @category, @uploaded_by)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];
    const allowed = ['title', 'description', 'category'];
    allowed.forEach(key => {
      if (data[key] !== undefined) {
        fields.push(`${key} = @${key}`);
        request.input(key, sql.NVarChar, data[key]);
      }
    });
    if (fields.length === 0) throw new Error('No fields to update');
    await request.query(`UPDATE documents SET ${fields.join(', ')} WHERE id = @id`);
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM documents WHERE id = @id');
    return result.rowsAffected[0] > 0;
  }
}

module.exports = Document;
