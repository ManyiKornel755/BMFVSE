-- Üzenet címzettek tábla létrehozása
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'message_recipients')
BEGIN
  CREATE TABLE message_recipients (
    id INT IDENTITY(1,1) PRIMARY KEY,
    message_id INT NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (message_id, user_id)
  );

  PRINT 'message_recipients tábla sikeresen létrehozva.';
END
ELSE
BEGIN
  PRINT 'message_recipients tábla már létezik.';
END
