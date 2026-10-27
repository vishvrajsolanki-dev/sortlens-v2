@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo  SortLens Rebuild — Release Build & Staging Script
echo ===================================================
echo.

cd /d "%~dp0..\.."

echo [1/5] Checking prerequisites...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH.
    pause
    exit /b 1
)
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found in PATH.
    pause
    exit /b 1
)

echo [2/5] Running TypeScript strict typecheck...
call npm run typecheck
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed with error code %errorlevel%.
    pause
    exit /b %errorlevel%
)
echo [OK] TypeScript typecheck passed cleanly.
echo.

echo [3/5] Running automated test suite...
call npm run test
if %errorlevel% neq 0 (
    echo [ERROR] Automated test suite failed with error code %errorlevel%.
    pause
    exit /b %errorlevel%
)
echo [OK] All automated tests passed.
echo.

echo [4/5] Building static production distribution bundle...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Production build failed with error code %errorlevel%.
    pause
    exit /b %errorlevel%
)
echo [OK] Production build complete.
echo.

echo [5/5] Staging release artifacts into release\SortLens-static\...
if not exist "release\SortLens-static\" mkdir "release\SortLens-static\"
xcopy /E /I /Y "dist\*" "release\SortLens-static\" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stage production files into release\SortLens-static\.
    pause
    exit /b %errorlevel%
)

echo [OK] Static release staged successfully.
echo Output Location: %CD%\release\SortLens-static
echo.
echo ===================================================
echo  BUILD AND STAGING SUCCEEDED
echo ===================================================
echo.
pause
