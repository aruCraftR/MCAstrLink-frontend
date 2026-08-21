@echo off
setlocal enabledelayedexpansion

rem MCAstrLink frontend launcher (Windows)
rem Usage: start.bat [port]

cd /d "%~dp0"
set "argPort=%~1"
set "envPort="
set "envHost="

rem Load PORT and HOST from .env if present
if exist ".env" (
  for /f "usebackq eol=# tokens=1,* delims==" %%a in (".env") do (
    set "k=%%a"
    set "v=%%b"
    if defined v set "v=!v:"=!"
    if /i "!k!"=="PORT" set "envPort=!v!"
    if /i "!k!"=="HOST" set "envHost=!v!"
  )
)

set "port=!argPort!"
if "!port!"=="" set "port=!envPort!"
if "!port!"=="" set "port=3000"
if "!envHost!"=="" set "envHost=0.0.0.0"

set "PORT=!port!"
set "HOST=!envHost!"
set "NITRO_HOST=!envHost!"
set "NITRO_PORT=!port!"

echo Starting MCAstrLink frontend: http://!HOST!:!port!
node ".output\server\index.mjs"

if errorlevel 1 (
  echo.
  echo Failed to start. Make sure Node.js 22+ is installed and the package is fully extracted.
  pause
)
endlocal
