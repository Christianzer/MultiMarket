import path from 'path';
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, 'src');
  const env = loadEnv(mode, process.cwd(), '');
  const production = env.NODE_ENV === 'production';
  const isElectron = mode === 'electron';

  const plugins = [vue()];
  
  // Ajouter l'analyseur de bundle en mode production
  if (production && !isElectron) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }
  
  if (isElectron) {
    plugins.push(
      ...electron([
        {
          entry: path.resolve(__dirname, 'electron/main.ts'),
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log('[startup] Electron App');
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap: !production,
              minify: production,
              outDir: path.resolve(__dirname, 'electron'),
              rollupOptions: {
                external: [
                  'electron',
                  'electron-updater',
                  ...Object.keys(require('./package.json').dependencies || {})
                ],
              },
            },
          },
        },
        {
          entry: path.resolve(__dirname, 'electron/preload.ts'),
          onstart(args) {
            args.reload();
          },
          vite: {
            build: {
              sourcemap: !production,
              minify: production,
              outDir: path.resolve(__dirname, 'electron'),
              rollupOptions: {
                external: [
                  'electron',
                  ...Object.keys(require('./package.json').dependencies || {})
                ],
              },
            },
          },
        },
      ]),
      electronRenderer()
    );
  }

  return {
    root: rootDir,
    base: './',
    appType: 'spa',
    plugins,
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          tailwind(),
        ],
      },
    },
    resolve: {
      alias: {
        '@': rootDir,
      }
    },
    build: {
      minify: production,
      sourcemap: production,
      outDir: path.resolve(rootDir, '..', 'dist'),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Optimisation des chunks pour un meilleur cache
          manualChunks: {
            // Vendor chunk pour les dépendances stables
            'vendor': ['vue', 'vue-router', 'pinia'],
            // UI chunk pour les composants d'interface
            'ui': ['radix-vue', 'lucide-vue-next', '@radix-icons/vue'],
            // Utils chunk pour les utilitaires
            'utils': ['clsx', 'tailwind-merge', 'class-variance-authority', '@vueuse/core'],
            // Forms chunk pour la validation
            'forms': ['vee-validate', '@vee-validate/zod', 'zod'],
            // Tables chunk pour les tableaux
            'tables': ['@tanstack/vue-table'],
            // Charts chunk pour les graphiques
            'charts': ['@unovis/vue']
          },
          // Nommage optimisé des chunks
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk'
            return `js/[name]-[hash].js`
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'css/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      }
    },
    // Optimisation des dépendances
    optimizeDeps: {
      include: [
        'vue', 
        'vue-router', 
        'pinia',
        'lucide-vue-next',
        'radix-vue',
        '@vueuse/core'
      ],
      exclude: ['electron']
    },
    clearScreen: false,
  }
});
