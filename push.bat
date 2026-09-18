@echo off
title Push Katalog Menu ke GitHub
color 0B

echo ====================================================================
echo             PUSH KATALOG MENU KE GITHUB REPOSITORY
echo ====================================================================
echo Target Repo: https://github.com/Amirul-Hasan99/KATALOG-MENU.git
echo Branch     : main
echo.

:: 1. Cek instalasi Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git tidak ditemukan di komputer Anda!
    echo Silakan instal Git terlebih dahulu di https://git-scm.com/
    pause
    exit /b 1
)

:: 2. Pastikan branch saat ini adalah main
git branch -M main

:: 3. Set remote origin jika belum ada atau berbeda
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Amirul-Hasan99/KATALOG-MENU.git

:: 4. Input pesan commit (opsional, default: timestamp)
set "COMMIT_MSG="
set /p "COMMIT_MSG=Masukkan pesan commit (tekan Enter untuk default): "
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Update Katalog Menu & POS System - %date% %time%"
)

:: 5. Git Add & Commit
echo.
echo [1/3] Menambahkan file yang diubah (git add .)...
git add .

echo [2/3] Membuat commit ("%COMMIT_MSG%")...
git commit -m "%COMMIT_MSG%"
if %errorlevel% neq 0 (
    echo [INFO] Tidak ada perubahan baru yang perlu di-commit.
)

:: 6. Push ke GitHub
echo [3/3] Melakukan push ke origin main...
git push -u origin main

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ====================================================================
    echo [SUKSES] Berhasil melakukan push ke https://github.com/Amirul-Hasan99/KATALOG-MENU
    echo ====================================================================
) else (
    color 0C
    echo.
    echo ====================================================================
    echo [PERINGATAN] Gagal melakukan push otomatis ke GitHub.
    echo.
    echo Jika repositori remote sudah memiliki commit (misal README awal), coba jalankan:
    echo   git pull origin main --rebase
    echo Lalu jalankan push.bat kembali.
    echo.
    echo Pastikan juga akun Git / Personal Access Token Anda memiliki izin akses.
    echo ====================================================================
)

echo.
pause
