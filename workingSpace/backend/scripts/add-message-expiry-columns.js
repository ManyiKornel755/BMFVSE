const { sql, poolPromise } = require('../src/config/database');

async function addMessageExpiryColumns() {
  try {
    console.log('Connecting to database...');
    const pool = await poolPromise;

    console.log('Checking for expires_at column...');

    // Check if expires_at column exists
    const expiresAtExists = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'expires_at'
    `);

    if (expiresAtExists.recordset.length === 0) {
      console.log('Adding expires_at column to messages table...');
      await pool.request().query(`
        ALTER TABLE messages
        ADD expires_at DATETIME2 NULL
      `);
      console.log('expires_at column added successfully!');
    } else {
      console.log('expires_at column already exists');
    }

    console.log('Checking for deleted_at column...');

    // Check if deleted_at column exists
    const deletedAtExists = await pool.request().query(`
      SELECT * FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'messages' AND COLUMN_NAME = 'deleted_at'
    `);

    if (deletedAtExists.recordset.length === 0) {
      console.log('Adding deleted_at column to messages table...');
      await pool.request().query(`
        ALTER TABLE messages
        ADD deleted_at DATETIME2 NULL
      `);
      console.log('deleted_at column added successfully!');
    } else {
      console.log('deleted_at column already exists');
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Error adding columns:', error);
    throw error;
  } finally {
    process.exit();
  }
}

addMessageExpiryColumns();
