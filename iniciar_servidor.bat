@echo off
:: Configura el título de la ventana
title Servidor de Carta Digital
color 0A

:: Asegura que nos paramos en la carpeta de este archivo .bat
cd /d "%~dp0"

echo ====================================================
echo      INICIANDO SERVIDOR DE CARTA DIGITAL...
echo ====================================================
echo.

:: Verifica si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js no está instalado en esta computadora.
    echo Por favor, descarga e instala Node.js desde https://nodejs.org/
    echo.
    pause
    exit
)

:: Verifica si la carpeta node_modules existe, si no, instala las dependencias
if not exist "node_modules" (
    echo [INFO] No se encontro la carpeta node_modules. Instalando dependencias necesarias...
    npm install
    if %errorlevel% neq 0 (
        color 0C
        echo [ERROR] Hubo un problema al instalar las dependencias con npm install.
        pause
        exit
    )
    echo [OK] Dependencias instaladas.
    echo.
)

:: Inicia el servidor
node server.js

:: Si por alguna razón se cierra solo, mantiene la ventana abierta para ver el error
echo.
echo El servidor se ha detenido.
pause
