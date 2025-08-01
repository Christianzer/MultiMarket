#!/usr/bin/env node

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.blue('🔍 Vérification TypeScript...'));

try {
  // Vérifier les types
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log(chalk.green('✅ Vérification TypeScript réussie !'));
  
  // Vérifier que le build fonctionne
  console.log(chalk.blue('\n🏗️  Test de build...'));
  execSync('npm run build-only', { stdio: 'inherit' });
  console.log(chalk.green('✅ Build réussi !'));
  
  console.log(chalk.green('\n🎉 Toutes les vérifications sont passées !'));
  
} catch (error) {
  console.error(chalk.red('❌ Erreur détectée :'), error.message);
  process.exit(1);
}