@echo off
setlocal
set PORT=%PORT%
if not defined PORT set PORT=8080
set DATABASE_URL=%DATABASE_URL%
if not defined DATABASE_URL set DATABASE_URL=%~dp0\artifacts\api-server\data\database.db
set SESSION_SECRET=legazpi-market-secret-2025
set NODE_ENV=production

cd /d "%~dp0\lib\db"
echo Pushing schema to database...
set DATABASE_URL=%DATABASE_URL%
npx drizzle-kit push
echo.

cd /d "%~dp0\artifacts\api-server"
node --enable-source-maps dist\index.mjs
pause
