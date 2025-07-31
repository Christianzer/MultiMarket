@echo off
echo ===========================================
echo   MultiMarket - Windows Build Script
echo ===========================================
echo.

REM Verification des outils requis
echo [1/4] Verification des outils requis...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Node.js n'est pas installe ou pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ERREUR: npm n'est pas installe ou pas dans le PATH
    pause
    exit /b 1
)

echo ✓ Node.js et npm sont installes

REM Installation des dependances
echo.
echo [2/4] Installation des dependances...
call npm install
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Echec de l'installation des dependances
    pause
    exit /b 1
)
echo ✓ Dependances installees avec succes

REM Build de l'application Vue
echo.
echo [3/4] Build de l'application Vue...
call npm run build-only
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Echec du build de l'application Vue
    pause
    exit /b 1
)
echo ✓ Application Vue buildee avec succes

REM Build Electron pour Windows
echo.
echo [4/4] Build Electron pour Windows...
call npx electron-builder --win
if %ERRORLEVEL% neq 0 (
    echo ERREUR: Echec du build Electron
    pause
    exit /b 1
)

echo.
echo ===========================================
echo   BUILD TERMINE AVEC SUCCES !
echo ===========================================
echo.
echo L'executable Windows a ete cree dans le dossier 'release'
echo Vous pouvez maintenant distribuer l'application.
echo.
pause