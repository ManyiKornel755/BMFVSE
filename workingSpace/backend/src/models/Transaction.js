const { sql, poolPromise } = require('../config/database');

class Transaction {
  static async getAll(filters = {}) {
    const pool = await poolPromise;
    const request = pool.request();
    let query = `
      SELECT t.*, u.name as user_name, u.email as user_email
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;

    if (filters.user_id) {
      request.input('user_id', sql.Int, filters.user_id);
      query += ' AND t.user_id = @user_id';
    }
    if (filters.transaction_type) {
      request.input('transaction_type', sql.NVarChar, filters.transaction_type);
      query += ' AND t.transaction_type = @transaction_type';
    }
    if (filters.category) {
      request.input('category', sql.NVarChar, filters.category);
      query += ' AND t.category = @category';
    }
    if (filters.start_date) {
      request.input('start_date', sql.DateTime2, new Date(filters.start_date));
      query += ' AND t.transaction_date >= @start_date';
    }
    if (filters.end_date) {
      request.input('end_date', sql.DateTime2, new Date(filters.end_date));
      query += ' AND t.transaction_date <= @end_date';
    }

    query += ' ORDER BY t.transaction_date DESC, t.created_at DESC';
    const result = await request.query(query);
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT t.*, u.name as user_name, u.email as user_email
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = @id
      `);
    return result.recordset[0] || null;
  }

  static async create({ user_id, amount, transaction_type, category, description }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('amount', sql.Decimal(10, 2), amount)
      .input('transaction_type', sql.NVarChar, transaction_type)
      .input('category', sql.NVarChar, category || null)
      .input('description', sql.NVarChar, description || null)
      .query('INSERT INTO transactions (user_id, amount, transaction_type, category, description) OUTPUT INSERTED.id VALUES (@user_id, @amount, @transaction_type, @category, @description)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, data) {
    const pool = await poolPromise;
    const request = pool.request().input('id', sql.Int, id);
    const fields = [];

    if (data.user_id !== undefined) { fields.push('user_id = @user_id'); request.input('user_id', sql.Int, data.user_id); }
    if (data.amount !== undefined) { fields.push('amount = @amount'); request.input('amount', sql.Decimal(10, 2), data.amount); }
    if (data.transaction_type !== undefined) { fields.push('transaction_type = @transaction_type'); request.input('transaction_type', sql.NVarChar, data.transaction_type); }
    if (data.category !== undefined) { fields.push('category = @category'); request.input('category', sql.NVarChar, data.category); }
    if (data.description !== undefined) { fields.push('description = @description'); request.input('description', sql.NVarChar, data.description); }
    if (data.transaction_date !== undefined) { fields.push('transaction_date = @transaction_date'); request.input('transaction_date', sql.DateTime2, new Date(data.transaction_date)); }

    if (fields.length === 0) throw new Error('No fields to update');

    const result = await request.query(`UPDATE transactions SET ${fields.join(', ')} WHERE id = @id`);
    if (result.rowsAffected[0] === 0) throw new Error('Transaction not found');
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM transactions WHERE id = @id');
    if (result.rowsAffected[0] === 0) throw new Error('Transaction not found');
    return { message: 'Transaction deleted successfully' };
  }

  static async getStats() {
    const pool = await poolPromise;
    const byCat = await pool.request().query(`
      SELECT transaction_type, category,
        COUNT(*) as count,
        SUM(amount) as total,
        AVG(amount) as average,
        MIN(amount) as minimum,
        MAX(amount) as maximum
      FROM transactions
      GROUP BY transaction_type, category
      ORDER BY transaction_type, category
    `);
    const totals = await pool.request().query(`
      SELECT
        SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(CASE WHEN transaction_type = 'income' THEN 1 END) as income_count,
        COUNT(CASE WHEN transaction_type = 'expense' THEN 1 END) as expense_count
      FROM transactions
    `);
    const t = totals.recordset[0];
    return {
      by_category: byCat.recordset,
      totals: {
        total_income: t.total_income || 0,
        total_expense: t.total_expense || 0,
        balance: (t.total_income || 0) - (t.total_expense || 0),
        income_count: t.income_count,
        expense_count: t.expense_count
      }
    };
  }
}

module.exports = Transaction;
