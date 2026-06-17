# Python练习平台 - 快速启动

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Python练习平台 - 启动中..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "[1/2] 启动Flask服务..." -ForegroundColor Yellow
Start-Process python -ArgumentList "app.py" -WindowStyle Hidden

Write-Host "[2/2] 等待服务就绪..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "   启动成功！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "   访问地址: " -NoNewline
Write-Host "http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "   按任意键停止服务并退出" -ForegroundColor Gray
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Start-Process "http://localhost:5000"

Read-Host "按回车键停止服务"
Get-Process python -ErrorAction SilentlyContinue | Where-Object {$_.Path -like "*python.exe"} | Stop-Process -Force
Write-Host "服务已停止" -ForegroundColor Yellow
