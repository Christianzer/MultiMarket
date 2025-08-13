var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// package.json
var require_package = __commonJS({
  "package.json"(exports, module) {
    module.exports = {
      name: "multimarket",
      version: "4.3.7",
      private: true,
      type: "module",
      description: "Application de gestion multi-supermarch\xE9s : gestion des stocks, ventes, utilisateurs, fournisseurs et bien plus. Con\xE7ue pour centraliser et optimiser l'activit\xE9 de plusieurs points de vente.",
      author: {
        name: "Christian",
        email: "christianaka65@gmail.com"
      },
      main: "electron/main.js",
      scripts: {
        dev: "vite",
        build: "npm run clean && npm run build-only && electron-builder --win --x64 --publish=always",
        "build:linux": "npm run clean && npm run build-only && electron-builder --linux --publish=always",
        "build:mac": "npm run clean && npm run build-only && electron-builder --mac --publish=always",
        "build:win": "npm run clean && npm run build-only && electron-builder --win --x64 --publish=always",
        preview: "vite preview",
        "build-only": "vite build --mode production && vite build --mode electron || exit 0",
        "type-check": "vue-tsc --build --force",
        lint: "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore",
        format: "prettier --write src/",
        "electron:dev": "vite --mode electron",
        "electron:build": "npm run electron:build-optimized",
        "electron:build-win": "npm run electron:build-win-optimized",
        "electron:build-win-publish": "npm run clean && npm run build-only && electron-builder --win --x64 --publish=always",
        "electron:build-clean": "npm run clean && npm run electron:build-win-publish",
        "electron:publish": "npm run clean && npm run build-only && electron-builder --win --x64 --publish=always",
        "electron:start": "electron .",
        "electron:debug": "electron . --inspect=9229",
        "electron:dev-debug": "vite --mode electron && electron . --inspect=9229",
        clean: "rm -rf release dist",
        "clean:win": "if exist release rmdir /s /q release && if exist dist rmdir /s /q dist",
        "check-icons": "node fix-icons.js",
        analyze: "npm run build-only && echo 'Bundle analysis saved to dist/stats.html'",
        "electron:build-optimized": "npm run clean && npm run build-only && electron-builder --publish=never",
        "electron:build-win-optimized": "npm run clean && npm run build-only && electron-builder --win --x64 --publish=never",
        "performance:check": "npm run build-only && npm run analyze",
        "release:local": "npm run clean && npm run type-check && npm run lint && npm run build-only && electron-builder --win --x64 --publish=never",
        "release:github": "npm run clean && npm run type-check && npm run lint && npm run build-only && electron-builder --win --x64 --publish=always",
        "release:draft": "npm run clean && npm run type-check && npm run lint && npm run build-only && electron-builder --win --x64 --publish=onTagOrDraft",
        "release:patch": "npm version patch && npm run release:github",
        "release:minor": "npm version minor && npm run release:github",
        "release:major": "npm version major && npm run release:github",
        prerelease: "npm run type-check && npm run lint",
        postrelease: "echo '\u{1F389} Release completed successfully! Check: https://github.com/Christianzer/MultiMarket/releases'"
      },
      dependencies: {
        "@radix-icons/vue": "^1.0.0",
        "@tanstack/vue-table": "^8.11.8",
        "@tanstack/vue-virtual": "^3.13.12",
        "@unovis/vue": "^1.3.3",
        "@vee-validate/zod": "^4.12.5",
        "@vueuse/core": "^10.7.2",
        "class-variance-authority": "^0.7.0",
        clsx: "^2.1.0",
        "electron-updater": "^6.6.2",
        "feather-icons": "^4.29.1",
        "lucide-vue-next": "^0.323.0",
        pinia: "^2.1.7",
        "radix-vue": "^1.4.2",
        "tailwind-merge": "^2.2.1",
        "tailwindcss-animate": "^1.0.7",
        "v-calendar": "^3.1.2",
        "vee-validate": "^4.12.5",
        vue: "^3.4.18",
        "vue-feather": "^2.0.0",
        "vue-router": "^4.2.5",
        "vue-sonner": "^2.0.2",
        zod: "^3.22.4"
      },
      devDependencies: {
        "@rushstack/eslint-patch": "^1.3.3",
        "@tsconfig/node20": "^20.1.2",
        "@types/node": "^20.11.16",
        "@types/vue-router": "^2.0.0",
        "@vitejs/plugin-vue": "^5.0.3",
        "@vue/eslint-config-prettier": "^8.0.0",
        "@vue/eslint-config-typescript": "^12.0.0",
        "@vue/tsconfig": "^0.5.1",
        autoprefixer: "^10.4.17",
        electron: "^37.2.4",
        "electron-builder": "^26.0.12",
        eslint: "^8.49.0",
        "eslint-plugin-vue": "^9.17.0",
        "npm-run-all2": "^6.1.1",
        prettier: "^3.0.3",
        "rollup-plugin-visualizer": "^6.0.3",
        tailwindcss: "^3.4.1",
        typescript: "~5.3.0",
        vite: "^5.0.11",
        "vite-plugin-electron": "^0.29.0",
        "vite-plugin-electron-renderer": "^0.14.6",
        "vue-tsc": "^1.8.27"
      }
    };
  }
});

// vite.config.ts
import path from "path";
import { defineConfig, loadEnv } from "file:///C:/laragon/www/MultiMarket/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/laragon/www/MultiMarket/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import tailwind from "file:///C:/laragon/www/MultiMarket/node_modules/tailwindcss/lib/index.js";
import autoprefixer from "file:///C:/laragon/www/MultiMarket/node_modules/autoprefixer/lib/autoprefixer.js";
import electron from "file:///C:/laragon/www/MultiMarket/node_modules/vite-plugin-electron/dist/index.mjs";
import electronRenderer from "file:///C:/laragon/www/MultiMarket/node_modules/vite-plugin-electron-renderer/dist/index.mjs";
import { visualizer } from "file:///C:/laragon/www/MultiMarket/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "C:\\laragon\\www\\MultiMarket";
var vite_config_default = defineConfig(({ mode }) => {
  const rootDir = path.resolve(__vite_injected_original_dirname, "src");
  const env = loadEnv(mode, process.cwd(), "");
  const production = env.NODE_ENV === "production";
  const isElectron = mode === "electron";
  const plugins = [vue()];
  if (production && !isElectron) {
    plugins.push(
      visualizer({
        filename: "dist/stats.html",
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    );
  }
  if (isElectron) {
    plugins.push(
      ...electron([
        {
          entry: path.resolve(__vite_injected_original_dirname, "electron/main.ts"),
          onstart(args) {
            if (process.env.VSCODE_DEBUG) {
              console.log("[startup] Electron App");
            } else {
              args.startup();
            }
          },
          vite: {
            build: {
              sourcemap: !production,
              minify: production,
              outDir: path.resolve(__vite_injected_original_dirname, "electron"),
              rollupOptions: {
                external: [
                  "electron",
                  "electron-updater",
                  ...Object.keys(require_package().dependencies || {})
                ]
              }
            }
          }
        },
        {
          entry: path.resolve(__vite_injected_original_dirname, "electron/preload.ts"),
          onstart(args) {
            args.reload();
          },
          vite: {
            build: {
              sourcemap: !production,
              minify: production,
              outDir: path.resolve(__vite_injected_original_dirname, "electron"),
              rollupOptions: {
                external: [
                  "electron",
                  ...Object.keys(require_package().dependencies || {})
                ]
              }
            }
          }
        }
      ]),
      electronRenderer()
    );
  }
  return {
    root: rootDir,
    base: "./",
    appType: "spa",
    plugins,
    server: {
      proxy: {
        "/api": {
          target: "https://multi.ciatci.com/public/index.php",
          changeOrigin: true,
          secure: true,
          rewrite: (path2) => path2.replace(/^\/api/, "/api")
        }
      }
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          tailwind()
        ]
      }
    },
    resolve: {
      alias: {
        "@": rootDir
      }
    },
    build: {
      minify: production,
      sourcemap: production,
      outDir: path.resolve(rootDir, "..", "dist"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          // Optimisation des chunks pour un meilleur cache
          manualChunks: {
            // Vendor chunk pour les dépendances stables
            "vendor": ["vue", "vue-router", "pinia"],
            // UI chunk pour les composants d'interface
            "ui": ["radix-vue", "lucide-vue-next", "@radix-icons/vue"],
            // Utils chunk pour les utilitaires
            "utils": ["clsx", "tailwind-merge", "class-variance-authority", "@vueuse/core"],
            // Forms chunk pour la validation
            "forms": ["vee-validate", "@vee-validate/zod", "zod"],
            // Tables chunk pour les tableaux
            "tables": ["@tanstack/vue-table"],
            // Charts chunk pour les graphiques
            "charts": ["@unovis/vue"]
          },
          // Nommage optimisé des chunks
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split("/").pop() : "chunk";
            return `js/[name]-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith(".css")) {
              return "css/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          }
        }
      }
    },
    // Optimisation des dépendances
    optimizeDeps: {
      include: [
        "vue",
        "vue-router",
        "pinia",
        "lucide-vue-next",
        "radix-vue",
        "@vueuse/core"
      ],
      exclude: ["electron"]
    },
    clearScreen: false
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsicGFja2FnZS5qc29uIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJ7XHJcbiAgXCJuYW1lXCI6IFwibXVsdGltYXJrZXRcIixcclxuICBcInZlcnNpb25cIjogXCI0LjMuN1wiLFxyXG4gIFwicHJpdmF0ZVwiOiB0cnVlLFxyXG4gIFwidHlwZVwiOiBcIm1vZHVsZVwiLFxyXG4gIFwiZGVzY3JpcHRpb25cIjogXCJBcHBsaWNhdGlvbiBkZSBnZXN0aW9uIG11bHRpLXN1cGVybWFyY2hcdTAwRTlzIDogZ2VzdGlvbiBkZXMgc3RvY2tzLCB2ZW50ZXMsIHV0aWxpc2F0ZXVycywgZm91cm5pc3NldXJzIGV0IGJpZW4gcGx1cy4gQ29uXHUwMEU3dWUgcG91ciBjZW50cmFsaXNlciBldCBvcHRpbWlzZXIgbCdhY3Rpdml0XHUwMEU5IGRlIHBsdXNpZXVycyBwb2ludHMgZGUgdmVudGUuXCIsXHJcbiAgXCJhdXRob3JcIjoge1xyXG4gICAgXCJuYW1lXCI6IFwiQ2hyaXN0aWFuXCIsXHJcbiAgICBcImVtYWlsXCI6IFwiY2hyaXN0aWFuYWthNjVAZ21haWwuY29tXCJcclxuICB9LFxyXG4gIFwibWFpblwiOiBcImVsZWN0cm9uL21haW4uanNcIixcclxuICBcInNjcmlwdHNcIjoge1xyXG4gICAgXCJkZXZcIjogXCJ2aXRlXCIsXHJcbiAgICBcImJ1aWxkXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLXdpbiAtLXg2NCAtLXB1Ymxpc2g9YWx3YXlzXCIsXHJcbiAgICBcImJ1aWxkOmxpbnV4XCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLWxpbnV4IC0tcHVibGlzaD1hbHdheXNcIixcclxuICAgIFwiYnVpbGQ6bWFjXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLW1hYyAtLXB1Ymxpc2g9YWx3YXlzXCIsXHJcbiAgICBcImJ1aWxkOndpblwiOiBcIm5wbSBydW4gY2xlYW4gJiYgbnBtIHJ1biBidWlsZC1vbmx5ICYmIGVsZWN0cm9uLWJ1aWxkZXIgLS13aW4gLS14NjQgLS1wdWJsaXNoPWFsd2F5c1wiLFxyXG4gICAgXCJwcmV2aWV3XCI6IFwidml0ZSBwcmV2aWV3XCIsXHJcbiAgICBcImJ1aWxkLW9ubHlcIjogXCJ2aXRlIGJ1aWxkIC0tbW9kZSBwcm9kdWN0aW9uICYmIHZpdGUgYnVpbGQgLS1tb2RlIGVsZWN0cm9uIHx8IGV4aXQgMFwiLFxyXG4gICAgXCJ0eXBlLWNoZWNrXCI6IFwidnVlLXRzYyAtLWJ1aWxkIC0tZm9yY2VcIixcclxuICAgIFwibGludFwiOiBcImVzbGludCAuIC0tZXh0IC52dWUsLmpzLC5qc3gsLmNqcywubWpzLC50cywudHN4LC5jdHMsLm10cyAtLWZpeCAtLWlnbm9yZS1wYXRoIC5naXRpZ25vcmVcIixcclxuICAgIFwiZm9ybWF0XCI6IFwicHJldHRpZXIgLS13cml0ZSBzcmMvXCIsXHJcbiAgICBcImVsZWN0cm9uOmRldlwiOiBcInZpdGUgLS1tb2RlIGVsZWN0cm9uXCIsXHJcbiAgICBcImVsZWN0cm9uOmJ1aWxkXCI6IFwibnBtIHJ1biBlbGVjdHJvbjpidWlsZC1vcHRpbWl6ZWRcIixcclxuICAgIFwiZWxlY3Ryb246YnVpbGQtd2luXCI6IFwibnBtIHJ1biBlbGVjdHJvbjpidWlsZC13aW4tb3B0aW1pemVkXCIsXHJcbiAgICBcImVsZWN0cm9uOmJ1aWxkLXdpbi1wdWJsaXNoXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLXdpbiAtLXg2NCAtLXB1Ymxpc2g9YWx3YXlzXCIsXHJcbiAgICBcImVsZWN0cm9uOmJ1aWxkLWNsZWFuXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGVsZWN0cm9uOmJ1aWxkLXdpbi1wdWJsaXNoXCIsXHJcbiAgICBcImVsZWN0cm9uOnB1Ymxpc2hcIjogXCJucG0gcnVuIGNsZWFuICYmIG5wbSBydW4gYnVpbGQtb25seSAmJiBlbGVjdHJvbi1idWlsZGVyIC0td2luIC0teDY0IC0tcHVibGlzaD1hbHdheXNcIixcclxuICAgIFwiZWxlY3Ryb246c3RhcnRcIjogXCJlbGVjdHJvbiAuXCIsXHJcbiAgICBcImVsZWN0cm9uOmRlYnVnXCI6IFwiZWxlY3Ryb24gLiAtLWluc3BlY3Q9OTIyOVwiLFxyXG4gICAgXCJlbGVjdHJvbjpkZXYtZGVidWdcIjogXCJ2aXRlIC0tbW9kZSBlbGVjdHJvbiAmJiBlbGVjdHJvbiAuIC0taW5zcGVjdD05MjI5XCIsXHJcbiAgICBcImNsZWFuXCI6IFwicm0gLXJmIHJlbGVhc2UgZGlzdFwiLFxyXG4gICAgXCJjbGVhbjp3aW5cIjogXCJpZiBleGlzdCByZWxlYXNlIHJtZGlyIC9zIC9xIHJlbGVhc2UgJiYgaWYgZXhpc3QgZGlzdCBybWRpciAvcyAvcSBkaXN0XCIsXHJcbiAgICBcImNoZWNrLWljb25zXCI6IFwibm9kZSBmaXgtaWNvbnMuanNcIixcclxuICAgIFwiYW5hbHl6ZVwiOiBcIm5wbSBydW4gYnVpbGQtb25seSAmJiBlY2hvICdCdW5kbGUgYW5hbHlzaXMgc2F2ZWQgdG8gZGlzdC9zdGF0cy5odG1sJ1wiLFxyXG4gICAgXCJlbGVjdHJvbjpidWlsZC1vcHRpbWl6ZWRcIjogXCJucG0gcnVuIGNsZWFuICYmIG5wbSBydW4gYnVpbGQtb25seSAmJiBlbGVjdHJvbi1idWlsZGVyIC0tcHVibGlzaD1uZXZlclwiLFxyXG4gICAgXCJlbGVjdHJvbjpidWlsZC13aW4tb3B0aW1pemVkXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLXdpbiAtLXg2NCAtLXB1Ymxpc2g9bmV2ZXJcIixcclxuICAgIFwicGVyZm9ybWFuY2U6Y2hlY2tcIjogXCJucG0gcnVuIGJ1aWxkLW9ubHkgJiYgbnBtIHJ1biBhbmFseXplXCIsXHJcbiAgICBcInJlbGVhc2U6bG9jYWxcIjogXCJucG0gcnVuIGNsZWFuICYmIG5wbSBydW4gdHlwZS1jaGVjayAmJiBucG0gcnVuIGxpbnQgJiYgbnBtIHJ1biBidWlsZC1vbmx5ICYmIGVsZWN0cm9uLWJ1aWxkZXIgLS13aW4gLS14NjQgLS1wdWJsaXNoPW5ldmVyXCIsXHJcbiAgICBcInJlbGVhc2U6Z2l0aHViXCI6IFwibnBtIHJ1biBjbGVhbiAmJiBucG0gcnVuIHR5cGUtY2hlY2sgJiYgbnBtIHJ1biBsaW50ICYmIG5wbSBydW4gYnVpbGQtb25seSAmJiBlbGVjdHJvbi1idWlsZGVyIC0td2luIC0teDY0IC0tcHVibGlzaD1hbHdheXNcIixcclxuICAgIFwicmVsZWFzZTpkcmFmdFwiOiBcIm5wbSBydW4gY2xlYW4gJiYgbnBtIHJ1biB0eXBlLWNoZWNrICYmIG5wbSBydW4gbGludCAmJiBucG0gcnVuIGJ1aWxkLW9ubHkgJiYgZWxlY3Ryb24tYnVpbGRlciAtLXdpbiAtLXg2NCAtLXB1Ymxpc2g9b25UYWdPckRyYWZ0XCIsXHJcbiAgICBcInJlbGVhc2U6cGF0Y2hcIjogXCJucG0gdmVyc2lvbiBwYXRjaCAmJiBucG0gcnVuIHJlbGVhc2U6Z2l0aHViXCIsXHJcbiAgICBcInJlbGVhc2U6bWlub3JcIjogXCJucG0gdmVyc2lvbiBtaW5vciAmJiBucG0gcnVuIHJlbGVhc2U6Z2l0aHViXCIsXHJcbiAgICBcInJlbGVhc2U6bWFqb3JcIjogXCJucG0gdmVyc2lvbiBtYWpvciAmJiBucG0gcnVuIHJlbGVhc2U6Z2l0aHViXCIsXHJcbiAgICBcInByZXJlbGVhc2VcIjogXCJucG0gcnVuIHR5cGUtY2hlY2sgJiYgbnBtIHJ1biBsaW50XCIsXHJcbiAgICBcInBvc3RyZWxlYXNlXCI6IFwiZWNobyAnXHVEODNDXHVERjg5IFJlbGVhc2UgY29tcGxldGVkIHN1Y2Nlc3NmdWxseSEgQ2hlY2s6IGh0dHBzOi8vZ2l0aHViLmNvbS9DaHJpc3RpYW56ZXIvTXVsdGlNYXJrZXQvcmVsZWFzZXMnXCJcclxuICB9LFxyXG4gIFwiZGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiQHJhZGl4LWljb25zL3Z1ZVwiOiBcIl4xLjAuMFwiLFxyXG4gICAgXCJAdGFuc3RhY2svdnVlLXRhYmxlXCI6IFwiXjguMTEuOFwiLFxyXG4gICAgXCJAdGFuc3RhY2svdnVlLXZpcnR1YWxcIjogXCJeMy4xMy4xMlwiLFxyXG4gICAgXCJAdW5vdmlzL3Z1ZVwiOiBcIl4xLjMuM1wiLFxyXG4gICAgXCJAdmVlLXZhbGlkYXRlL3pvZFwiOiBcIl40LjEyLjVcIixcclxuICAgIFwiQHZ1ZXVzZS9jb3JlXCI6IFwiXjEwLjcuMlwiLFxyXG4gICAgXCJjbGFzcy12YXJpYW5jZS1hdXRob3JpdHlcIjogXCJeMC43LjBcIixcclxuICAgIFwiY2xzeFwiOiBcIl4yLjEuMFwiLFxyXG4gICAgXCJlbGVjdHJvbi11cGRhdGVyXCI6IFwiXjYuNi4yXCIsXHJcbiAgICBcImZlYXRoZXItaWNvbnNcIjogXCJeNC4yOS4xXCIsXHJcbiAgICBcImx1Y2lkZS12dWUtbmV4dFwiOiBcIl4wLjMyMy4wXCIsXHJcbiAgICBcInBpbmlhXCI6IFwiXjIuMS43XCIsXHJcbiAgICBcInJhZGl4LXZ1ZVwiOiBcIl4xLjQuMlwiLFxyXG4gICAgXCJ0YWlsd2luZC1tZXJnZVwiOiBcIl4yLjIuMVwiLFxyXG4gICAgXCJ0YWlsd2luZGNzcy1hbmltYXRlXCI6IFwiXjEuMC43XCIsXHJcbiAgICBcInYtY2FsZW5kYXJcIjogXCJeMy4xLjJcIixcclxuICAgIFwidmVlLXZhbGlkYXRlXCI6IFwiXjQuMTIuNVwiLFxyXG4gICAgXCJ2dWVcIjogXCJeMy40LjE4XCIsXHJcbiAgICBcInZ1ZS1mZWF0aGVyXCI6IFwiXjIuMC4wXCIsXHJcbiAgICBcInZ1ZS1yb3V0ZXJcIjogXCJeNC4yLjVcIixcclxuICAgIFwidnVlLXNvbm5lclwiOiBcIl4yLjAuMlwiLFxyXG4gICAgXCJ6b2RcIjogXCJeMy4yMi40XCJcclxuICB9LFxyXG4gIFwiZGV2RGVwZW5kZW5jaWVzXCI6IHtcclxuICAgIFwiQHJ1c2hzdGFjay9lc2xpbnQtcGF0Y2hcIjogXCJeMS4zLjNcIixcclxuICAgIFwiQHRzY29uZmlnL25vZGUyMFwiOiBcIl4yMC4xLjJcIixcclxuICAgIFwiQHR5cGVzL25vZGVcIjogXCJeMjAuMTEuMTZcIixcclxuICAgIFwiQHR5cGVzL3Z1ZS1yb3V0ZXJcIjogXCJeMi4wLjBcIixcclxuICAgIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI6IFwiXjUuMC4zXCIsXHJcbiAgICBcIkB2dWUvZXNsaW50LWNvbmZpZy1wcmV0dGllclwiOiBcIl44LjAuMFwiLFxyXG4gICAgXCJAdnVlL2VzbGludC1jb25maWctdHlwZXNjcmlwdFwiOiBcIl4xMi4wLjBcIixcclxuICAgIFwiQHZ1ZS90c2NvbmZpZ1wiOiBcIl4wLjUuMVwiLFxyXG4gICAgXCJhdXRvcHJlZml4ZXJcIjogXCJeMTAuNC4xN1wiLFxyXG4gICAgXCJlbGVjdHJvblwiOiBcIl4zNy4yLjRcIixcclxuICAgIFwiZWxlY3Ryb24tYnVpbGRlclwiOiBcIl4yNi4wLjEyXCIsXHJcbiAgICBcImVzbGludFwiOiBcIl44LjQ5LjBcIixcclxuICAgIFwiZXNsaW50LXBsdWdpbi12dWVcIjogXCJeOS4xNy4wXCIsXHJcbiAgICBcIm5wbS1ydW4tYWxsMlwiOiBcIl42LjEuMVwiLFxyXG4gICAgXCJwcmV0dGllclwiOiBcIl4zLjAuM1wiLFxyXG4gICAgXCJyb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXJcIjogXCJeNi4wLjNcIixcclxuICAgIFwidGFpbHdpbmRjc3NcIjogXCJeMy40LjFcIixcclxuICAgIFwidHlwZXNjcmlwdFwiOiBcIn41LjMuMFwiLFxyXG4gICAgXCJ2aXRlXCI6IFwiXjUuMC4xMVwiLFxyXG4gICAgXCJ2aXRlLXBsdWdpbi1lbGVjdHJvblwiOiBcIl4wLjI5LjBcIixcclxuICAgIFwidml0ZS1wbHVnaW4tZWxlY3Ryb24tcmVuZGVyZXJcIjogXCJeMC4xNC42XCIsXHJcbiAgICBcInZ1ZS10c2NcIjogXCJeMS44LjI3XCJcclxuICB9XHJcbn1cclxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxsYXJhZ29uXFxcXHd3d1xcXFxNdWx0aU1hcmtldFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcbGFyYWdvblxcXFx3d3dcXFxcTXVsdGlNYXJrZXRcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L2xhcmFnb24vd3d3L011bHRpTWFya2V0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XHJcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXHJcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJ1xyXG5pbXBvcnQgdGFpbHdpbmQgZnJvbSAndGFpbHdpbmRjc3MnXHJcbmltcG9ydCBhdXRvcHJlZml4ZXIgZnJvbSAnYXV0b3ByZWZpeGVyJ1xyXG5pbXBvcnQgZWxlY3Ryb24gZnJvbSAndml0ZS1wbHVnaW4tZWxlY3Ryb24nXHJcbmltcG9ydCBlbGVjdHJvblJlbmRlcmVyIGZyb20gJ3ZpdGUtcGx1Z2luLWVsZWN0cm9uLXJlbmRlcmVyJ1xyXG5pbXBvcnQgeyB2aXN1YWxpemVyIH0gZnJvbSAncm9sbHVwLXBsdWdpbi12aXN1YWxpemVyJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xyXG4gIGNvbnN0IHJvb3REaXIgPSBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJyk7XHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcbiAgY29uc3QgcHJvZHVjdGlvbiA9IGVudi5OT0RFX0VOViA9PT0gJ3Byb2R1Y3Rpb24nO1xyXG4gIGNvbnN0IGlzRWxlY3Ryb24gPSBtb2RlID09PSAnZWxlY3Ryb24nO1xyXG5cclxuICBjb25zdCBwbHVnaW5zID0gW3Z1ZSgpXTtcclxuICBcclxuICAvLyBBam91dGVyIGwnYW5hbHlzZXVyIGRlIGJ1bmRsZSBlbiBtb2RlIHByb2R1Y3Rpb25cclxuICBpZiAocHJvZHVjdGlvbiAmJiAhaXNFbGVjdHJvbikge1xyXG4gICAgcGx1Z2lucy5wdXNoKFxyXG4gICAgICB2aXN1YWxpemVyKHtcclxuICAgICAgICBmaWxlbmFtZTogJ2Rpc3Qvc3RhdHMuaHRtbCcsXHJcbiAgICAgICAgb3BlbjogdHJ1ZSxcclxuICAgICAgICBnemlwU2l6ZTogdHJ1ZSxcclxuICAgICAgICBicm90bGlTaXplOiB0cnVlLFxyXG4gICAgICB9KVxyXG4gICAgKTtcclxuICB9XHJcbiAgXHJcbiAgaWYgKGlzRWxlY3Ryb24pIHtcclxuICAgIHBsdWdpbnMucHVzaChcclxuICAgICAgLi4uZWxlY3Ryb24oW1xyXG4gICAgICAgIHtcclxuICAgICAgICAgIGVudHJ5OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnZWxlY3Ryb24vbWFpbi50cycpLFxyXG4gICAgICAgICAgb25zdGFydChhcmdzKSB7XHJcbiAgICAgICAgICAgIGlmIChwcm9jZXNzLmVudi5WU0NPREVfREVCVUcpIHtcclxuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnW3N0YXJ0dXBdIEVsZWN0cm9uIEFwcCcpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgIGFyZ3Muc3RhcnR1cCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdml0ZToge1xyXG4gICAgICAgICAgICBidWlsZDoge1xyXG4gICAgICAgICAgICAgIHNvdXJjZW1hcDogIXByb2R1Y3Rpb24sXHJcbiAgICAgICAgICAgICAgbWluaWZ5OiBwcm9kdWN0aW9uLFxyXG4gICAgICAgICAgICAgIG91dERpcjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2VsZWN0cm9uJyksXHJcbiAgICAgICAgICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWw6IFtcclxuICAgICAgICAgICAgICAgICAgJ2VsZWN0cm9uJyxcclxuICAgICAgICAgICAgICAgICAgJ2VsZWN0cm9uLXVwZGF0ZXInLFxyXG4gICAgICAgICAgICAgICAgICAuLi5PYmplY3Qua2V5cyhyZXF1aXJlKCcuL3BhY2thZ2UuanNvbicpLmRlcGVuZGVuY2llcyB8fCB7fSlcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBlbnRyeTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgJ2VsZWN0cm9uL3ByZWxvYWQudHMnKSxcclxuICAgICAgICAgIG9uc3RhcnQoYXJncykge1xyXG4gICAgICAgICAgICBhcmdzLnJlbG9hZCgpO1xyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIHZpdGU6IHtcclxuICAgICAgICAgICAgYnVpbGQ6IHtcclxuICAgICAgICAgICAgICBzb3VyY2VtYXA6ICFwcm9kdWN0aW9uLFxyXG4gICAgICAgICAgICAgIG1pbmlmeTogcHJvZHVjdGlvbixcclxuICAgICAgICAgICAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdlbGVjdHJvbicpLFxyXG4gICAgICAgICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIGV4dGVybmFsOiBbXHJcbiAgICAgICAgICAgICAgICAgICdlbGVjdHJvbicsXHJcbiAgICAgICAgICAgICAgICAgIC4uLk9iamVjdC5rZXlzKHJlcXVpcmUoJy4vcGFja2FnZS5qc29uJykuZGVwZW5kZW5jaWVzIHx8IHt9KVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICB9LFxyXG4gICAgICBdKSxcclxuICAgICAgZWxlY3Ryb25SZW5kZXJlcigpXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHJvb3Q6IHJvb3REaXIsXHJcbiAgICBiYXNlOiAnLi8nLFxyXG4gICAgYXBwVHlwZTogJ3NwYScsXHJcbiAgICBwbHVnaW5zLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHByb3h5OiB7XHJcbiAgICAgICAgJy9hcGknOiB7XHJcbiAgICAgICAgICB0YXJnZXQ6ICdodHRwczovL211bHRpLmNpYXRjaS5jb20vcHVibGljL2luZGV4LnBocCcsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IHRydWUsXHJcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpLywgJy9hcGknKVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGNzczoge1xyXG4gICAgICBwb3N0Y3NzOiB7XHJcbiAgICAgICAgcGx1Z2luczogW1xyXG4gICAgICAgICAgYXV0b3ByZWZpeGVyKCksXHJcbiAgICAgICAgICB0YWlsd2luZCgpLFxyXG4gICAgICAgIF0sXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICBhbGlhczoge1xyXG4gICAgICAgICdAJzogcm9vdERpcixcclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIG1pbmlmeTogcHJvZHVjdGlvbixcclxuICAgICAgc291cmNlbWFwOiBwcm9kdWN0aW9uLFxyXG4gICAgICBvdXREaXI6IHBhdGgucmVzb2x2ZShyb290RGlyLCAnLi4nLCAnZGlzdCcpLFxyXG4gICAgICBlbXB0eU91dERpcjogdHJ1ZSxcclxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxyXG4gICAgICByb2xsdXBPcHRpb25zOiB7XHJcbiAgICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgICAvLyBPcHRpbWlzYXRpb24gZGVzIGNodW5rcyBwb3VyIHVuIG1laWxsZXVyIGNhY2hlXHJcbiAgICAgICAgICBtYW51YWxDaHVua3M6IHtcclxuICAgICAgICAgICAgLy8gVmVuZG9yIGNodW5rIHBvdXIgbGVzIGRcdTAwRTlwZW5kYW5jZXMgc3RhYmxlc1xyXG4gICAgICAgICAgICAndmVuZG9yJzogWyd2dWUnLCAndnVlLXJvdXRlcicsICdwaW5pYSddLFxyXG4gICAgICAgICAgICAvLyBVSSBjaHVuayBwb3VyIGxlcyBjb21wb3NhbnRzIGQnaW50ZXJmYWNlXHJcbiAgICAgICAgICAgICd1aSc6IFsncmFkaXgtdnVlJywgJ2x1Y2lkZS12dWUtbmV4dCcsICdAcmFkaXgtaWNvbnMvdnVlJ10sXHJcbiAgICAgICAgICAgIC8vIFV0aWxzIGNodW5rIHBvdXIgbGVzIHV0aWxpdGFpcmVzXHJcbiAgICAgICAgICAgICd1dGlscyc6IFsnY2xzeCcsICd0YWlsd2luZC1tZXJnZScsICdjbGFzcy12YXJpYW5jZS1hdXRob3JpdHknLCAnQHZ1ZXVzZS9jb3JlJ10sXHJcbiAgICAgICAgICAgIC8vIEZvcm1zIGNodW5rIHBvdXIgbGEgdmFsaWRhdGlvblxyXG4gICAgICAgICAgICAnZm9ybXMnOiBbJ3ZlZS12YWxpZGF0ZScsICdAdmVlLXZhbGlkYXRlL3pvZCcsICd6b2QnXSxcclxuICAgICAgICAgICAgLy8gVGFibGVzIGNodW5rIHBvdXIgbGVzIHRhYmxlYXV4XHJcbiAgICAgICAgICAgICd0YWJsZXMnOiBbJ0B0YW5zdGFjay92dWUtdGFibGUnXSxcclxuICAgICAgICAgICAgLy8gQ2hhcnRzIGNodW5rIHBvdXIgbGVzIGdyYXBoaXF1ZXNcclxuICAgICAgICAgICAgJ2NoYXJ0cyc6IFsnQHVub3Zpcy92dWUnXVxyXG4gICAgICAgICAgfSxcclxuICAgICAgICAgIC8vIE5vbW1hZ2Ugb3B0aW1pc1x1MDBFOSBkZXMgY2h1bmtzXHJcbiAgICAgICAgICBjaHVua0ZpbGVOYW1lczogKGNodW5rSW5mbykgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmYWNhZGVNb2R1bGVJZCA9IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZCA/IGNodW5rSW5mby5mYWNhZGVNb2R1bGVJZC5zcGxpdCgnLycpLnBvcCgpIDogJ2NodW5rJ1xyXG4gICAgICAgICAgICByZXR1cm4gYGpzL1tuYW1lXS1baGFzaF0uanNgXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgYXNzZXRGaWxlTmFtZXM6IChhc3NldEluZm8pID0+IHtcclxuICAgICAgICAgICAgaWYgKGFzc2V0SW5mby5uYW1lICYmIGFzc2V0SW5mby5uYW1lLmVuZHNXaXRoKCcuY3NzJykpIHtcclxuICAgICAgICAgICAgICByZXR1cm4gJ2Nzcy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiAnYXNzZXRzL1tuYW1lXS1baGFzaF1bZXh0bmFtZV0nXHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgLy8gT3B0aW1pc2F0aW9uIGRlcyBkXHUwMEU5cGVuZGFuY2VzXHJcbiAgICBvcHRpbWl6ZURlcHM6IHtcclxuICAgICAgaW5jbHVkZTogW1xyXG4gICAgICAgICd2dWUnLCBcclxuICAgICAgICAndnVlLXJvdXRlcicsIFxyXG4gICAgICAgICdwaW5pYScsXHJcbiAgICAgICAgJ2x1Y2lkZS12dWUtbmV4dCcsXHJcbiAgICAgICAgJ3JhZGl4LXZ1ZScsXHJcbiAgICAgICAgJ0B2dWV1c2UvY29yZSdcclxuICAgICAgXSxcclxuICAgICAgZXhjbHVkZTogWydlbGVjdHJvbiddXHJcbiAgICB9LFxyXG4gICAgY2xlYXJTY3JlZW46IGZhbHNlLFxyXG4gIH1cclxufSk7XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7OztBQUFBO0FB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
