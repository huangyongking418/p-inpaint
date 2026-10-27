@echo off
chcp 65001 >nul
title P-Inpaint · AI 去水印工具

echo ============================================
echo   P-Inpaint · AI 去水印工具
echo ============================================
echo.

cd /d "%~dp0"

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装: https://nodejs.org/
    echo. & pause & exit /b 1
)

if not exist "node_modules\" (
    echo [*] 首次启动，正在安装依赖...
    echo.
    call npm install
    if %errorlevel% neq 0 ( echo. & echo [错误] 依赖安装失败 & pause & exit /b 1 )
    echo. & echo [✓] 依赖安装完成 & echo.
)

echo [*] 正在启动开发服务器...
echo [*] 首次使用会自动下载 AI 模型（约 20MB）
echo.

:: 在新窗口中启动开发服务器
start "P-Inpaint" cmd /c "npm run dev"

:: 等待服务器就绪后打开浏览器
echo [*] 等待服务器就绪...
timeout /t 4 /nobreak >nul

echo [*] 正在打开浏览器...
start http://localhost:3000

echo.
echo ============================================
echo   [✓] 开发服务器已启动
echo   [*] 浏览器已打开至 http://localhost:3000
echo   [*] 关闭 「P-Inpaint」命令窗口即可停止服务器
echo ============================================
pause
