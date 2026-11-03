@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo   药搭子 · 家庭用药安全管家
echo   ----------------------------------------
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    echo   正在启动本地预览服务...
    echo   浏览器即将打开 http://localhost:8080
    echo   按 Ctrl+C 可以停止服务。
    echo.
    start "" http://localhost:8080
    python -m http.server 8080
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    start "" http://localhost:8080
    py -m http.server 8080
    goto :eof
)

echo   没有检测到 Python，直接用浏览器打开页面。
echo   ^(本项目零依赖，双击 index.html 也能正常使用^)
start "" "index.html"
