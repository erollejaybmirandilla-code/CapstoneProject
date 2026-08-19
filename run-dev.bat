@echo off
setlocal
set DATABASE_URL=%DATABASE_URL%
if not defined DATABASE_URL set DATABASE_URL=./data/database.db
set SESSION_SECRET=legazpi-market-secret-2025

cd /d "%~dp0\artifacts\api-server"
pnpm run build
echo.
echo Build complete. Pushing schema...
cd /d "%~dp0\lib\db"
DATABASE_URL=%DATABASE_URL% npx drizzle-kit push
echo.

cd /d "%~dp0\artifacts\api-server"
echo Starting server...
node --enable-source-maps dist\index.mjs
pause
