export interface MenuItem {
  title: string
  path: string
  icon: string
  roles: string[]
}

export interface MenuGroup {
  name: string
  items: MenuItem[]
}

// Configuration des menus basée sur les rôles
export const ROLE_MENUS: Record<string, MenuGroup[]> = {
  super_admin: [
    {
      name: 'Administration',
      items: [
        {
          title: 'Tableau de bord',
          path: '/dashboard/super-admin',
          icon: 'LayoutDashboard',
          roles: ['super_admin']
        },
        {
          title: 'SuperMarchés',
          path: '/dashboard/supermarkets',
          icon: 'Store',
          roles: ['super_admin']
        },
        {
          title: 'Utilisateurs',
          path: '/dashboard/users',
          icon: 'Users',
          roles: ['super_admin']
        },
        {
          title: 'Produits',
          path: '/dashboard/products',
          icon: 'Package',
          roles: ['super_admin']
        },
        {
          title: 'Restockage',
          path: '/dashboard/restock',
          icon: 'Package2',
          roles: ['super_admin']
        },
        {
          title: 'Ventes',
          path: '/dashboard/ventes',
          icon: 'Receipt',
          roles: ['super_admin']
        }
      ]
    }
  ],
  admin: [
    {
      name: 'Gestion',
      items: [
        {
          title: 'Tableau de bord',
          path: '/dashboard/admin',
          icon: 'LayoutDashboard',
          roles: ['admin']
        },
        {
          title: 'Utilisateurs',
          path: '/dashboard/users',
          icon: 'Users',
          roles: ['admin']
        },
        {
          title: 'Produits',
          path: '/dashboard/products',
          icon: 'Package',
          roles: ['admin']
        },
        {
          title: 'Restockage',
          path: '/dashboard/restock',
          icon: 'Package2',
          roles: ['admin']
        },
        {
          title: 'Ventes',
          path: '/dashboard/ventes',
          icon: 'Receipt',
          roles: ['admin']
        }
      ]
    }
  ],
  caissier: [
    {
      name: 'Caisse',
      items: [
        {
          title: 'Caisse',
          path: '/dashboard/caisse',
          icon: 'Calculator',
          roles: ['caissier']
        },
        {
          title: 'Mes Ventes',
          path: '/dashboard/ventes',
          icon: 'Receipt',
          roles: ['caissier']
        }
      ]
    }
  ]
}

// Fonction utilitaire pour obtenir les menus d'un rôle
export const getMenusForRole = (role: string): MenuGroup[] => {
  return ROLE_MENUS[role] || []
}

// Fonction pour vérifier si un utilisateur a accès à une route
export const hasAccessToRoute = (userRole: string, routePath: string): boolean => {
  const menus = getMenusForRole(userRole)
  
  for (const group of menus) {
    for (const item of group.items) {
      if (item.path === routePath) {
        return item.roles.includes(userRole)
      }
    }
  }
  
  return false
}