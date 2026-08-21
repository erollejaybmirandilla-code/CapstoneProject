@echo off
setlocal
set EXPO_PUBLIC_API_URL=http://YOUR_IP_HERE:8080/api
set EXPO_OFFLINE=true
set PORT=8081

cd /d "%~dp0\artifacts\mobile"
node_modules/.bin/expo start --port 8081 --lan --go --clear
pause
