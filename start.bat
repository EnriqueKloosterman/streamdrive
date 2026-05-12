@echo off
cd /d "%~dp0"

echo Starting StreamDrive Hub...

start "Backend" cmd /c "cd backend && npm run dev"
start "Frontend" cmd /c "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Close this window to stop both servers.
pause
taskkill /fi "WINDOWTITLE eq Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Frontend" /f >nul 2>&1
