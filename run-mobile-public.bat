@echo off
setlocal

REM ============================================
REM Configuration for PUBLIC Access (Anywhere)
REM ============================================

REM Cloudflare Tunnel URL for API (publicly accessible)
set EXPO_PUBLIC_API_URL=https://fighting-flight-hebrew-contributor.trycloudflare.com/api

REM Expo dev server port
set PORT=8081

REM ============================================
REM Start Expo Dev Server with Tunnel
REM ============================================

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server (PUBLIC ACCESS)
echo ============================================
echo API URL: %EXPO_PUBLIC_API_URL%
echo Expo Port: %PORT%
echo.
echo IMPORTANT: This will create a public tunnel using ngrok.
echo The app will be accessible from ANYWHERE via Expo Go.
echo.
echo You will see a public URL like:
echo exp://xxxxx.ngrok.io:8081
echo.
echo Press Ctrl+C to stop the server
echo ============================================

REM Use --tunnel for public access (works from anywhere)
REM This uses ngrok to create a public URL
node_modules/.bin/expo start --port 8081 --tunnel --go --clear

pause
