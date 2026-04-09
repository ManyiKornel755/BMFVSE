-- Create certificates table for school certificates and other official documents
USE WaveAlertDB;
GO

-- Check if table already exists
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'certificates')
BEGIN
    CREATE TABLE certificates (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        issue_date DATE NOT NULL,
        valid_until DATE NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_certificates_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    PRINT 'certificates table created successfully!';
END
ELSE
BEGIN
    PRINT 'certificates table already exists.';
END
GO
