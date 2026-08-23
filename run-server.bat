@echo off
setlocal

REM ============================================
REM run-server.bat - Start API Server (Production)
REM ============================================
REM Starts the API server in production mode.
REM For development, use run-dev.bat instead.
REM ============================================

set PORT=8080
set DATABASE_URL=%~dp0\artifacts\api-server\data\database.db
set SESSION_SECRET=legazpi-market-secret-2025
set NODE_ENV=production

cd /d "%~dp0\artifacts\api-server"

echo ============================================
echo Starting API Server (Production)
echo ============================================
echo Port: %PORT%
echo Database: %DATABASE_URL%
echo.

REM Push database schema
echo Pushing database schema...
cd /d "%~dp0\lib\db"
set DATABASE_URL=%DATABASE_URL%
call npx drizzle-kit push
echo.

REM Start server
cd /d "%~dp0\artifacts\api-server"
echo Starting API server...
echo ============================================
echo.
echo API Server running at: http://localhost:%PORT%
echo ============================================
echo.

node --enable-source-maps dist\index.mjs

pause
