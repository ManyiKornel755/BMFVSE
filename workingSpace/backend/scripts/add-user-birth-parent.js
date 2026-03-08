const { poolPromise } = require('../src/config/database');

async function addUserBirthAndParentFields() {
  try {
    console.log('Adding birth_date and parent fields to users table...');
    const pool = await poolPromise;

    // Check if birth_date column already exists
    const checkBirthDate = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'birth_date'
    `);

    if (checkBirthDate.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users
        ADD birth_date DATE NULL
      `);
      console.log('✓ Added birth_date column to users table');
    } else {
      console.log('✓ birth_date column already exists');
    }

    // Check if parent_name column already exists
    const checkParentName = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'parent_name'
    `);

    if (checkParentName.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users
        ADD parent_name NVARCHAR(255) NULL
      `);
      console.log('✓ Added parent_name column to users table');
    } else {
      console.log('✓ parent_name column already exists');
    }

    // Check if parent_email column already exists
    const checkParentEmail = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'parent_email'
    `);

    if (checkParentEmail.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users
        ADD parent_email NVARCHAR(255) NULL
      `);
      console.log('✓ Added parent_email column to users table');
    } else {
      console.log('✓ parent_email column already exists');
    }

    // Check if parent_phone column already exists
    const checkParentPhone = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'parent_phone'
    `);

    if (checkParentPhone.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users
        ADD parent_phone NVARCHAR(50) NULL
      `);
      console.log('✓ Added parent_phone column to users table');
    } else {
      console.log('✓ parent_phone column already exists');
    }

    // Check if relationship column already exists
    const checkRelationship = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'relationship'
    `);

    if (checkRelationship.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE users
        ADD relationship NVARCHAR(50) NULL
      `);
      console.log('✓ Added relationship column to users table');
    } else {
      console.log('✓ relationship column already exists');
    }

    console.log('✓ Migration completed successfully');
  } catch (error) {
    console.error('Error adding user fields:', error);
    throw error;
  } finally {
    process.exit();
  }
}

addUserBirthAndParentFields();
