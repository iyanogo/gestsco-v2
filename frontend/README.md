# GestSco - Gestion Scolaire

Application de gestion scolaire développée avec React, TypeScript et Vite.

## Technologies

- **React** 18.2.0
- **TypeScript** 5.3+
- **Vite** 5.0+
- **React Router** 6.20+
- **Material-UI (MUI)** 5.14+
- **Axios** 1.6+
- **Zustand** 4.4+ (state management)
- **React Hook Form** 7.48+ (gestion des formulaires)

## Structure du projet

```
src/
  ├── components/       # Composants réutilisables
  ├── pages/           # Pages de l'application
  ├── services/        # Services API
  ├── store/           # State management (Zustand)
  ├── hooks/           # Custom hooks
  ├── utils/           # Utilitaires
  ├── types/           # Types TypeScript
  ├── App.tsx          # Composant principal
  ├── index.tsx        # Point d'entrée
  └── theme.ts         # Thème Material-UI
```

## Installation

```bash
# Cloner le repository
git clone <repository-url>
cd gestsco-v2

# Installer les dépendances
npm install

# Copier le fichier d'environnement
cp .env.example .env
```

## Configuration

Modifier le fichier `.env` selon votre environnement :

```env
VITE_API_URL=http://localhost:8000
```

## Développement

```bash
# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## Build

```bash
# Créer le build de production
npm run build

# Prévisualiser le build
npm run preview
```

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Crée le build de production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |

## Configuration API Proxy

Le proxy API est configuré dans `vite.config.ts` pour rediriger les requêtes `/api/*` vers `http://localhost:8000`.

## Authentification

L'application utilise un système d'authentification JWT complet.

### Pages disponibles

| Route | Description | Accès |
|-------|-------------|-------|
| `/login` | Page de connexion | Public |
| `/register` | Page d'inscription | Public |
| `/dashboard` | Tableau de bord | Authentifié |
| `/profile` | Profil utilisateur | Authentifié |
| `/users` | Gestion des utilisateurs | Admin |

### Fonctionnalités

- **Connexion** : Authentification avec email/mot de passe
- **Inscription** : Création de compte utilisateur
- **Token JWT** : Stocké dans localStorage, ajouté automatiquement aux requêtes
- **Routes protégées** : Redirection vers `/login` si non authentifié
- **Persistance** : L'utilisateur reste connecté après rechargement de la page
- **Déconnexion** : Suppression du token et redirection

### Utilisation

1. Démarrer le backend FastAPI sur le port 8000
2. Démarrer le frontend avec `npm run dev`
3. Accéder à http://localhost:3000
4. Se connecter avec les identifiants admin :
   - Email : `admin@gestsco.com`
   - Mot de passe : `Admin@123`

### Structure des fichiers d'authentification

```
src/
  ├── types/auth.ts           # Types TypeScript (User, AuthState, etc.)
  ├── services/
  │   ├── api.ts              # Instance Axios avec intercepteurs
  │   └── authService.ts      # Fonctions d'authentification
  ├── store/authStore.ts      # Store Zustand pour l'état d'auth
  ├── hooks/useAuth.ts        # Hook personnalisé
  ├── components/
  │   ├── Layout.tsx          # Layout avec AppBar et Drawer
  │   └── ProtectedRoute.tsx  # Composant de protection des routes
  └── pages/
      ├── LoginPage.tsx       # Page de connexion
      ├── RegisterPage.tsx    # Page d'inscription
      ├── DashboardPage.tsx   # Tableau de bord
      └── ProfilePage.tsx     # Page de profil
```
