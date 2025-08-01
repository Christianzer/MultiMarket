# 🖼️ Résolution des problèmes d'icônes Electron

Ce guide vous aide à résoudre le problème d'icône Electron par défaut qui persiste après l'installation.

## 🔍 Diagnostic

Vérifiez d'abord que vos icônes sont correctement configurées :

```bash
npm run check-icons
```

## 🛠️ Solutions

### Solution 1 : Build propre (Recommandée)

1. **Nettoyez complètement les builds précédents :**
   ```bash
   npm run clean
   ```

2. **Construisez avec un environnement propre :**
   ```bash
   npm run electron:build-clean
   ```

### Solution 2 : Nettoyage du cache Windows

1. **Exécutez le script de nettoyage (Windows) :**
   ```powershell
   # En tant qu'administrateur
   .\clear-icon-cache.ps1
   ```

2. **Ou utilisez le fichier batch :**
   ```cmd
   build-clean.bat
   ```

### Solution 3 : Nettoyage manuel

1. **Désinstallez complètement l'application**
2. **Supprimez le cache d'icônes Windows :**
   - Ouvrez l'Explorateur et allez à : `%LOCALAPPDATA%`
   - Supprimez `IconCache.db`
   - Supprimez tous les fichiers `iconcache_*.db` dans `Microsoft\Windows\Explorer\`
3. **Redémarrez Windows** (optionnel mais recommandé)
4. **Réinstallez la nouvelle version**

## 📋 Checklist de vérification

- [ ] Les fichiers d'icônes existent dans `/build/` :
  - [ ] `icon.ico` (Windows)
  - [ ] `icon.png` (Linux)
  - [ ] `icon.icns` (macOS)
- [ ] La configuration `electron-builder.json` est correcte
- [ ] Le cache Windows a été vidé
- [ ] L'ancienne version a été complètement désinstallée
- [ ] Le build a été fait avec un environnement propre

## 🎯 Commandes utiles

```bash
# Vérifier les icônes
npm run check-icons

# Build propre
npm run electron:build-clean

# Nettoyer manuellement
npm run clean
npm run build-only
npm run electron:build-win-publish
```

## 🐛 Problèmes courants

### L'icône ne change pas après réinstallation
- **Cause :** Cache Windows
- **Solution :** Exécuter `clear-icon-cache.ps1` et redémarrer

### L'icône apparaît floue ou pixelisée
- **Cause :** Fichier .ico de mauvaise qualité
- **Solution :** Recréer le fichier .ico avec plusieurs résolutions (16x16, 32x32, 48x48, 256x256)

### L'icône par défaut d'Electron persiste
- **Cause :** Fichier .ico non trouvé ou corrompu
- **Solution :** Vérifier que `build/icon.ico` existe et est valide

## 🔧 Outils recommandés

- **IcoFX** ou **GIMP** pour créer des fichiers .ico multi-résolution
- **IconsExtract** pour extraire et analyser les icônes existantes

## 📞 Support

Si le problème persiste après avoir suivi ces étapes :
1. Vérifiez les logs de build pour les erreurs
2. Testez avec une icône différente
3. Vérifiez les permissions de fichiers