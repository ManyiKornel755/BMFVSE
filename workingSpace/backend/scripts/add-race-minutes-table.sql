USE WaveAlertDB;
GO

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'race_minutes')
BEGIN
    CREATE TABLE race_minutes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        verseny_neve NVARCHAR(255) NULL,
        helye NVARCHAR(255) NULL,
        ideje NVARCHAR(100) NULL,
        rendezoje NVARCHAR(255) NULL,
        versenyvezeto NVARCHAR(255) NULL,
        jegyzokonyvvezeto NVARCHAR(255) NULL,
        korosztaly NVARCHAR(100) NULL,
        palya_jellege NVARCHAR(100) NULL,
        futam_szama NVARCHAR(50) NULL,
        rajthajo NVARCHAR(255) NULL,
        celhajo NVARCHAR(255) NULL,
        motorosok NVARCHAR(500) NULL,
        birosag_elnok NVARCHAR(255) NULL,
        birosag_birok NVARCHAR(500) NULL,
        szel_rajtnal NVARCHAR(255) NULL,
        szel_futam_kozben NVARCHAR(255) NULL,
        elrajtoltak_szama NVARCHAR(MAX) NULL,
        nem_rajtoltak NVARCHAR(MAX) NULL,
        nem_futottak NVARCHAR(MAX) NULL,
        korai_rajtolok NVARCHAR(MAX) NULL,
        z_lobogos NVARCHAR(MAX) NULL,
        fekete_lobogos NVARCHAR(MAX) NULL,
        ovast_bejelento NVARCHAR(MAX) NULL,
        elsonek_ideje NVARCHAR(100) NULL,
        utolsonak_ideje NVARCHAR(100) NULL,
        esemenyek NVARCHAR(MAX) NULL,
        created_by INT NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );
    PRINT 'race_minutes tabla letrehozva.';
END
ELSE
BEGIN
    PRINT 'race_minutes tabla mar letezik.';
END
GO
