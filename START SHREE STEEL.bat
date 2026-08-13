@echo off
setlocal
cd /d "%~dp0"
title Shree Steel Launcher

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo ================================================
  echo   Node.js is not installed on this computer.
  echo ================================================
  echo.
  echo Install Node.js LTS from https://nodejs.org/
  echo Then double-click this launcher again.
  echo.
  pause
  exit /b 1
)

echo.
echo ================================================
echo       SHREE STEEL DYNAMIC WEBSITE
echo ================================================
echo.
echo Starting the website server...
echo.

start "Shree Steel Server" /min cmd /k "cd /d "%~dp0" && node server.js"

powershell -NoProfile -ExecutionPolicy Bypass -Command "$ok=$false; for($i=0;$i -lt 30;$i++){ try { $r=Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:3000/' -TimeoutSec 1; if($r.StatusCode -eq 200){$ok=$true;break} } catch {}; Start-Sleep -Milliseconds 500 }; if(-not $ok){exit 1}"
if errorlevel 1 (
  echo.
  echo The Shree Steel server did not start on port 3000.
  echo Check the server window for the error.
  echo.
  pause
  exit /b 1
)

start "Shree Steel Website" http://localhost:3000/
echo Website is running at http://localhost:3000/
echo You can close this launcher window. Keep the server window running.
endlocal
