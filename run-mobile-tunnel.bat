@echo off
setlocal

REM ============================================
REM Start Expo with Built-In Tunnel
REM No external services (ngrok/cloudflare) required
REM ============================================

set EXPO_PUBLIC_API_URL=http://localhost:8080/api
set PORT=8081

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server (TUNNEL MODE)
echo ============================================
echo.
echo This uses Expo's built-in tunnel feature.
echo No external tunnel services required.
echo.
echo API URL: %EXPO_PUBLIC_API_URL%
echo.
echo IMPORTANT: First time? Login to Expo:
echo   npx expo login
echo.
echo The app will be accessible from ANYWHERE.
echo ============================================
echo.

node_modules/.bin\expo start --port %PORT% --tunnel --go --clear

pause
