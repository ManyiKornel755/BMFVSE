const { sql, poolPromise } = require('../config/database');

class Group {
  static async getAll() {
    const pool = await poolPromise;
    const result = await pool.request()
      .query('SELECT * FROM groups WHERE is_deleted = 0 ORDER BY name');
    return result.recordset;
  }

  static async findById(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM groups WHERE id = @id AND is_deleted = 0');
    return result.recordset[0] || null;
  }

  static async create({ name, created_by }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('name', sql.NVarChar, name)
      .input('created_by', sql.Int, created_by)
      .query('INSERT INTO groups (name, created_by) OUTPUT INSERTED.id VALUES (@name, @created_by)');
    return this.findById(result.recordset[0].id);
  }

  static async update(id, { name }) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .input('name', sql.NVarChar, name)
      .query('UPDATE groups SET name = @name WHERE id = @id AND is_deleted = 0');
    if (result.rowsAffected[0] === 0) throw new Error('Group not found');
    return this.findById(id);
  }

  static async delete(id) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query('UPDATE groups SET is_deleted = 1 WHERE id = @id');
    if (result.rowsAffected[0] === 0) throw new Error('Group not found');
    return { message: 'Group deleted successfully' };
  }

  static async getMembers(groupId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .query(`
        SELECT u.id, u.email, u.name, u.phone, gm.joined_at
        FROM users u
        INNER JOIN group_members gm ON u.id = gm.user_id
        WHERE gm.group_id = @groupId
        ORDER BY u.name
      `);
    return result.recordset;
  }

  static async addMember(groupId, userId) {
    const pool = await poolPromise;
    const check = await pool.request()
      .input('groupId', sql.Int, groupId)
      .input('userId', sql.Int, userId)
      .query('SELECT 1 FROM group_members WHERE group_id = @groupId AND user_id = @userId');
    if (check.recordset.length > 0) throw new Error('User is already a member of this group');
    await pool.request()
      .input('groupId', sql.Int, groupId)
      .input('userId', sql.Int, userId)
      .query('INSERT INTO group_members (group_id, user_id) VALUES (@groupId, @userId)');
    return { groupId, userId };
  }

  static async removeMember(groupId, userId) {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('groupId', sql.Int, groupId)
      .input('userId', sql.Int, userId)
      .query('DELETE FROM group_members WHERE group_id = @groupId AND user_id = @userId');
    if (result.rowsAffected[0] === 0) throw new Error('Member not found in group');
    return { message: 'Member removed successfully' };
  }

  static async addMembers(groupId, userIds) {
    if (!Array.isArray(userIds) || userIds.length === 0) throw new Error('userIds must be a non-empty array');
    const pool = await poolPromise;
    let addedCount = 0;
    for (const userId of userIds) {
      const check = await pool.request()
        .input('groupId', sql.Int, groupId)
        .input('userId', sql.Int, userId)
        .query('SELECT 1 FROM group_members WHERE group_id = @groupId AND user_id = @userId');
      if (check.recordset.length === 0) {
        await pool.request()
          .input('groupId', sql.Int, groupId)
          .input('userId', sql.Int, userId)
          .query('INSERT INTO group_members (group_id, user_id) VALUES (@groupId, @userId)');
        addedCount++;
      }
    }
    return { groupId, addedCount };
  }

  static async getAllWithMemberCount() {
    const pool = await poolPromise;
    const result = await pool.request().query(`
      SELECT g.*, COUNT(gm.user_id) as member_count
      FROM groups g
      LEFT JOIN group_members gm ON g.id = gm.group_id
      WHERE g.is_deleted = 0
      GROUP BY g.id, g.name, g.created_by, g.is_deleted, g.created_at, g.updated_at
      ORDER BY g.name
    `);
    return result.recordset;
  }
}

module.exports = Group;
