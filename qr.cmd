@echo off
rem Pengelola SeeOmKus QR untuk Windows. Contoh: qr start
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js belum terpasang, butuh versi 20 atau lebih baru.
  exit /b 1
)
node "%~dp0scripts\manage.mjs" %*
exit /b %errorlevel%
