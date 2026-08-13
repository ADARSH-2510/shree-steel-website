@echo off
setlocal
echo Stopping Shree Steel Node.js server...
taskkill /FI "WINDOWTITLE eq Shree Steel Server" /T /F >nul 2>nul
if errorlevel 1 echo No Shree Steel server window was found.
echo Done.
pause
endlocal
