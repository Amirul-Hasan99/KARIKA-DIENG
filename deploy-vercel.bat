@echo off
title Deploy Katalog Menu ke Vercel
color 0A

echo ====================================================================
echo             DEPLOY KATALOG MENU KE VERCEL (CLI)
echo ====================================================================
echo Project : katalog-menu
echo Account : herewithsans / hasanamirul077@gmail.com
echo.

:: Cek instalasi Vercel CLI
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Menggunakan npx vercel...
    call npx vercel --prod --yes
) else (
    echo [INFO] Menjalankan vercel deploy ke Production...
    call vercel --prod --yes
)

if %errorlevel% equ 0 (
    color 0A
    echo.
    echo ====================================================================
    echo [SUKSES] Aplikasi berhasil di-deploy ke Vercel!
    echo URL: https://katalog-menu-herewithsans-project.vercel.app
    echo ====================================================================
) else (
    color 0C
    echo.
    echo ====================================================================
    echo [ERROR] Gagal melakukan deploy ke Vercel.
    echo ====================================================================
)

echo.
pause
