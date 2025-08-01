# 📊 Dashboard Admin - Intégration API

Ce document explique comment intégrer l'API `/api/dashboard` pour le dashboard administrateur.

## 📋 Structure des données attendues

Le dashboard admin attend des données au format suivant :

```typescript
interface AdminDashboardData {
  type: 'admin'
  supermarket: {
    id: number
    name: string
    code: string
  }
  overview: {
    total_users: number
    total_products: number
  }
  revenue: {
    total: number
    today: number
    month: number
  }
  cashiers_performance: Array<{
    username: string
    sales_count: number
    revenue: number
  }>
  last_7_days: Array<{
    date: string  // Format: "YYYY-MM-DD"
    revenue: number
    sales: number
  }>
  today_hourly: Array<{
    hour: number  // 0-23
    sales: number
    revenue: number
  }>
}
```

## 🔧 Configuration API

### Endpoint
```
GET /api/dashboard
```

### Headers requis
```
Authorization: Bearer <token>
Content-Type: application/json
```

### Exemple de réponse
```json
{
  "type": "admin",
  "supermarket": {
    "id": 1,
    "name": "Carrefour Abidjan",
    "code": "CAR_ABI"
  },
  "overview": {
    "total_users": 3,
    "total_products": 8
  },
  "revenue": {
    "total": 5680.40,
    "today": 89.50,
    "month": 1850.30
  },
  "cashiers_performance": [
    {
      "username": "marie_carrefour",
      "sales_count": 28,
      "revenue": 1250.80
    },
    {
      "username": "paul_carrefour", 
      "sales_count": 17,
      "revenue": 599.50
    }
  ],
  "last_7_days": [
    {
      "date": "2025-07-23",
      "revenue": 180.30,
      "sales": 7
    },
    {
      "date": "2025-07-24", 
      "revenue": 234.60,
      "sales": 9
    }
  ],
  "today_hourly": [
    {
      "hour": 8,
      "sales": 2,
      "revenue": 15.40
    },
    {
      "hour": 9,
      "sales": 5,
      "revenue": 28.90
    }
  ]
}
```

## 🔄 Intégration dans le code

### 1. Activer l'API réelle

Dans `/src/views/dashboard/AdminDashboard.vue`, remplacez :

```typescript
// Actuel (mode test)
await new Promise(resolve => setTimeout(resolve, 1000))
dashboardData.value = mockAdminDashboardData

// Par (mode production)
const response = await api.dashboard.getData()
dashboardData.value = response as unknown as AdminDashboardData
```

### 2. Configurer le service API

Dans `/src/services/api.ts`, assurez-vous que l'endpoint dashboard existe :

```typescript
export const api = {
  dashboard: {
    getData: () => apiService.get('/dashboard')
  }
  // ... autres endpoints
}
```

## 🧪 Tests et validation

### Données de test disponibles
Les données mock sont dans `/src/services/mock-admin-data.ts` pour les tests.

### Validation des données
Le dashboard inclus des validations pour :
- Gestion des états de chargement
- Gestion des erreurs API
- Calculs automatiques (totaux, moyennes)
- Formatage des devises et dates

## 📈 Fonctionnalités du dashboard

### Statistiques principales
- **Utilisateurs** : Nombre total d'utilisateurs du supermarché
- **Produits** : Nombre de produits en stock
- **Ventes totales** : Somme des ventes de tous les caissiers
- **CA Total** : Chiffre d'affaires global

### Revenus
- **Aujourd'hui** : Revenus de la journée en cours
- **Ce mois** : Cumul mensuel des revenus

### Performance des caissiers
- Classement par chiffre d'affaires
- Calcul automatique des moyennes
- Badge pour le meilleur caissier

### Analyses temporelles
- **7 derniers jours** : Évolution quotidienne
- **Activité aujourd'hui** : Répartition par heure

## 🎨 Personnalisation

### Couleurs et thème
Le dashboard utilise les couleurs définies dans le système de design :
- Vert pour les revenus du jour
- Bleu pour les revenus mensuels
- Jaune pour les badges de performance

### Format des devises
Par défaut configuré pour le franc CFA français. Pour modifier :

```typescript
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF', // Modifier ici pour XOF (franc CFA)
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}
```

## 🔒 Sécurité

- L'accès au dashboard nécessite une authentification
- Les données sont filtrées par supermarché selon l'utilisateur connecté
- Toutes les requêtes incluent le token d'authentification

## 📱 Responsive Design

Le dashboard est optimisé pour :
- **Desktop** : Affichage en grille complète
- **Tablet** : Adaptation des colonnes
- **Mobile** : Empilement vertical des cartes