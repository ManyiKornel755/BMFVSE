-- Migration: Create message_recipients table for SQL Server
-- This table stores the recipients for each message

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'message_recipients')
BEGIN
    CREATE TABLE message_recipients (
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        read_at DATETIME2 NULL,
        PRIMARY KEY (message_id, user_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    PRINT 'message_recipients table created successfully';
END
ELSE
BEGIN
    PRINT 'message_recipients table already exists';
END
GO
