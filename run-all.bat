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


REM ---------- ONLINE ORDERING ----------
echo.
echo [ONLINE FRONTEND]
start "ONLINE-FE" cmd /k "cd /d app/online-ordering/frontend && pnpm dev"

@REM echo [ONLINE BACKEND]
@REM start "ONLINE-BE" cmd /k "cd /d app/online-ordering/backend && pnpm start"


echo.
echo =========================================
echo ALL SERVERS ARE UP AND RUNNING!
echo =========================================
pause
