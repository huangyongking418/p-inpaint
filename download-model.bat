@echo off
chcp 65001 >nul
title 下载 AI 模型

echo ============================================
echo   下载 MI-GAN 推理模型
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [*] 正在安装依赖...
    call npm install
)

echo [↓] 正在下载模型到 public/models/ 目录...
node scripts/download-model.js

echo.
echo [✓] 完成
echo 也可以直接打开浏览器，首次使用时会自动下载模型。
echo.
pause
