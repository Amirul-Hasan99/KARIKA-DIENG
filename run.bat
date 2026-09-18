@echo off
title Katalog Kopi & Snack - Self Order Launcher
color 0A

echo ====================================================================
echo             KATALOG KOPI & SNACK - SELF ORDER & POS SYSTEM
echo ====================================================================
echo.

:: 1. Cek instalasi Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js tidak ditemukan di komputer Anda!
    echo Silakan unduh dan instal Node.js terlebih dahulu di https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 2. Cek file .env.local
if not exist ".env.local" (
    echo [INFO] File .env.local belum ditemukan.
    if exist ".env.local.example" (
        echo [INFO] Menyalin konfigurasi dari .env.local.example ke .env.local...
        copy ".env.local.example" ".env.local" >nul
        echo [OK] File .env.local berhasil dibuat!
    )
)

:: 3. Cek node_modules
if not exist "node_modules\next\" (
    echo [INFO] Paket Next.js / node_modules belum lengkap. Memulai proses instalasi paket...
    call npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Gagal menginstal dependensi npm. Periksa koneksi internet Anda.
        pause
        exit /b 1
    )
    echo [OK] Instalasi dependensi selesai!
    echo.
)

:: 4. Tampilkan Navigasi URL
echo ====================================================================
echo  Server akan berjalan di:
echo    - Beranda / Navigasi : http://localhost:3000
echo    - Menu Meja 01       : http://localhost:3000/table/table-01
echo    - Kitchen Display KDS: http://localhost:3000/admin/kitchen
echo    - Dashboard Kasir/POS: http://localhost:3000/admin
echo ====================================================================
echo.
echo Membuka browser secara otomatis dalam 3 detik...

:: Buka browser secara otomatis di latar belakang setelah jeda singkat
start /b cmd /c "timeout /t 3 /nobreak >nul & start http://localhost:3000"

:: 5. Jalankan server Next.js
echo Menjalankan 'npm run dev'...
echo Tekan Ctrl + C untuk menghentikan server kapan saja.
echo.
call npm run dev

pause
