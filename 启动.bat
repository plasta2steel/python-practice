@echo off
chcp 65001 >nul
title Python练习平台

echo.
echo ========================================
echo    Python练习平台 - 启动中...
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 启动Flask服务...
start /b python app.py

echo [2/2] 等待服务就绪...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo    启动成功！
echo ========================================
echo.
echo    访问地址: http://localhost:5000
echo.
echo    按 Ctrl+C 停止服务
echo ========================================
echo.

start http://localhost:5000

pause
