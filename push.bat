@echo off
title Push Karika Dieng ke GitHub
color 0B

echo ====================================================================
echo             PUSH KARIKA DIENG KE GITHUB REPOSITORY
echo ====================================================================
echo Target Repo: https://github.com/Amirul-Hasan99/KARIKA-DIENG.git
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

:: 3. Set remote origin ke repositori KARIKA-DIENG
git remote remove origin >nul 2>nul
git remote add origin https://github.com/Amirul-Hasan99/KARIKA-DIENG.git

:: 4. Input pesan commit (opsional, default: timestamp)
set "COMMIT_MSG="
set /p "COMMIT_MSG=Masukkan pesan commit (tekan Enter untuk default): "
if "%COMMIT_MSG%"=="" (
    set "COMMIT_MSG=Update Karika Dieng Web & QRIS System - %date% %time%"
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

if %errorlevel% equ 0 goto :push_success
goto :push_failed

:push_success
color 0A
echo.
echo ====================================================================
echo [SUKSES] Berhasil melakukan push ke https://github.com/Amirul-Hasan99/KARIKA-DIENG
echo ====================================================================
goto :push_end

:push_failed
color 0C
echo.
echo ====================================================================
echo [PERINGATAN] Gagal melakukan push otomatis ke GitHub.
echo.
echo Penyebab umum:
echo 1. Koneksi internet / hotspot sedang terputus atau timeout ke github.com
echo 2. Jika remote repo memiliki commit yang belum di-pull, jalankan:
echo    git pull origin main --rebase
echo 3. Pastikan izin akses / Personal Access Token GitHub sudah sesuai.
echo ====================================================================
goto :push_end

:push_end
echo.
pause
