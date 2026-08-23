@echo off
setlocal

REM Get local IP address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    for /f "tokens=1 delims= " %%b in ("%%a") do (
        set LOCAL_IP=%%b
        goto :found
    )
)

:found
echo Detected local IP: %LOCAL_IP%
echo API URL will be: http://%LOCAL_IP%:8080/api
echo.

set EXPO_PUBLIC_API_URL=http://%LOCAL_IP%:8080/api
set PORT=8081

cd /d "%~dp0\artifacts\mobile"

echo ============================================
echo Starting Expo Dev Server (LAN MODE)
echo ============================================
echo API URL: %EXPO_PUBLIC_API_URL%
echo Expo Port: %PORT%
echo.
echo IMPORTANT: Phone and computer must be on SAME WiFi.
echo ============================================
echo.

node_modules/.bin/expo start --port %PORT% --lan --go --clear

pause
