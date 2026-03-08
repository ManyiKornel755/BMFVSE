const { poolPromise } = require('../src/config/database');

async function addMessageExpiryFields() {
  try {
    console.log('Adding expiry fields to messages table...');
    const pool = await poolPromise;

    // Check if expires_at column already exists
    const checkExpiresAt = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'expires_at'
    `);

    if (checkExpiresAt.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE messages
        ADD expires_at DATETIME NULL
      `);
      console.log('✓ Added expires_at column to messages table');
    } else {
      console.log('✓ expires_at column already exists');
    }

    // Check if deleted_at column already exists
    const checkDeletedAt = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'deleted_at'
    `);

    if (checkDeletedAt.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE messages
        ADD deleted_at DATETIME NULL
      `);
      console.log('✓ Added deleted_at column to messages table');
    } else {
      console.log('✓ deleted_at column already exists');
    }

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Error adding expiry fields:', error);
    throw error;
  } finally {
    process.exit();
  }
}

addMessageExpiryFields();
