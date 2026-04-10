-- Add school_name field to users table for certificate data
USE WaveAlertDB;
GO

-- Check if column already exists
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('users')
    AND name = 'school_name'
)
BEGIN
    ALTER TABLE users
    ADD school_name NVARCHAR(255) NULL;

    PRINT 'school_name column added successfully to users table!';
END
ELSE
BEGIN
    PRINT 'school_name column already exists in users table.';
END
GO
