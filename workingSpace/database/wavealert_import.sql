-- ============================================================
-- WaveAlert - Teljes adatbázis import fájl
-- BMF VSE Vitorlás Sportegyesület
-- ============================================================
-- Importálás: mysql -u root -p < wavealert_import.sql
-- Vagy MySQL Workbench / phpMyAdmin / DBeaver segítségével
-- ============================================================
-- Alapértelmezett hozzáférési adatok:
--   Admin email:    admin@wavealert.com
--   Admin jelszó:   Admin123!
--   Edző email:     nagy.peter@wavealert.com
--   Edző jelszó:    Jelszo123!
--   Tag email:      kiss.anna@wavealert.com
--   Tag jelszó:     Jelszo123!
-- ============================================================

-- Adatbázis létrehozása
CREATE DATABASE IF NOT EXISTS wavealert
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE wavealert;

-- Ideiglenes kapcsolódási beállítások
SET NAMES utf8mb4;
SET TIME_ZONE = '+01:00';
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- ============================================================
-- TÁBLÁK TÖRLÉSE (tiszta import)
-- ============================================================
DROP TABLE IF EXISTS user_documents;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS `groups`;
DROP TABLE IF EXISTS message_recipients;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS race_participants;
DROP TABLE IF EXISTS race_reports;
DROP TABLE IF EXISTS event_participants;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS user_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- ============================================================
-- TÁBLÁK LÉTREHOZÁSA
-- ============================================================

-- Szerepkörök
CREATE TABLE roles (
    id   INT          PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50)  NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Felhasználók
CREATE TABLE users (
    id            INT          PRIMARY KEY AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    is_member     BOOLEAN      DEFAULT FALSE,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email     (email),
    INDEX idx_is_member (is_member)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Felhasználó–szerepkör kapcsolótábla
CREATE TABLE user_roles (
    user_id     INT NOT NULL,
    role_id     INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tagok kategorizálásához használt cimkék
CREATE TABLE tags (
    id         INT         PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(50) NOT NULL UNIQUE,
    color      VARCHAR(7),
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Felhasználó–cimke kapcsolótábla
CREATE TABLE user_tags (
    user_id     INT NOT NULL,
    tag_id      INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, tag_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Események és edzések
CREATE TABLE events (
    id          INT          PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    event_date  DATETIME     NOT NULL,
    location    VARCHAR(255),
    event_type  VARCHAR(50),
    created_by  INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_event_date (event_date),
    INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Esemény résztvevők
CREATE TABLE event_participants (
    event_id      INT         NOT NULL,
    user_id       INT         NOT NULL,
    status        VARCHAR(50) DEFAULT 'pending',
    registered_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dokumentumok
CREATE TABLE documents (
    id          INT          PRIMARY KEY AUTO_INCREMENT,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    file_path   VARCHAR(500) NOT NULL,
    category    VARCHAR(100),
    uploaded_by INT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Versenyjelentések
CREATE TABLE race_reports (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    race_name  VARCHAR(255) NOT NULL,
    race_date  DATE         NOT NULL,
    location   VARCHAR(255),
    status     VARCHAR(50)  DEFAULT 'draft',
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_race_date (race_date),
    INDEX idx_status    (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verseny résztvevők
CREATE TABLE race_participants (
    id              INT          PRIMARY KEY AUTO_INCREMENT,
    race_report_id  INT          NOT NULL,
    user_id         INT,
    name            VARCHAR(255) NOT NULL,
    sail_number     VARCHAR(50),
    boat_class      VARCHAR(100),
    position        INT,
    notes           TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (race_report_id) REFERENCES race_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)        REFERENCES users(id)         ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Üzenetek / hirdetmények
CREATE TABLE messages (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    title      VARCHAR(255) NOT NULL,
    content    TEXT         NOT NULL,
    status     VARCHAR(50)  DEFAULT 'draft',
    sent_at    TIMESTAMP    NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Üzenet–fogadó kapcsolótábla
CREATE TABLE message_recipients (
    message_id INT       NOT NULL,
    user_id    INT       NOT NULL,
    read_at    TIMESTAMP NULL,
    PRIMARY KEY (message_id, user_id),
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Csoportok (soft-delete támogatással)
CREATE TABLE `groups` (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    name       VARCHAR(255) NOT NULL,
    is_deleted BOOLEAN      DEFAULT FALSE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Csoport–tag kapcsolótábla
CREATE TABLE group_members (
    group_id INT       NOT NULL,
    user_id  INT       NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES `groups`(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(id)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pénzügyi tranzakciók
CREATE TABLE transactions (
    id               INT            PRIMARY KEY AUTO_INCREMENT,
    user_id          INT,
    amount           DECIMAL(12, 2) NOT NULL,
    transaction_type VARCHAR(50)    NOT NULL COMMENT 'income | expense',
    category         VARCHAR(100),
    description      TEXT,
    transaction_date DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP      DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_transaction_type (transaction_type),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_category         (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Felhasználóhoz rendelt dokumentumok (pl. PDF igazolások)
CREATE TABLE user_documents (
    id            INT          PRIMARY KEY AUTO_INCREMENT,
    user_id       INT          NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_path     VARCHAR(500) NOT NULL,
    generated_by  INT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id       (user_id),
    INDEX idx_document_type (document_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ALAPADATOK – SZEREPKÖRÖK
-- ============================================================
INSERT INTO roles (name, description) VALUES
    ('admin', 'Rendszergazda – teljes hozzáférés'),
    ('coach', 'Edző – edzés- és versenykezelés'),
    ('user',  'Tag – alapszintű hozzáférés');

-- ============================================================
-- ALAPADATOK – FELHASZNÁLÓK
-- ============================================================
-- Jelszavak (bcrypt, 10 kör):
--   admin@wavealert.com  →  Admin123!
--   nagy.peter@wavealert.com  →  Jelszo123!
--   kiss.anna@wavealert.com   →  Jelszo123!
--   toth.gabor@wavealert.com  →  Jelszo123!

INSERT INTO users (email, password_hash, first_name, last_name, phone, is_member) VALUES
    ('admin@wavealert.com',
     '$2a$10$s3RKsqiFfHHfIQh2W9OuheI8DUkeG7elY2jNd9mWwDn7cAECFxccK',
     'Admin', 'Felhasználó', '+36 1 234 5678', TRUE),

    ('nagy.peter@wavealert.com',
     '$2a$10$894VzSEeORdvu0kc.k6XQeQThTt/E6PlKmXApf6qhCWlLak3C/kpu',
     'Péter', 'Nagy', '+36 30 123 4567', TRUE),

    ('kiss.anna@wavealert.com',
     '$2a$10$894VzSEeORdvu0kc.k6XQeQThTt/E6PlKmXApf6qhCWlLak3C/kpu',
     'Anna', 'Kiss', '+36 70 987 6543', TRUE),

    ('toth.gabor@wavealert.com',
     '$2a$10$894VzSEeORdvu0kc.k6XQeQThTt/E6PlKmXApf6qhCWlLak3C/kpu',
     'Gábor', 'Tóth', '+36 20 555 1234', FALSE);

-- ============================================================
-- SZEREPKÖR HOZZÁRENDELÉSEK
-- ============================================================
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@wavealert.com' AND r.name = 'admin';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'nagy.peter@wavealert.com' AND r.name = 'coach';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'kiss.anna@wavealert.com' AND r.name = 'user';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'toth.gabor@wavealert.com' AND r.name = 'user';

-- ============================================================
-- CIMKÉK
-- ============================================================
INSERT INTO tags (name, color) VALUES
    ('Versenyző',  '#3B82F6'),
    ('Junior',     '#10B981'),
    ('Veterán',    '#F59E0B'),
    ('Önkéntes',   '#8B5CF6'),
    ('Edzőjelölt', '#EF4444');

-- Cimkék hozzárendelése
INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'kiss.anna@wavealert.com' AND t.name = 'Versenyző';

INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'kiss.anna@wavealert.com' AND t.name = 'Junior';

INSERT INTO user_tags (user_id, tag_id)
SELECT u.id, t.id FROM users u, tags t
WHERE u.email = 'nagy.peter@wavealert.com' AND t.name = 'Versenyző';

-- ============================================================
-- MINTA ESEMÉNYEK / EDZÉSEK
-- ============================================================
INSERT INTO events (title, description, event_date, location, event_type, created_by)
SELECT
    'Tavaszi nyitóedzés',
    'Az idény első edzése a Lupa-tónál. Kérjük hozzák a felszerelésüket!',
    DATE_ADD(NOW(), INTERVAL 7 DAY),
    'Lupa-tó, Budapest',
    'training',
    u.id
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

INSERT INTO events (title, description, event_date, location, event_type, created_by)
SELECT
    'Technikai edzés – hajókormányzás',
    'Középhaladó edzés navigációs és kormányzási technikák fejlesztésére.',
    DATE_ADD(NOW(), INTERVAL 14 DAY),
    'Velencei-tó, Gárdony',
    'training',
    u.id
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

INSERT INTO events (title, description, event_date, location, event_type, created_by)
SELECT
    'Nyílt bajnokság 2025',
    'BMF VSE éves nyílt bajnoksága. Nevezési határidő: esemény előtt 5 nappal.',
    DATE_ADD(NOW(), INTERVAL 30 DAY),
    'Balatonfüred Yacht Club',
    'race',
    u.id
FROM users u WHERE u.email = 'admin@wavealert.com';

INSERT INTO events (title, description, event_date, location, event_type, created_by)
SELECT
    'Taggyűlés – 2025. I. negyedév',
    'Negyedéves taggyűlés: gazdálkodási és versenyzési összefoglaló.',
    DATE_ADD(NOW(), INTERVAL 21 DAY),
    'BMF VSE Klub, Budapest',
    'meeting',
    u.id
FROM users u WHERE u.email = 'admin@wavealert.com';

-- ============================================================
-- MINTA VERSENYJELENTÉSEK
-- ============================================================
INSERT INTO race_reports (race_name, race_date, location, status, created_by)
SELECT
    'Téli kupa 2025',
    DATE_SUB(CURDATE(), INTERVAL 30 DAY),
    'Velencei-tó',
    'published',
    u.id
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

INSERT INTO race_reports (race_name, race_date, location, status, created_by)
SELECT
    'Tavaszi Selejtező',
    DATE_SUB(CURDATE(), INTERVAL 7 DAY),
    'Lupa-tó',
    'draft',
    u.id
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

-- Verseny résztvevők az első versenyhez
INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position)
SELECT rr.id, u.id, CONCAT(u.last_name, ' ', u.first_name), 'HUN-101', 'Laser', 1
FROM race_reports rr, users u
WHERE rr.race_name = 'Téli kupa 2025' AND u.email = 'kiss.anna@wavealert.com';

INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position)
SELECT rr.id, u.id, CONCAT(u.last_name, ' ', u.first_name), 'HUN-202', 'Laser', 2
FROM race_reports rr, users u
WHERE rr.race_name = 'Téli kupa 2025' AND u.email = 'toth.gabor@wavealert.com';

INSERT INTO race_participants (race_report_id, user_id, name, sail_number, boat_class, position)
SELECT rr.id, NULL, 'Szabó Béla', 'HUN-303', 'Laser', 3
FROM race_reports rr
WHERE rr.race_name = 'Téli kupa 2025';

-- ============================================================
-- MINTA ÜZENETEK
-- ============================================================
INSERT INTO messages (title, content, status, sent_at, created_by)
SELECT
    'Üdvözöljük a WaveAlert rendszerben!',
    'Kedves Tagok!\n\nÖröm üdvözölni Önöket a BMF VSE WaveAlert rendszerében. '
    'A platformon keresztül követhetik az edzéseket, versenyeket, és egymással is '
    'kommunikálhatnak.\n\nJó vitorlázást!\nAz Egyesület Vezetősége',
    'sent',
    NOW(),
    u.id
FROM users u WHERE u.email = 'admin@wavealert.com';

INSERT INTO messages (title, content, status, created_by)
SELECT
    'Tavaszi edzésterv közzétéve',
    'Kedves Tagok!\n\nA 2025-ös tavaszi edzésterv elkészült. '
    'Kérjük, jelezzék részvételi szándékukat az esemény oldalán.\n\nNagy Péter edző',
    'draft',
    u.id
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

-- Üzenet kézbesítés
INSERT INTO message_recipients (message_id, user_id)
SELECT m.id, u.id
FROM messages m, users u
WHERE m.title = 'Üdvözöljük a WaveAlert rendszerben!'
  AND u.email IN ('nagy.peter@wavealert.com', 'kiss.anna@wavealert.com', 'toth.gabor@wavealert.com');

-- ============================================================
-- MINTA CSOPORTOK
-- ============================================================
INSERT INTO `groups` (name, created_by)
SELECT 'Versenyzők', u.id FROM users u WHERE u.email = 'admin@wavealert.com';

INSERT INTO `groups` (name, created_by)
SELECT 'Junior csapat', u.id FROM users u WHERE u.email = 'admin@wavealert.com';

INSERT INTO `groups` (name, created_by)
SELECT 'Szervezők', u.id FROM users u WHERE u.email = 'admin@wavealert.com';

-- Csoport tagok
INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id FROM `groups` g, users u
WHERE g.name = 'Versenyzők'
  AND u.email IN ('kiss.anna@wavealert.com', 'toth.gabor@wavealert.com', 'nagy.peter@wavealert.com');

INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id FROM `groups` g, users u
WHERE g.name = 'Junior csapat' AND u.email = 'kiss.anna@wavealert.com';

INSERT INTO group_members (group_id, user_id)
SELECT g.id, u.id FROM `groups` g, users u
WHERE g.name = 'Szervezők' AND u.email IN ('admin@wavealert.com', 'nagy.peter@wavealert.com');

-- ============================================================
-- MINTA TRANZAKCIÓK
-- ============================================================
INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
SELECT u.id, 50000.00, 'income', 'tagdíj', 'Éves tagdíj – Kiss Anna 2025', DATE_SUB(NOW(), INTERVAL 60 DAY)
FROM users u WHERE u.email = 'kiss.anna@wavealert.com';

INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
SELECT u.id, 50000.00, 'income', 'tagdíj', 'Éves tagdíj – Nagy Péter 2025', DATE_SUB(NOW(), INTERVAL 55 DAY)
FROM users u WHERE u.email = 'nagy.peter@wavealert.com';

INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
VALUES (NULL, 120000.00, 'expense', 'felszerelés', 'Vitorla javítás – 2 db', DATE_SUB(NOW(), INTERVAL 45 DAY));

INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
VALUES (NULL, 35000.00, 'expense', 'rendezvény', 'Téli kupa szervezési költség', DATE_SUB(NOW(), INTERVAL 35 DAY));

INSERT INTO transactions (user_id, amount, transaction_type, category, description, transaction_date)
VALUES (NULL, 200000.00, 'income', 'támogatás', 'BMF Egyetem éves támogatás', DATE_SUB(NOW(), INTERVAL 20 DAY));

-- ============================================================
SET FOREIGN_KEY_CHECKS = 1;
-- ============================================================
-- Import sikeresen befejezve!
-- Adatbázis: wavealert
-- Táblák: 16
-- ============================================================
