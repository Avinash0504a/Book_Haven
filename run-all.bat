@echo off
rem Opens the backend and the frontend, each in its own window.
rem Close a window (or press Ctrl+C in it) to stop that server.
start "Book Haven backend" cmd /k ""%~dp0run-backend.bat""
start "Book Haven frontend" cmd /k ""%~dp0run-frontend.bat""
echo Started. Backend: http://127.0.0.1:5000  Frontend: http://localhost:5173
