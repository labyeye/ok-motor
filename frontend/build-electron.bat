@echo off
REM OK Motor - Electron Build Script for Windows
REM This script builds the Electron app for Windows

setlocal enabledelayedexpansion

echo.
echo ========================================
echo    OK Motor - Electron Build Script
echo ========================================
echo.

REM Check if we're in the right directory
if not exist package.json (
    echo [ERROR] package.json not found!
    echo Please run this script from the frontend\ directory:
    echo   cd frontend
    echo   build-electron.bat
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist node_modules (
    echo [WARNING] node_modules not found. Installing dependencies...
    call npm install
    echo.
)

REM Ask user what to build
echo What would you like to build?
echo.
echo 1^) Build for Windows (64-bit + 32-bit + Portable) - RECOMMENDED
echo 2^) Build for Windows 64-bit only
echo 3^) Build for Windows 32-bit only
echo 4^) Build Portable version only
echo 5^) Just build React app (no Electron packaging)
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto build_all_win
if "%choice%"=="2" goto build_win64
if "%choice%"=="3" goto build_win32
if "%choice%"=="4" goto build_portable
if "%choice%"=="5" goto build_react
goto invalid_choice

:build_all_win
echo.
echo [BUILDING] Building for Windows (All architectures)...
echo.
echo Step 1/2: Building React app...
call npm run build
if errorlevel 1 goto build_error
echo.
echo Step 2/2: Packaging Electron app...
call npm run electron:build:win
if errorlevel 1 goto build_error
goto build_complete

:build_win64
echo.
echo [BUILDING] Building for Windows 64-bit...
echo.
echo Step 1/2: Building React app...
call npm run build
if errorlevel 1 goto build_error
echo.
echo Step 2/2: Packaging Electron app...
call npm run electron:build:win -- --x64
if errorlevel 1 goto build_error
goto build_complete

:build_win32
echo.
echo [BUILDING] Building for Windows 32-bit...
echo.
echo Step 1/2: Building React app...
call npm run build
if errorlevel 1 goto build_error
echo.
echo Step 2/2: Packaging Electron app...
call npm run electron:build:win -- --ia32
if errorlevel 1 goto build_error
goto build_complete

:build_portable
echo.
echo [BUILDING] Building Portable version...
echo.
echo Step 1/2: Building React app...
call npm run build
if errorlevel 1 goto build_error
echo.
echo Step 2/2: Packaging Electron app...
call npm run electron:build:win -- --x64
if errorlevel 1 goto build_error
goto build_complete

:build_react
echo.
echo [BUILDING] Building React app only...
echo.
call npm run build
if errorlevel 1 goto build_error
echo.
echo [SUCCESS] Done! Build folder created at: frontend\build\
pause
exit /b 0

:build_complete
echo.
echo ========================================
echo [SUCCESS] Build Complete!
echo ========================================
echo.
echo Build files are in: frontend\dist\
echo.
echo Next steps:
echo   1. Check the dist\ folder for your builds
echo   2. Test the app before distributing
echo   3. See ELECTRON_BUILD_GUIDE.md for distribution instructions
echo.
echo Build files:
dir /b dist 2>nul
if errorlevel 1 echo No files found in dist\
echo.
echo Ready to distribute!
pause
exit /b 0

:build_error
echo.
echo [ERROR] Build failed!
echo.
echo Troubleshooting:
echo   1. Make sure all dependencies are installed: npm install
echo   2. Check if Node.js is installed: node --version
echo   3. Try deleting node_modules and reinstalling
echo.
pause
exit /b 1

:invalid_choice
echo.
echo [ERROR] Invalid choice
pause
exit /b 1
