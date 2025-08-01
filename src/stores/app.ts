import { defineStore } from 'pinia';

interface BrandingConfig {
  logo: string
  primaryColor: string
  secondaryColor: string
  supermarketName: string
}

interface IAppStore {
  themeMode: 'light' | 'dark'
  sidebarExpand: boolean
  wrapperWidth: number | string
  wrapperLeftOffset: number | string
  navWidth: number | string
  branding: BrandingConfig | null
}

const LIGHT = 'light';
const DARK = 'dark';
const THEME_KEY = 'themeMode';
const EXPAND = 280;
const SHRINKED = 72;

export const useAppStore = defineStore('app', {
  state: () => <IAppStore>({
    themeMode: LIGHT,
    sidebarExpand: true,
    wrapperWidth: 0,
    wrapperLeftOffset: 0,
    navWidth: '100%',
    branding: null
  }),
  getters: {
    theme: (state) => state.themeMode,
    isDark: (state) => state.themeMode === DARK,
    sidebarExpanded: (state) => state.sidebarExpand,
    currentBranding: (state) => state.branding,
    hasCustomBranding: (state) => !!state.branding,
    logoUrl: (state) => state.branding?.logo || '/favicon.ico',
    primaryColor: (state) => state.branding?.primaryColor || '#0066CC',
    secondaryColor: (state) => state.branding?.secondaryColor || '#64748b',
    supermarketName: (state) => state.branding?.supermarketName || 'SuperMarket Admin'
  },
  actions: {
    toggleSidebar() {
      this.sidebarExpand = !this.sidebarExpand;
      if (window.innerWidth > 1024) {
        this.initWrapper();
      }
    },
    initWrapper() {
      if (window.innerWidth > 1024) {
        if (this.sidebarExpand) {
          this.wrapperWidth = EXPAND;
          this.wrapperLeftOffset = EXPAND;
        } else {
          this.wrapperWidth = SHRINKED;
          this.wrapperLeftOffset = SHRINKED;
        }
        this.navWidth = `calc(100% - ${this.wrapperWidth}px)`
      } else {
        this.navWidth = '100%';
        this.sidebarExpand = false;
        this.wrapperWidth = '100%';
        this.wrapperLeftOffset = '100%';
      }
    },
    initTheme() {
      const cache = localStorage.getItem(THEME_KEY);
      if (cache) {
        this.themeMode = cache as 'light' | 'dark';
      }
      window.addEventListener('resize', this.initWrapper);
      this.applyTheme();
      this.initWrapper();
    },
    toggleTheme() {
      this.themeMode = this.themeMode === LIGHT ? DARK : LIGHT;
      this.applyTheme();
      localStorage.setItem(THEME_KEY, this.themeMode);
    },
    appUnmount() {
      window.removeEventListener('resize', this.initWrapper);
    },
    applyTheme() {
      document.documentElement.classList.remove(LIGHT, DARK);
      document.body.classList.remove(LIGHT, DARK);
      document.documentElement.classList.add(this.themeMode);
      document.body.classList.add(this.themeMode);
      this.applyCustomColors();
    },
    setBranding(branding: BrandingConfig) {
      this.branding = branding;
      this.applyCustomColors();
    },
    resetBranding() {
      this.branding = null;
      this.applyCustomColors();
    },
    applyCustomColors() {
      const root = document.documentElement;
      
     
        // Réinitialiser aux couleurs par défaut
        root.style.removeProperty('--primary');
        root.style.removeProperty('--secondary');
        root.style.removeProperty('--accent');
      
    },
    hexToHsl(hex: string): string {
      // Convertir hex (#228B22, #FFD700) en HSL pour compatibilité avec Tailwind
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    },
  },
});
