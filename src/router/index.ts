import { createRouter, createWebHashHistory, type RouteMeta } from 'vue-router'
import DashboardLayoutVue from '@/layouts/dashboard.vue';
import { useAuthStore } from '@/stores/auth';

interface IRouteMeta {
  title: string
  requiresAuth?: boolean
}

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login.vue'),
      meta: {
        title: 'Login',
        requiresAuth: false,
      } as RouteMeta & IRouteMeta,
    },
    {
      path: '/dashboard',
      component: DashboardLayoutVue,
      redirect: '/dashboard/home',
      meta: {
        title: 'Dashboard',
        requiresAuth: true,
      },
      children: [
        // Routes basées sur les rôles
        {
          path: 'super-admin',
          name: 'super_admin_dashboard',
          component: () => import('@/views/dashboard/SuperAdminDashboard.vue'),
          meta: {
            title: 'Tableau de bord Super Admin',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'admin',
          name: 'admin_dashboard',
          component: () => import('@/views/dashboard/AdminDashboard.vue'),
          meta: {
            title: 'Tableau de bord Admin',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'caissier',
          name: 'caissier_dashboard',
          component: () => import('@/views/dashboard/CaissierDashboard.vue'),
          meta: {
            title: 'Tableau de bord Caissier',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        // Routes fonctionnelles
        {
          path: 'supermarkets',
          name: 'supermarkets',
          component: () => import('@/views/dashboard/supermarkets/Index.vue'),
          meta: {
            title: 'SuperMarchés',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/views/dashboard/users/Index.vue'),
          meta: {
            title: 'Utilisateurs',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'products',
          name: 'products',
          component: () => import('@/views/dashboard/products/Index.vue'),
          meta: {
            title: 'Produits',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'caisse',
          name: 'caisse',
          component: () => import('@/views/dashboard/sales/Caisse.vue'),
          meta: {
            title: 'Caisse',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'ventes',
          name: 'liste_ventes',
          component: () => import('@/views/dashboard/sales/ListeVentes.vue'),
          meta: {
            title: 'Liste des Ventes',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'create-sale',
          name: 'create_sale',
          component: () => import('@/views/dashboard/create-sale/Index.vue'),
          meta: {
            title: 'Créer Vente',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'restock',
          name: 'restock',
          component: () => import('@/views/dashboard/restock/Index.vue'),
          meta: {
            title: 'Restockage',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/dashboard/profile/Index.vue'),
          meta: {
            title: 'Mon Profil',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        // Routes anciennes (à garder pour compatibilité)
        {
          path: 'home',
          name: 'home',
          component: () => import('@/views/dashboard/examples/Home.vue'),
          meta: {
            title: 'Home',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'task',
          name: 'tasks_index',
          component: () => import('@/views/dashboard/examples/tasks/Index.vue'),
          meta: {
            title: 'Tasks',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'user',
          name: 'user_index',
          component: () => import('@/views/dashboard/examples/user/Index.vue'),
          meta: {
            title: 'User',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
        {
          path: 'settings',
          name: 'settings_index',
          component: () => import('@/views/dashboard/examples/settings/Index.vue'),
          meta: {
            title: 'Settings',
            requiresAuth: true,
          } as RouteMeta & IRouteMeta
        },
      ],
    },
    {
      path: '/:pathMatch(.*)',
      name: 'not-found',
      component: () => import('@/views/404.vue'),
      meta: {
        title: 'Page Not Found',
      } as RouteMeta & IRouteMeta,
    },
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  // Initialiser l'authentification au premier chargement
  if (!authStore.isAuthenticated && authStore.token) {
    await authStore.initAuth();
  }

  // Vérifier si la route nécessite une authentification
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  
  if (requiresAuth && !authStore.isLoggedIn) {
    // Rediriger vers login si non authentifié
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else if (to.name === 'login' && authStore.isLoggedIn) {
    // Rediriger vers le bon dashboard selon le rôle
    const userRole = authStore.userRole;
    if (userRole === 'super_admin') {
      next({ path: '/dashboard/super-admin' });
    } else if (userRole === 'admin') {
      next({ path: '/dashboard/admin' });
    } else if (userRole === 'caissier') {
      next({ path: '/dashboard/caissier' });
    } else {
      next({ path: '/dashboard/home' });
    }
  } else if (to.path === '/dashboard' && authStore.isLoggedIn) {
    // Rediriger depuis /dashboard vers le bon dashboard selon le rôle
    const userRole = authStore.userRole;
    if (userRole === 'super_admin') {
      next({ path: '/dashboard/super-admin' });
    } else if (userRole === 'admin') {
      next({ path: '/dashboard/admin' });
    } else if (userRole === 'caissier') {
      next({ path: '/dashboard/caissier' });
    } else {
      next({ path: '/dashboard/home' });
    }
  } else {
    // Mettre à jour le titre de la page
    document.title = to.meta.title as string;
    next();
  }
})

export default router
