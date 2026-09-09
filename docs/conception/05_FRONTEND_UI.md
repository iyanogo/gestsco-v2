# 05 - Frontend UI

**Mise à jour** : 07/09/2026 - corrections auth/RBAC intégrées

## 1. Stack & outils

| Outil | Configuration |
|-------|---------------|
| Vite | Port 3000, alias `@/` → `src/` |
| TypeScript | Mode strict activé |
| Sass | `src/styles/scss/main.scss` |
| Proxy | `/api` → `http://127.0.0.1:8000` |

## 2. Routing

### Routes publiques

| Route | Page | Description |
|-------|------|-------------|
| `/login` | LoginPage (Bootstrap) | Connexion - **branchée sur l'API réelle** |
| `/register` | RegisterPage (MUI) | Inscription |
| `/inscription` | InscriptionPubliquePage | Candidature en ligne |
| `/suivi-dossier` | SuiviDossierPage | Suivi candidature |
| `/bootstrap` | BootstrapDemo | Démo composants |

### Routes Bootstrap - **protégées** (corrigé depuis le 18/08/2026)

Préfixe selon rôle dans l'URL, toutes enveloppées par `ProtectedRoute` :

#### Admin (`/admin/*`) - 40+ routes

- Dashboard, référentiel (universités → matières)
- Étudiants (liste, dossiers, inscriptions, documents)
- Évaluations (sessions, examens, notes, délibérations, bulletins)
- Emploi du temps (planning, salles, réservations)
- Finances (factures, paiements, frais)
- Paramétrage, administration, LMD

**Stages/Soutenances** : pages branchées API et exposées dans le menu admin (`Stages` → `/admin/stages`, `/admin/soutenances`), filtrées RBAC (admin/scolarité, pas comptable).

#### Enseignant (`/enseignant/*`)

- Dashboard, emploi du temps, stages encadrés, saisie notes, **feuille d'appel**, **résultats matières (lecture seule)** - branchés API 08/09/2026

#### Étudiant (`/etudiant/*`)

- Dashboard, résultats, EDT, présences, finances (lecture seule) - branchés API ; bulletins/documents encore placeholders

### Routes MUI legacy (protégées par `ProtectedRoute`)

40+ routes sous `Layout` MUI : `/dashboard`, `/etudiants`, `/sessions`, etc. - **toujours actives**, retrait non commencé (~138 fichiers composants MUI).

### Redirections

- `/` → `/admin/dashboard`
- `/dashboard` → `/admin/dashboard`
- `*` → `/admin/dashboard`

## 3. Authentification frontend

### Flux MUI legacy - fonctionnel (inchangé)

```
LoginPage MUI / RegisterPage
  → authStore.login()
    → authService.login() → POST /api/v1/auth/login
      → JWT → localStorage
        → api.ts interceptor ajoute Bearer
          → ProtectedRoute vérifie isAuthenticated
```

### Flux Bootstrap - ✅ corrigé (n'est plus une démo)

```
LoginPage Bootstrap
  → authService.login() → POST /api/v1/auth/login
    → JWT réel → localStorage
      → redirect selon rôle utilisateur (admin/enseignant/etudiant)
        → ProtectedRoute + rbac.ts filtrent l'accès
```

**Ancien constat (18/08/2026, obsolète)** : *"L'utilisateur accède à `/admin/*` sans authentification backend valide."* - **Ce problème est corrigé.** Le login Bootstrap effectue désormais un appel réel à l'API et les routes sont protégées.

### RBAC frontend (nouveau)

- `rbac.ts` - définition des permissions par rôle
- `usePermissions` - hook de vérification des droits
- Menu latéral filtré dynamiquement selon le rôle connecté
- Utilisateurs démo différenciés : admin, scolarité, comptable

⚠️ **Limite actuelle** : le RBAC couvre la **navigation** (menus, accès aux routes) mais pas encore les **actions fines par page** (ex. bouton "Supprimer" visible même sans droit). Voir [07_MODULES_FONCTIONNELS.md §11](./07_MODULES_FONCTIONNELS.md).

### Store Zustand (`authStore.ts`)

- `user`, `token`, `isAuthenticated`, `isLoading`
- `login`, `logout`, `loadUser`, `register`
- Persistance token via `localStorage`

## 4. Services API (51 fichiers)

Organisation par domaine dans `src/services/` :

```typescript
// Exemple - src/services/api.ts
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });
api.interceptors.request.use(/* Bearer token */);
api.interceptors.response.use(/* 401 → logout */);
```

Barrel export partiel dans `services/index.ts` - certains services importés directement.

⚠️ **Important** : la présence d'un service API pour un module ne garantit pas que la page correspondante l'utilise réellement - plusieurs pages Bootstrap conservent des données mockées (`setTimeout`, tableaux en dur) malgré un service disponible. Voir la matrice section 10.

## 5. Composants UI

### Bootstrap (migration)

- `components/layouts/` - AdminLayout, Sidebar, Header (bugs footer/doublon "Administration" corrigés)
- `components/ui/` - DataTable, ConfirmModal, EmptyState, Badge
- `pages/bootstrap/` - pages par module

### MUI (legacy)

- `components/Layout.tsx` - AppBar + Drawer
- `components/*/` - formulaires, listes par entité
- `@mui/x-data-grid` - grilles de données
- `@mui/x-date-pickers` - sélecteurs date

## 6. State management

| Store | Usage |
|-------|-------|
| `authStore` | Authentification |
| `useAppStore` | Contexte global (année académique sélectionnée, etc.) |

Hooks métier : `useAuth`, `useFinances`, `usePermissions`, etc.

## 7. Build & performance

Résultat build production (inchangé depuis le 18/08/2026) :

| Métrique | Valeur |
|----------|--------|
| JS bundle | ~2.5 Mo (677 Ko gzip) |
| CSS | ~328 Ko (49 Ko gzip) |
| Modules transformés | 14 290 |

⚠️ Recommandation toujours valable : code-splitting par route (`React.lazy`).

## 8. Tests frontend

| Type | Fichiers | Framework |
|------|----------|-----------|
| Unitaires | ~12-14 | Jest + Testing Library |
| E2E | 6 | Cypress 15 |

Couverture Jest cible : 70% (configurée dans `jest.config.js`), non atteinte.

MSW (`src/__mocks__/handlers.ts`) pour mocker l'API en tests.

## 9. Conventions de code

- Path alias : `@/components/...`
- Types dans `src/types/`
- Formatters dans `src/utils/formatters.ts`
- Gestion erreurs : `src/utils/errorHandler.ts`

## 10. Migration Bootstrap - état réel au 07/09/2026

⚠️ Ce tableau remplace celui du 18/08/2026, qui indiquait un ✅ générique par zone fonctionnelle sans distinguer UI présente et données réelles.

| Zone | UI présente | Branchement API réel |
|------|--------------|------------------------|
| Layouts & navigation | ✅ | - |
| Dashboard admin | ✅ | ✅ |
| Référentiel (8 entités) | ✅ | ✅ CRUD complet |
| Étudiants | ✅ | ✅ CRUD complet + inscriptions matières (admin/scolarité) |
| Évaluations | ✅ | 🔶 Saisie, résultats, délibérations branchés ; sessions/examens mock |
| Finances | ✅ | 🔶 3 pages branchées (types frais, paiements, factures en lecture) |
| Emploi du temps | ✅ | ✅ CRUD complet (A→D) : référentiel, planning, réservations, **appel/statistiques présences** |
| Paramétrage | ✅ | ✅ Sous-lots A→D complets |
| Documents (templates) | ✅ | ✅ CRUD HTML + preview + export PDF |
| Documents générés | ✅ | ❌ Pas d'API - bandeau Phase 2 |
| Administration | ✅ | ❌ Phase 2 - bandeau explicite (logs, backup, audit, permissions) |
| Modules système | ✅ | ✅ `GestionModulesPage` menu + hook API |
| Années académiques LMD | ✅ | ✅ `GestionAnneesPage` branchée API (+ entrée menu Paramétrage) |
| Stages / Soutenances | ✅ | ✅ menu + API | ✅ |
| Portail enseignant | ✅ Complet (hors placeholders) | ✅ Dashboard, EDT, stages, saisie notes, **feuille d'appel**, **résultats matières** (lecture seule) |
| Portail étudiant | 🔶 Partiel | 🔶 Dashboard, résultats, EDT, présences, finances (lecture seule) |
| Auth Bootstrap | ✅ | ✅ **Corrigé** |
| RBAC navigation | ✅ | ✅ |
| RBAC actions par page | ❌ | ❌ |
| Retrait MUI | ❌ | ❌ Non commencé |

**Estimation globale de branchement réel** : ~30-40% des pages Bootstrap effectuent un vrai CRUD API ; le reste utilise des données mockées en attendant le branchement (~25 pages concernées : inscriptions, évaluations, emploi du temps, présences, documents, templates, administration avancée, paramétrage).
