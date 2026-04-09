-- Migration: Add end_date column to events table
USE WaveAlertDB;
GO

-- Ellenorizzuk, hogy letezik-e mar az oszlop
IF NOT EXISTS (
    SELECT * FROM sys.columns
    WHERE object_id = OBJECT_ID(N'events')
    AND name = 'end_date'
)
BEGIN
    ALTER TABLE events ADD end_date DATETIME2 NULL;
    PRINT 'end_date oszlop hozzaadva az events tablaba.';
END
ELSE
BEGIN
    PRINT 'end_date oszlop mar letezik az events tablaban.';
END
GO
