@echo off
chcp 65001 >nul
title 停止Python练习平台

echo.
echo 正在停止Python练习平台...
taskkill /f /im python.exe /fi "WINDOWTITLE eq app.py*" >nul 2>&1
taskkill /f /im python.exe /fi "MODULES eq flask*" >nul 2>&1

echo.
echo 服务已停止
echo.
pause
