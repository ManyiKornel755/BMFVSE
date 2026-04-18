@echo off
echo ================================================
echo BMFVSE Backend API Tesztek futtatasa Newman-nel
echo ================================================
echo.

echo Ellenorzom, hogy a Newman telepitve van-e...
where newman >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Newman nincs telepitve!
    echo Telepites: npm install -g newman
    pause
    exit /b 1
)

echo Newman megtalalhato!
echo.

echo Tesztek futtatasa...
echo.

newman run BMFVSE_Auth_Tests.postman_collection.json ^
    --reporters cli,json ^
    --reporter-json-export results/auth-test-results.json

newman run BMFVSE_Users_Tests.postman_collection.json ^
    --reporters cli,json ^
    --reporter-json-export results/users-test-results.json

newman run BMFVSE_Members_Tests.postman_collection.json ^
    --reporters cli,json ^
    --reporter-json-export results/members-test-results.json

newman run BMFVSE_Trainings_Tests.postman_collection.json ^
    --reporters cli,json ^
    --reporter-json-export results/trainings-test-results.json

echo.
echo ================================================
echo Tesztek befejezve!
echo Eredmenyek: Backend_Test/results/
echo ================================================
pause
