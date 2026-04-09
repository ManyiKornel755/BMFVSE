-- Edző hozzárendelés mező hozzáadása az events táblához
USE WaveAlertDB;
GO

-- Ellenőrizzük, hogy létezik-e már a mező
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID('events')
    AND name = 'assigned_coach_id'
)
BEGIN
    ALTER TABLE events
    ADD assigned_coach_id INT NULL;

    ALTER TABLE events
    ADD CONSTRAINT FK_events_assigned_coach
    FOREIGN KEY (assigned_coach_id) REFERENCES users(id) ON DELETE NO ACTION;

    PRINT 'assigned_coach_id mező sikeresen hozzáadva az events táblához!';
END
ELSE
BEGIN
    PRINT 'assigned_coach_id mező már létezik az events táblában.';
END
GO
