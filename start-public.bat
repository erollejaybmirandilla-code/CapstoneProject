@echo off
setlocal

REM ============================================
REM Full Stack Launcher with Cloudflare Tunnels
REM Starts: API Server, Expo Dev Server, and Tunnels
REM ============================================

REM Configuration
set EXPO_PUBLIC_API_URL=https://fighting-flight-hebrew-contributor.trycloudflare.com/api
set PORT=8081
set API_PORT=8080

REM Database and Session
set DATABASE_URL=C:/Users/user/Desktop/CapstoneProject/artifacts/api-server/data/database.db
set SESSION_SECRET=legazpi-market-secret-2025

echo ============================================
echo Capstone Project - Public Access Launcher
echo ============================================
echo.
echo This will start:
echo   1. API Server (port %API_PORT%)
echo   2. Expo Dev Server (port %PORT%)
echo   3. Cloudflare Tunnel for API
echo   4. Cloudflare Tunnel for Expo
echo.
echo Public URLs:
echo   API:   https://fighting-flight-hebrew-contributor.trycloudflare.com
echo   Expo:  https://gardening-marketing-reduces-stays.trycloudflare.com
echo.
echo Press any key to start...
echo ============================================
pause >nul

REM Start API Server
echo [1/4] Starting API Server...
start "API Server" cmd /c "cd /d C:\Users\user\Desktop\CapstoneProject\artifacts\api-server && set DATABASE_URL=%DATABASE_URL% && set SESSION_SECRET=%SESSION_SECRET% && set PORT=%API_PORT% && node --enable-source-maps dist/index.mjs"
timeout /t 3 /nobreak >nul

REM Start Expo Dev Server
echo [2/4] Starting Expo Dev Server...
start "Expo Server" cmd /c "cd /d C:\Users\user\Desktop\CapstoneProject\artifacts\mobile && set EXPO_PUBLIC_API_URL=%EXPO_PUBLIC_API_URL% && npx expo start --port %PORT% --lan --go --clear"
timeout /t 5 /nobreak >nul

REM Start Cloudflare Tunnel for API
echo [3/4] Starting Cloudflare Tunnel for API...
start "Cloudflare API Tunnel" cmd /c "cloudflared tunnel --url http://localhost:%API_PORT%"
timeout /t 5 /nobreak >nul

REM Start Cloudflare Tunnel for Expo
echo [4/4] Starting Cloudflare Tunnel for Expo...
start "Cloudflare Expo Tunnel" cmd /c "cloudflared tunnel --url http://localhost:%PORT%"

echo.
echo ============================================
echo All services started!
echo.
echo Public URLs:
echo   API:   https://fighting-flight-hebrew-contributor.trycloudflare.com
echo   Expo:  https://gardening-marketing-reduces-stays.trycloudflare.com
echo.
echo Local URLs:
echo   API:   http://localhost:%API_PORT%
echo   Expo:  http://localhost:%PORT%
echo.
echo Press Ctrl+C in any window to stop that service
echo ============================================

pause