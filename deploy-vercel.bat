@echo off
title Deploy Karika Dieng ke Vercel
color 0A

echo ====================================================================
echo             DEPLOY KARIKA DIENG KE VERCEL (CLI)
echo ====================================================================
echo Project : karika-dieng
echo.

:: 1. Cek instalasi Vercel CLI
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Vercel CLI belum terinstall global. Menggunakan npx vercel...
    call npx vercel --prod --yes
) else (
    echo [INFO] Menjalankan vercel deploy ke Production...
    call vercel --prod --yes
)

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ====================================================================
    echo [SUKSES] Aplikasi Karika Dieng berhasil di-deploy ke Vercel!
    echo ====================================================================
) else (
    color 0C
    echo.
    echo ====================================================================
    echo [ERROR] Gagal melakukan deploy ke Vercel.
    echo Pastikan Anda sudah login ke Vercel CLI dengan: npx vercel login
    echo ====================================================================
)

echo.
pause
