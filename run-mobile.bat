@echo off
setlocal

REM ============================================
REM Expo Go - LAN Mode (Local Network)
REM ============================================
REM Use this when your device and computer are on the same Wi-Fi network.
REM For public access (anywhere), use run-mobile-tunnel.bat instead.
REM ============================================

set EXPO_PUBLIC_API_URL=http://localhost:8080/api
set PORT=8081

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server (LAN MODE)
echo ============================================
echo API URL: %EXPO_PUBLIC_API_URL%
echo Expo Port: %PORT%
echo.
echo NOTE: Device must be on the same Wi-Fi network.
echo For public access from anywhere, use run-mobile-tunnel.bat
echo ============================================
echo.

node_modules/.bin/expo start --port %PORT% --lan --go --clear

pause
