@echo off
echo =========================================
echo STARTING ALL CANTEEN SERVERS
echo =========================================

REM ---------- OFFLINE ORDERING ----------
echo.
echo [OFFLINE FRONTEND]
start "OFFLINE-FE" cmd /k "cd /d app/offline-ordering/frontend && pnpm dev"

echo [OFFLINE BACKEND]
start "OFFLINE-BE" cmd /k "cd /d app/offline-ordering/backend && pnpm dev"

echo.
echo =========================================
echo ALL SERVERS ARE UP AND RUNNING!
echo =========================================
pause
