@echo off
echo Nettoyage complet et build avec icones corriges...

echo.
echo Suppression des dossiers de build existants...
if exist "release" rmdir /s /q "release"
if exist "dist" rmdir /s /q "dist"

echo.
echo Build du projet Vue...
call npm run build-only

echo.
echo Build Electron avec publication...
call npm run electron:build-win-publish

echo.
echo Build termine ! L'icone devrait maintenant etre correcte.
echo.
echo IMPORTANT: Pour eviter les problemes d'icone:
echo 1. Desinstallez completement l'ancienne version
echo 2. Redemarrez Windows (pour vider le cache d'icones)
echo 3. Reinstallez la nouvelle version

pause