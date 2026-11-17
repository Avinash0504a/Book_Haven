@echo off
rem Starts the Book Haven backend on http://127.0.0.1:5000.
rem Secrets are read from your environment; nothing is stored in this file.
rem Required: SPRING_DATASOURCE_USERNAME, SPRING_DATASOURCE_PASSWORD, APP_JWT_SECRET
rem   (BOOK_HAVEN_DB_USER and BOOK_HAVEN_DB_PASSWORD are used if the SPRING_ ones are not set)
rem Optional: SPRING_DATASOURCE_URL, APP_CORS_ALLOWED_ORIGIN, SPRING_PROFILES_ACTIVE
setlocal

if not defined SPRING_DATASOURCE_USERNAME set "SPRING_DATASOURCE_USERNAME=%BOOK_HAVEN_DB_USER%"
if not defined SPRING_DATASOURCE_PASSWORD set "SPRING_DATASOURCE_PASSWORD=%BOOK_HAVEN_DB_PASSWORD%"
if not defined SPRING_DATASOURCE_URL set "SPRING_DATASOURCE_URL=jdbc:postgresql://127.0.0.1:5432/books"
if not defined APP_CORS_ALLOWED_ORIGIN set "APP_CORS_ALLOWED_ORIGIN=http://localhost:5173"

if not defined SPRING_DATASOURCE_USERNAME goto :missing
if not defined SPRING_DATASOURCE_PASSWORD goto :missing
if not defined APP_JWT_SECRET goto :missing

where mvn >nul 2>&1
if errorlevel 1 (
  echo Maven ^(mvn^) was not found on PATH.
  exit /b 1
)

cd /d "%~dp0backend"
echo Starting backend on http://127.0.0.1:5000 ...
call mvn -q spring-boot:run
exit /b %errorlevel%

:missing
echo Missing environment variables. Set these before running:
echo   SPRING_DATASOURCE_USERNAME  ^(or BOOK_HAVEN_DB_USER^)
echo   SPRING_DATASOURCE_PASSWORD  ^(or BOOK_HAVEN_DB_PASSWORD^)
echo   APP_JWT_SECRET              ^(at least 32 bytes^)
echo See README.md, section on environment variables.
exit /b 1
