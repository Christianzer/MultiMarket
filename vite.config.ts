import path from 'path';
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwind from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import electron from 'vite-plugin-electron'
import electronRenderer from 'vite-plugin-electron-renderer'

export default defineConfig(({ mode }) => {
  const rootDir = path.resolve(__dirname, 'src');
  const env = loadEnv(mode, process.cwd(), '');
  const production = env.NODE_ENV === 'production';
  const isElectron = mode === 'electron';

  const plugins = [vue()];
  
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
              sourcemap: true,
              minify: production,
              outDir: path.resolve(__dirname, 'dist-electron'),
              rollupOptions: {
                external: Object.keys(require('./package.json').dependencies || {}),
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
              sourcemap: 'inline',
              minify: production,
              outDir: path.resolve(__dirname, 'dist-electron'),
              rollupOptions: {
                external: Object.keys(require('./package.json').dependencies || {}),
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
    },
    clearScreen: false,
  }
});
