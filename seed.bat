@echo off
setlocal
set DATABASE_URL=%DATABASE_URL%
if not defined DATABASE_URL set DATABASE_URL=./data/database.db
set SESSION_SECRET=legazpi-market-secret-2025

cd /d "%~dp0\artifacts\api-server"
pnpm run build
echo.
echo Seeding database...
cd /d "%~dp0"
node --import tsx ./scripts/src/seed.ts
pause
