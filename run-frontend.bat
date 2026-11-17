@echo off
rem Starts the Book Haven frontend dev server on http://localhost:5173.
rem It proxies /api and /covers to the backend on 127.0.0.1:5000.
setlocal

where npm >nul 2>&1
if errorlevel 1 (
  echo Node.js ^(npm^) was not found on PATH.
  exit /b 1
)

cd /d "%~dp0frontend"
if not exist node_modules (
  echo Installing dependencies ...
  call npm ci
  if errorlevel 1 exit /b 1
)

echo Starting frontend on http://localhost:5173 ...
call npm run dev
exit /b %errorlevel%
