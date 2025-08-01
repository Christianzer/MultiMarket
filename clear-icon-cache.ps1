# Script PowerShell pour nettoyer le cache d'icônes Windows
# Exécuter en tant qu'administrateur pour de meilleurs résultats

Write-Host "🧹 Nettoyage du cache d'icônes Windows..." -ForegroundColor Green

# Arrêter l'explorateur Windows
Write-Host "Arrêt de l'explorateur Windows..." -ForegroundColor Yellow
taskkill /f /im explorer.exe

# Attendre un peu
Start-Sleep -Seconds 2

# Supprimer les fichiers de cache d'icônes
Write-Host "Suppression des fichiers de cache d'icônes..." -ForegroundColor Yellow

$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db",
    "$env:APPDATA\Microsoft\Windows\Explorer\iconcache_*.db"
)

foreach ($path in $iconCachePaths) {
    if (Test-Path $path) {
        try {
            Remove-Item $path -Force -ErrorAction SilentlyContinue
            Write-Host "✅ Supprimé: $path" -ForegroundColor Green
        } catch {
            Write-Host "❌ Impossible de supprimer: $path" -ForegroundColor Red
        }
    }
}

# Supprimer les fichiers de cache d'icônes avec wildcard
try {
    Get-ChildItem "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db" -ErrorAction SilentlyContinue | Remove-Item -Force
    Write-Host "✅ Cache d'icônes Explorer nettoyé" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Certains fichiers de cache n'ont pas pu être supprimés" -ForegroundColor Yellow
}

# Nettoyer le cache des miniatures aussi
Write-Host "Nettoyage du cache des miniatures..." -ForegroundColor Yellow
try {
    Remove-Item "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cache des miniatures nettoyé" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Cache des miniatures non nettoyé" -ForegroundColor Yellow
}

# Redémarrer l'explorateur Windows
Write-Host "Redémarrage de l'explorateur Windows..." -ForegroundColor Yellow
Start-Process explorer.exe

# Vider le cache du système
Write-Host "Vidage du cache système d'icônes..." -ForegroundColor Yellow
ie4uinit.exe -show

Write-Host "" 
Write-Host "🎉 Nettoyage terminé !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Étapes suivantes recommandées:" -ForegroundColor Cyan
Write-Host "1. Désinstallez complètement MultiMarket" -ForegroundColor White
Write-Host "2. Redémarrez Windows (optionnel mais recommandé)" -ForegroundColor White  
Write-Host "3. Exécutez build-clean.bat pour reconstruire" -ForegroundColor White
Write-Host "4. Réinstallez la nouvelle version" -ForegroundColor White
Write-Host ""

Read-Host "Appuyez sur Entrée pour continuer..."