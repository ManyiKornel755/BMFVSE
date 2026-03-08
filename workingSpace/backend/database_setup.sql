-- =============================================
-- WaveAlert SQL Server Adatbázis Beállítás
-- Futtasd ezt a scriptet SQL Server Management Studio-ban
-- =============================================

-- 1. Adatbázis létrehozása
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'WaveAlertDB')
BEGIN
    CREATE DATABASE WaveAlertDB;
END
GO

USE WaveAlertDB;
GO

-- 2. Login és User létrehozása
IF NOT EXISTS (SELECT * FROM sys.server_principals WHERE name = 'webuser')
BEGIN
    CREATE LOGIN webuser WITH PASSWORD = 'ErősJelszó123';
END
GO

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'webuser')
BEGIN
    CREATE USER webuser FOR LOGIN webuser;
    ALTER ROLE db_owner ADD MEMBER webuser;
END
GO

-- =============================================
-- 3. Táblák létrehozása
-- =============================================

-- Users tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) UNIQUE NOT NULL,
        password NVARCHAR(255) NOT NULL,
        phone NVARCHAR(50) NULL,
        address NVARCHAR(500) NULL,
        is_member BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );

    CREATE INDEX idx_users_email ON users(email);
END
GO

-- Roles tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'roles')
BEGIN
    CREATE TABLE roles (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(50) UNIQUE NOT NULL,
        description NVARCHAR(255) NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
END
GO

-- User_Roles kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_roles')
BEGIN
    CREATE TABLE user_roles (
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );
END
GO

-- Messages tábla (hírlevelek)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'messages')
BEGIN
    CREATE TABLE messages (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(500) NOT NULL,
        content NVARCHAR(MAX) NOT NULL,
        status NVARCHAR(20) DEFAULT 'draft',
        created_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        sent_at DATETIME2 NULL,
        expires_at DATETIME2 NULL,
        deleted_at DATETIME2 NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
END
GO

-- Message_Recipients tábla (üzenet címzettek)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'message_recipients')
BEGIN
    CREATE TABLE message_recipients (
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        read_at DATETIME2 NULL,
        PRIMARY KEY (message_id, user_id),
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- User_Documents tábla (PDF dokumentumok)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_documents')
BEGIN
    CREATE TABLE user_documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        document_type NVARCHAR(100) NOT NULL,
        file_path NVARCHAR(1000) NOT NULL,
        generated_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Transactions tábla (pénzügyi tranzakciók)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'transactions')
BEGIN
    CREATE TABLE transactions (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        transaction_type NVARCHAR(50) NOT NULL,
        category NVARCHAR(100) NULL,
        description NVARCHAR(500) NULL,
        transaction_date DATETIME2 DEFAULT GETDATE(),
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
    CREATE INDEX idx_transactions_user ON transactions(user_id);
END
GO

-- =============================================
-- 4. Alapértelmezett adatok
-- =============================================

IF NOT EXISTS (SELECT * FROM roles WHERE name = 'admin')
BEGIN
    INSERT INTO roles (name, description) VALUES
    ('admin', 'Rendszergazda - teljes hozzáférés'),
    ('member', 'Egyesületi tag'),
    ('trainer', 'Edző'),
    ('captain', 'Kapitány');
END
GO

-- =============================================
-- 5. Trigger az updated_at mezőhöz
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'trg_users_updated')
BEGIN
    EXEC('
    CREATE TRIGGER trg_users_updated
    ON users AFTER UPDATE
    AS
    BEGIN
        SET NOCOUNT ON;
        UPDATE users SET updated_at = GETDATE()
        FROM users u INNER JOIN inserted i ON u.id = i.id;
    END
    ');
END
GO

PRINT 'Adatbazis sikeresen letrehozva!';
PRINT '';
PRINT 'Kovetkezo lepesek:';
PRINT '1. Ellenorizd a .env fajlt a backend mappaban';
PRINT '2. Futtasd: npm run dev';
GO

-- =============================================
-- 6. Kiegészítő táblák
-- =============================================

-- Groups tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'groups')
BEGIN
    CREATE TABLE groups (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        created_by INT NULL,
        is_deleted BIT DEFAULT 0,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Group_Members kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'group_members')
BEGIN
    CREATE TABLE group_members (
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (group_id, user_id),
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Events tábla (edzések és események)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'events')
BEGIN
    CREATE TABLE events (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        event_date DATETIME2 NOT NULL,
        location NVARCHAR(255) NULL,
        event_type NVARCHAR(50) NULL,
        target_group_id INT NULL,
        created_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (target_group_id) REFERENCES groups(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX idx_events_date ON events(event_date);
END
GO

-- Event_Participants kapcsolótábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'event_participants')
BEGIN
    CREATE TABLE event_participants (
        event_id INT NOT NULL,
        user_id INT NOT NULL,
        status NVARCHAR(20) DEFAULT 'pending',
        registered_at DATETIME2 DEFAULT GETDATE(),
        PRIMARY KEY (event_id, user_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
END
GO

-- Documents tábla (feltöltött fájlok)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'documents')
BEGIN
    CREATE TABLE documents (
        id INT IDENTITY(1,1) PRIMARY KEY,
        title NVARCHAR(255) NOT NULL,
        description NVARCHAR(MAX) NULL,
        file_path NVARCHAR(500) NOT NULL,
        category NVARCHAR(100) NULL,
        uploaded_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Race_Reports tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'race_reports')
BEGIN
    CREATE TABLE race_reports (
        id INT IDENTITY(1,1) PRIMARY KEY,
        race_name NVARCHAR(255) NOT NULL,
        race_date DATETIME2 NOT NULL,
        location NVARCHAR(255) NULL,
        status NVARCHAR(20) DEFAULT 'draft',
        notes NVARCHAR(MAX) NULL,
        created_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

-- Race_Participants tábla
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'race_participants')
BEGIN
    CREATE TABLE race_participants (
        id INT IDENTITY(1,1) PRIMARY KEY,
        race_report_id INT NOT NULL,
        user_id INT NULL,
        name NVARCHAR(255) NOT NULL,
        sail_number NVARCHAR(50) NULL,
        boat_class NVARCHAR(100) NULL,
        position INT NULL,
        notes NVARCHAR(MAX) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (race_report_id) REFERENCES race_reports(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
END
GO

PRINT 'Kiegeszito tablak letrehozva!';
GO
