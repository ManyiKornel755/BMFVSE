# Adatbázis Migrációk

Ez a könyvtár tartalmazza az adatbázis migrációs scripteket.

## Közlemények (Messages) Funkcionalitás Bővítése

A közlemények funkcióhoz az alábbi migrációkat kell futtatni:

### 1. Lejárat és törlés mezők hozzáadása

Ezt a scriptet futtasd, ha még nem létezik az `expires_at` és `deleted_at` mező a `messages` táblában:

```bash
node scripts/add-message-expiry-columns.js
```

Ez hozzáadja a következő mezőket a `messages` táblához:
- `expires_at` - A közlemény lejárati dátuma
- `deleted_at` - Soft delete támogatás

### 2. Message Recipients tábla létrehozása

Ezt a scriptet futtasd a `message_recipients` tábla létrehozásához:

```bash
node scripts/add-message-recipients-table.js
```

Ez létrehozza a `message_recipients` táblát, ami összeköti a közleményeket a címzettekkel.

### Fontos

Ezeket a scripteket csak akkor futtasd, ha még nem léteznek a megfelelő táblák/mezők az adatbázisban. A scriptek ellenőrzik, hogy már léteznek-e, és csak akkor hoznak létre új elemeket, ha szükséges.

## Teljes adatbázis újraépítés

Ha az egész adatbázist újra akarod építeni, használd a következő fájlokat:

- `database_setup.sql` - Teljes adatbázis struktúra (frissítve a message_recipients táblával)
- `db_reset.sql` - Adatbázis reset script (frissítve a message_recipients táblával)
