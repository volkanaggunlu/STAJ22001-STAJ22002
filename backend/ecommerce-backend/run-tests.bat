@echo off

REM run-tests.bat

REM Check if MongoDB container is running
docker ps | findstr "ecommerce-backend-mongo-1" >nul
if %ERRORLEVEL% neq 0 (
    REM Start Docker containers
    docker-compose up -d
    REM Wait for MongoDB to be ready
    echo Waiting for MongoDB to be ready...
    timeout /t 60 /nobreak >nul
) else (
    echo MongoDB container is already running.
)

REM Run tests
npm test

REM Capture the exit code of the tests
set TEST_EXIT_CODE=%ERRORLEVEL%

REM Stop Docker containers
docker-compose down

REM Exit with the test exit code
exit /b %TEST_EXIT_CODE%