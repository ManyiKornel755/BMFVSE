const { sql, poolPromise } = require('../src/config/database');

async function createMessageRecipientsTable() {
  try {
    console.log('Connecting to database...');
    const pool = await poolPromise;

    console.log('Creating message_recipients table...');

    // Check if table exists
    const checkTableQuery = `
      SELECT * FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_NAME = 'message_recipients'
    `;

    const tableExists = await pool.request().query(checkTableQuery);

    if (tableExists.recordset.length > 0) {
      console.log('message_recipients table already exists');
      return;
    }

    // Create table
    await pool.request().query(`
      CREATE TABLE message_recipients (
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        read_at DATETIME2 NULL,
        PRIMARY KEY (message_id, user_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('message_recipients table created successfully!');

  } catch (error) {
    console.error('Error creating message_recipients table:', error);
    throw error;
  } finally {
    process.exit();
  }
}

createMessageRecipientsTable();
