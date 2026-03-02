const { sql, poolPromise } = require('../config/database');

class UserDocument {
  static async getByUserId(userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT ud.*, u.name as user_name, u.email as user_email,
               g.name as generated_by_name, g.email as generated_by_email
        FROM user_documents ud
        LEFT JOIN users u ON ud.user_id = u.id
        LEFT JOIN users g ON ud.generated_by = g.id
        WHERE ud.user_id = @userId
        ORDER BY ud.created_at DESC
      `);
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT ud.*, u.name as user_name, u.email as user_email,
               g.name as generated_by_name, g.email as generated_by_email
        FROM user_documents ud
        LEFT JOIN users u ON ud.user_id = u.id
        LEFT JOIN users g ON ud.generated_by = g.id
        WHERE ud.id = @id
      `);
    return result.recordset[0] || null;
  }

  static async create({ user_id, document_type, file_path, generated_by }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('document_type', sql.NVarChar, document_type)
      .input('file_path', sql.NVarChar, file_path)
      .input('generated_by', sql.Int, generated_by)
      .query('INSERT INTO user_documents (user_id, document_type, file_path, generated_by) OUTPUT INSERTED.id VALUES (@user_id, @document_type, @file_path, @generated_by)');
    return this.findById(result.recordset[0].id);
  }

  static async delete(id) {
    const document = await this.findById(id);
    if (!document) throw new Error('Document not found');

    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM user_documents WHERE id = @id');

    if (result.rowsAffected[0] === 0) throw new Error('Document not found');
    return { message: 'Document deleted successfully', file_path: document.file_path };
  }

  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT ud.*, u.name as user_name, u.email as user_email,
             g.name as generated_by_name, g.email as generated_by_email
      FROM user_documents ud
      LEFT JOIN users u ON ud.user_id = u.id
      LEFT JOIN users g ON ud.generated_by = g.id
      ORDER BY ud.created_at DESC
    `);
    return result.recordset;
  }
}

module.exports = UserDocument;
