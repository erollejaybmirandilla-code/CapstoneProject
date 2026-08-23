@echo off
setlocal EnableDelayedExpansion

REM ============================================
REM run-all.bat - Start Complete System
REM ============================================
REM Starts BOTH the API server and Expo together.
REM ============================================

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    for /f "tokens=1 delims= " %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)

:found
echo Detected local IP: %LOCAL_IP%

set API_PORT=8080
set EXPO_PORT=8081
set DATABASE_URL=%~dp0\artifacts\api-server\data\database.db
set SESSION_SECRET=legazpi-market-secret-2025
set NODE_ENV=development
set EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:%API_PORT%/api

cd /d "%~dp0"

echo ============================================
echo Starting Complete E-Commerce System
echo ============================================
echo API Port: %API_PORT%
echo Expo Port: %EXPO_PORT%
echo API URL: %EXPO_PUBLIC_API_URL%
echo ============================================
echo.

REM ============================================
REM Step 1: Build and start API server
REM ============================================
echo [1/3] Building API Server...
cd /d "%~dp0\artifacts\api-server"
call pnpm run build
echo.

echo [2/3] Setting up database...
cd /d "%~dp0\lib\db"
set DATABASE_URL=%DATABASE_URL%
call npx drizzle-kit push
echo.

echo [3/3] Starting services...
echo.

REM Start API server in background
cd /d "%~dp0\artifacts\api-server"
start "API Server" /min cmd /c "node --enable-source-maps dist\index.mjs"

REM Wait for API server to start
echo Waiting for API server to start...
set /a RETRIES=0
:check_api
curl.exe -s http://localhost:8080/healthz >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a RETRIES+=1
    if !RETRIES! GTR 30 (
        echo.
        echo ERROR: API server failed to start!
        echo Check the API Server window for errors.
        pause
        exit /b 1
    )
    timeout /t 1 /nobreak >nul
    <nul set /p =.
    goto check_api
)
echo API Server ready!
echo.

REM ============================================
REM Step 2: Start Expo in LAN mode
REM ============================================
cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo (LAN Mode - Same WiFi)
echo ============================================
echo.
echo Device must be on the SAME WiFi network.
echo Scan QR code with Expo Go app.
echo ============================================
echo.

node_modules\.bin\expo start --port %EXPO_PORT% --lan --go --clear

pause
