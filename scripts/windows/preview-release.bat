@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  SortLens Rebuild — Production Preview Launcher
echo ===================================================
echo.

cd /d "%~dp0..\.."

echo [1/2] Checking production build...
if not exist "dist\index.html" (
    echo [ERROR] Production build not found at dist\index.html.
    echo Please run 'npm run build' or 'scripts\windows\build-release.bat' first.
    echo.
    pause
    exit /b 1
)
echo [OK] Production build detected in dist\.
echo.

echo [2/2] Launching Vite production preview server...
echo Press Ctrl+C in this terminal to stop the preview server.
echo.

call npm run preview

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Preview server exited with error code %errorlevel%.
    pause
    exit /b %errorlevel%
)
