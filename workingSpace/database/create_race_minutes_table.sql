-- Verseny jegyzőkönyvek tábla létrehozása
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'race_minutes')
BEGIN
  CREATE TABLE race_minutes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(255) NOT NULL,
    race_date DATETIME2 NOT NULL,
    location NVARCHAR(255),
    organizer NVARCHAR(255),
    weather_conditions NVARCHAR(MAX),
    participants_count INT,
    boat_classes NVARCHAR(255),
    content NVARCHAR(MAX),
    created_by INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  PRINT 'race_minutes tábla sikeresen létrehozva.';
END
ELSE
BEGIN
  PRINT 'race_minutes tábla már létezik.';
END
