import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Script pour corriger les problèmes d'icônes avec electron-builder

console.log('🔧 Vérification des icônes...');

const buildDir = path.join(__dirname, 'build');
const publicDir = path.join(__dirname, 'public');

// Fichiers d'icônes requis
const requiredIcons = {
  'icon.ico': 'Icône Windows (.ico)',
  'icon.png': 'Icône Linux (.png)', 
  'icon.icns': 'Icône macOS (.icns)'
};

console.log('\n📁 Vérification du dossier build:');
if (!fs.existsSync(buildDir)) {
  console.log('❌ Le dossier build n\'existe pas');
  fs.mkdirSync(buildDir, { recursive: true });
  console.log('✅ Dossier build créé');
} else {
  console.log('✅ Dossier build existe');
}

// Vérifier chaque icône requise
for (const [filename, description] of Object.entries(requiredIcons)) {
  const iconPath = path.join(buildDir, filename);
  if (fs.existsSync(iconPath)) {
    const stats = fs.statSync(iconPath);
    console.log(`✅ ${description}: ${filename} (${Math.round(stats.size / 1024)}KB)`);
  } else {
    console.log(`❌ ${description}: ${filename} - MANQUANT`);
  }
}

// Copier l'icône depuis public si elle existe
const publicIconPath = path.join(publicDir, 'icon.ico');
const buildIconPath = path.join(buildDir, 'icon.ico');

if (fs.existsSync(publicIconPath) && !fs.existsSync(buildIconPath)) {
  console.log('\n📋 Copie de l\'icône depuis public vers build...');
  fs.copyFileSync(publicIconPath, buildIconPath);
  console.log('✅ Icône copiée');
}

console.log('\n🛠️  Conseils pour résoudre les problèmes d\'icônes:');
console.log('1. Assurez-vous que icon.ico fait au moins 256x256 pixels');
console.log('2. Utilisez un vrai fichier .ico multi-résolution (16x16, 32x32, 48x48, 256x256)');
console.log('3. Supprimez le cache Windows: Effacez IconCache.db');
console.log('4. Désinstallez complètement l\'ancienne version avant de réinstaller');
console.log('5. Relancez un build complet avec: npm run electron:build-win');

console.log('\n💡 Commandes utiles:');
console.log('- Nettoyer le build: rm -rf release/ dist/');
console.log('- Build Windows: npm run electron:build-win');
console.log('- Vider le cache d\'icônes Windows: ie4uinit.exe -show');