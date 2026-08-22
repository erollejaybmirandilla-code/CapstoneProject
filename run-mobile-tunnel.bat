@echo off
setlocal

REM ============================================
REM Expo Go - Tunnel Mode (Public Access)
REM ============================================
REM Use this to run the app from anywhere - different networks,
REM remote locations, or when device is not on the same Wi-Fi.
REM 
REM This uses Expo's built-in tunneling (no Cloudflare required).
REM Requires: npx expo login (free Expo account)
REM ============================================

set EXPO_PUBLIC_API_URL=http://localhost:8080/api
set PORT=8081

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server (TUNNEL MODE)
echo ============================================
echo API URL: %EXPO_PUBLIC_API_URL%
echo Expo Port: %PORT%
echo.
echo This creates a public tunnel URL.
echo The app will be accessible from ANYWHERE via Expo Go.
echo.
echo IMPORTANT: You need to be logged in to Expo.
echo Run: npx expo login
echo ============================================
echo.

node_modules/.bin/expo start --port %PORT% --tunnel --go --clear

pause
