@echo off
setlocal

REM ============================================
REM Configuration for Public Access via Cloudflare
REM ============================================

REM Cloudflare Tunnel URL for API (publicly accessible)
set EXPO_PUBLIC_API_URL=https://fighting-flight-hebrew-contributor.trycloudflare.com/api

REM Expo dev server port
set PORT=8081

REM ============================================
REM Start Expo Dev Server
REM ============================================

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server
echo ============================================
echo API URL: %EXPO_PUBLIC_API_URL%
echo Expo Port: %PORT%
echo.
echo The app will be accessible via Cloudflare tunnel at:
echo https://gardening-marketing-reduces-stays-stays.trycloudflare.com
echo.
echo Press Ctrl+C to stop the server
echo ============================================

node_modules/.bin/expo start --port 8081 --lan --go --clear

pause