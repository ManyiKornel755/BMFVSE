# BMFVSE WaveAlert

Webalkalmazás a BMFVSE sportegyesület működésének menedzseléséhez, beleértve az edzések szervezését, tagsági nyilvántartást, versenyjegyzőkönyveket és belső kommunikációt.

## Projekt áttekintés

A WaveAlert egy átfogó adminisztrációs rendszer a Balatonmáriafürdői Vízisport Egyesülete számára. A platform lehetővé teszi az adminisztrátorok és edzők számára az egyesületi tevékenységek hatékony kezelését, a tagok részvételének nyomon követését, edzések szervezését és versenydokumentáció vezetését.

## Technológiai stack

### Backend
- ASP.NET Core
- Node.js Express keretrendszerrel
- SQL Server
- JWT Authentikáció
- Nodemon fejlesztéshez

### Frontend
- HTML5, CSS3, JavaScript
- Vite build eszköz
- Axios HTTP kérésekhez

## Kezdő lépések

### Előfeltételek

- Node.js (v18 vagy újabb)
- SQL Server
- npm vagy yarn csomagkezelő

### Telepítés

1. Repository klónozása
```bash
git clone https://github.com/ManyiKornel755/BMFVSE.git
cd BMFVSE
```

2. Backend telepítése
```bash
cd workingSpace/backend
npm install
```

3. Frontend telepítése
```bash
cd workingSpace/frontend
npm install
```

4. Környezeti változók beállítása

Hozz létre egy `.env` fájlt a `workingSpace/backend/` mappában a következő tartalommal:

```
DB_SERVER=sql_szerver_cím
DB_NAME=adatbázis_név
DB_USER=felhasználónév
DB_PASSWORD=jelszó
JWT_SECRET=jwt_titkos_kulcs
PORT=5000
NODE_ENV=development
```

5. Adatbázis telepítés

Futtasd le az adatbázis mappában található SQL szkripteket a séma és táblák inicializálásához.

## Alkalmazás futtatása

### Fejlesztői mód

Backend:
```bash
cd workingSpace/backend
npm run dev
```

Frontend:
```bash
cd workingSpace/frontend
npm run dev
```

A backend a `http://localhost:5000` címen, a frontend pedig a `http://localhost:5173` címen fog futni.

### VS Code Launch konfiguráció használata

Nyomd meg az F5-öt VS Code-ban és válaszd a "Run Full Stack" opciót mindkét alkalmazás egyidejű indításához.

## Projekt struktúra

```
BMFVSE/
├── workingSpace/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── middlewares/
│   │   │   ├── models/
│   │   │   ├── routes/
│   │   │   └── services/
│   │   ├── scripts/
│   │   └── server.js
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── services/
│       │   └── utils/
│       └── index.html
├── Frontend_Test/
├── Backend_Test/
└── README.md
```

## Funkciók

- Felhasználói authentikáció és jogosultságkezelés
- Szerepkör alapú hozzáférés-szabályozás (Admin, Edző, Tag)
- Edzések szervezése és nyilvántartása
- Tagok profiljának kezelése
- Versenyjegyzőkönyvek dokumentálása
- Belső üzenetküldő rendszer
- Dokumentumkezelés
- Edzésstatisztikák és naplók

## API végpontok

### Authentikáció
- POST `/api/auth/login` - Bejelentkezés
- POST `/api/auth/register` - Regisztráció
- GET `/api/auth/me` - Aktuális felhasználó lekérése

### Felhasználók
- GET `/api/users` - Összes felhasználó listázása (Admin)
- GET `/api/users/me` - Saját profil lekérése
- PATCH `/api/users/me` - Saját profil frissítése
- POST `/api/users` - Új felhasználó létrehozása (Admin)
- DELETE `/api/users/:id` - Felhasználó törlése (Admin)

### Tagok
- GET `/api/members` - Összes tag listázása
- GET `/api/members/:id` - Tag adatainak lekérése
- POST `/api/members` - Új tag létrehozása (Admin)
- PUT `/api/members/:id` - Tag adatainak frissítése (Admin)
- DELETE `/api/members/:id` - Tag törlése (Admin)

### Edzések
- GET `/api/trainings` - Jövőbeli edzések listázása
- GET `/api/trainings/:id` - Edzés adatainak lekérése
- GET `/api/trainings/log` - Edzésnaplók lekérése (Admin)
- GET `/api/trainings/coaches` - Edzők listázása

## Tesztelés

### Frontend tesztek

Navigálj a Frontend_Test könyvtárba és futtasd:

```bash
cd Frontend_Test
npm install
npm test
```

Lefedettség ellenőrzése:
```bash
npm run test:coverage
```

### Backend tesztek

A backend API tesztekhez Postman/Newman eszközt használunk. Navigálj a Backend_Test könyvtárba:

```bash
cd Backend_Test
npm install -g newman
newman run BMFVSE_Auth_Tests.postman_collection.json
```

Összes teszt futtatása:
```bash
.\run-tests.bat
```

A teszteredmények JSON formátumban a `results/` könyvtárba kerülnek exportálásra.

## Adatbázis séma

Az alkalmazás SQL Server adatbázist használ a következő fő táblákkal:

- users
- members
- events
- event_participants
- trainings
- race_reports
- messages
- documents
- roles
- user_roles

## Biztonság

- JWT alapú authentikáció
- Jelszavak bcrypt hash-eléssel
- Szerepkör alapú jogosultság middleware
- SQL injection védelem paraméteres lekérdezésekkel
- CORS konfiguráció az API biztonságához

## Fejlesztés

### Backend fejlesztés

A backend Nodemon-t használ az automatikus szerver újraindításhoz fejlesztés során. Minden `.js` fájl módosítása újratöltést eredményez.

### Frontend fejlesztés

A Vite hot module replacement funkciót biztosít az azonnali frissítésekhez fejlesztés közben.

## Telepítés éles környezetbe

1. Állítsd be a `NODE_ENV=production` környezeti változót
2. Build-eld a frontend-et:
```bash
cd workingSpace/frontend
npm run build
```
3. Konfiguráld az éles adatbázis kapcsolatot
4. Indítsd el a backend szervert
5. Szolgáltasd ki a frontend build-et egy webszerveren keresztül


## Licensz

Ez a projekt a BMFVSE belső használatára készült.

