@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  SortLens Rebuild — Windows Development Launcher
echo ===================================================
echo.

cd /d "%~dp0..\.."

echo [1/3] Checking Node.js and npm prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not found in PATH.
    echo Please install Node.js v20+ from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not found in PATH.
    echo Please ensure npm is installed and in your PATH.
    echo.
    pause
    exit /b 1
)

node -v
npm -v
echo [OK] Node and npm detected.
echo.

echo [2/3] Checking project dependencies...
if not exist "node_modules\" (
    echo [WARNING] node_modules not detected.
    echo Please run 'npm install' before launching the development server.
    echo.
    pause
    exit /b 1
)
echo [OK] node_modules present.
echo.

echo [3/3] Launching Vite development server with Hot Module Replacement...
echo URL: http://localhost:5173/
echo Press Ctrl+C in this terminal to stop the server.
echo.

call npm run dev

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Development server exited with error code %errorlevel%.
    pause
    exit /b %errorlevel%
)
