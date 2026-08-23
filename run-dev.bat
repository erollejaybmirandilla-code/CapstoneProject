@echo off
setlocal

REM ============================================
REM run-dev.bat - Start API Server (Development)
REM ============================================
REM Starts the API server in development mode.
REM Run this FIRST, then run run-mobile.bat
REM ============================================

set DATABASE_URL=%~dp0\artifacts\api-server\data\database.db
set SESSION_SECRET=legazpi-market-secret-2025
set NODE_ENV=development
set PORT=8080

cd /d "%~dp0\artifacts\api-server"

echo ============================================
echo Starting API Server (Development)
echo ============================================
echo Port: %PORT%
echo Database: %DATABASE_URL%
echo.

REM Build the server
echo Building...
call pnpm run build
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
echo.
echo NEXT STEP: Open a NEW terminal and run:
echo   run-mobile.bat (same WiFi)
echo.
echo Press Ctrl+C to stop
echo ============================================
echo.

node --enable-source-maps dist\index.mjs

pause
