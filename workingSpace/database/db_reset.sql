USE WaveAlertDB;
GO

-- Minden tábla törlése (helyes sorrendben, FK miatt)
IF OBJECT_ID('event_participants', 'U') IS NOT NULL DROP TABLE event_participants;
IF OBJECT_ID('race_participants', 'U') IS NOT NULL DROP TABLE race_participants;
IF OBJECT_ID('group_members', 'U') IS NOT NULL DROP TABLE group_members;
IF OBJECT_ID('user_roles', 'U') IS NOT NULL DROP TABLE user_roles;
IF OBJECT_ID('user_documents', 'U') IS NOT NULL DROP TABLE user_documents;
IF OBJECT_ID('transactions', 'U') IS NOT NULL DROP TABLE transactions;
IF OBJECT_ID('members', 'U') IS NOT NULL DROP TABLE members;
IF OBJECT_ID('messages', 'U') IS NOT NULL DROP TABLE messages;
IF OBJECT_ID('documents', 'U') IS NOT NULL DROP TABLE documents;
IF OBJECT_ID('events', 'U') IS NOT NULL DROP TABLE events;
IF OBJECT_ID('race_reports', 'U') IS NOT NULL DROP TABLE race_reports;
IF OBJECT_ID('group_members', 'U') IS NOT NULL DROP TABLE group_members;
IF OBJECT_ID('groups', 'U') IS NOT NULL DROP TABLE groups;
IF OBJECT_ID('trainings', 'U') IS NOT NULL DROP TABLE trainings;
IF OBJECT_ID('roles', 'U') IS NOT NULL DROP TABLE roles;
IF OBJECT_ID('users', 'U') IS NOT NULL DROP TABLE users;
GO
PRINT 'Minden tabla torolve.';
GO

-- Users tabla
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
GO

-- Roles tabla
CREATE TABLE roles (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(255) NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);
INSERT INTO roles (name, description) VALUES
('admin', 'Rendszergazda'),
('member', 'Tag'),
('coach', 'Edzo'),
('captain', 'Kapitany');
GO

-- User_roles tabla
CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    assigned_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
GO

-- Messages tabla
CREATE TABLE messages (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
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
GO

-- Message_recipients tabla
CREATE TABLE message_recipients (
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at DATETIME2 NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- User_documents tabla
CREATE TABLE user_documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    document_type NVARCHAR(100) NOT NULL,
    file_path NVARCHAR(1000) NOT NULL,
    generated_by INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE NO ACTION
);
GO

-- Transactions tabla
CREATE TABLE transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type NVARCHAR(20) NOT NULL,
    category NVARCHAR(100) NULL,
    description NVARCHAR(500) NULL,
    transaction_date DATETIME2 DEFAULT GETDATE(),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX idx_transactions_user ON transactions(user_id);
GO

-- Groups tabla
CREATE TABLE groups (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    created_by INT NULL,
    is_deleted BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
GO

-- Group_members tabla
CREATE TABLE group_members (
    group_id INT NOT NULL,
    user_id INT NOT NULL,
    joined_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- Events tabla
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
CREATE INDEX idx_events_date ON events(event_date DESC);
GO

-- Event_participants tabla
CREATE TABLE event_participants (
    event_id INT NOT NULL,
    user_id INT NOT NULL,
    status NVARCHAR(20) DEFAULT 'pending',
    registered_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
GO

-- Documents tabla
CREATE TABLE documents (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX) NULL,
    file_path NVARCHAR(1000) NOT NULL,
    category NVARCHAR(100) NULL,
    uploaded_by INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);
GO

-- Race_reports tabla
CREATE TABLE race_reports (
    id INT IDENTITY(1,1) PRIMARY KEY,
    race_name NVARCHAR(255) NOT NULL,
    race_date DATETIME2 NOT NULL,
    location NVARCHAR(255) NULL,
    status NVARCHAR(20) DEFAULT 'draft',
    notes NVARCHAR(MAX) NULL,
    created_by INT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);
GO

-- Race_participants tabla
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
GO

PRINT 'Adatbazis sikeresen ujraletrehozva!';
GO
