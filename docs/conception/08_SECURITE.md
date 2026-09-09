# 08 - Sécurité & Authentification

## 1. Modèle de sécurité

GestSco v2 utilise une architecture **stateless JWT** :

```
Client                          Backend
  │ POST /auth/login              │
  │ (email + password)            │
  ├──────────────────────────────►│
  │                               │ Vérifier bcrypt hash
  │◄──────────────────────────────┤
  │ { access_token, token_type }  │
  │                               │
  │ GET /api/v1/...               │
  │ Authorization: Bearer <JWT>   │
  ├──────────────────────────────►│
  │                               │ Décoder JWT, charger User
  │◄──────────────────────────────┤
  │ 200 / 401 / 403               │
```

## 2. Configuration JWT

| Paramètre | Valeur défaut | Fichier |
|-----------|---------------|---------|
| Algorithme | HS256 | `.env` ALGORITHM |
| Expiration | 30 minutes | ACCESS_TOKEN_EXPIRE_MINUTES |
| Secret | Obligatoire | SECRET_KEY |

⚠️ **Production** : utiliser un SECRET_KEY fort (32+ bytes aléatoires) et HTTPS obligatoire.

## 3. Hash mots de passe

- **Librairie** : passlib + bcrypt
- **Version bcrypt** : `>=4.0,<5.0` (incompatibilité bcrypt 5.x)
- Mot de passe admin par défaut : `Admin@123` - **à changer immédiatement en production**

## 4. Rôles & permissions backend

### Modèle User

```python
User:
  email: str
  hashed_password: str
  full_name: str
  is_active: bool
  is_superuser: bool  # Admin complet
```

### Guards FastAPI

| Dependency | Accès |
|------------|-------|
| `get_current_active_user` | Utilisateur authentifié actif |
| `get_current_superuser` | is_superuser = True |
| `get_current_scolarite_user` | Rôle scolarité (permissions.py) |

### Endpoints publics

- `POST /auth/login`
- `POST /auth/register`
- Routes inscription publique (`/inscription-publique/*`)

## 5. CORS

Configuré dans `main.py` :

```python
allow_origins=settings.BACKEND_CORS_ORIGINS  # ["http://localhost:3000"]
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

Production : restreindre aux domaines autorisés uniquement.

## 6. Frontend - stockage token

- **Emplacement** : `localStorage` (clé token)
- **Injection** : Intercepteur Axios dans `services/api.ts`
- **Expiration** : Intercepteur 401 → logout + redirect `/login`

### Risques localStorage

- Vulnérable XSS - mitiger par sanitization React et CSP headers
- Alternative plus sûre : cookies HttpOnly (non implémenté)

## 7. Vulnérabilités identifiées (audit)

### Critique

| # | Problème | Risque | Correction |
|---|----------|--------|------------|
| 1 | Routes `/admin/*` sans auth | Accès admin non authentifié | Wrapper `ProtectedRoute` sur BootstrapRoutes |
| 2 | Login Bootstrap fake | Contournement auth | Connecter à `authService.login()` |
| 3 | SECRET_KEY example en .env | Forge JWT | Secret unique par environnement |

### Important

| # | Problème | Correction |
|---|----------|------------|
| 4 | Double stack auth backend | Unifier deps.py / dependencies.py |
| 5 | Register public ouvert | Désactiver ou restreindre en prod |
| 6 | Pas de rate limiting login | Ajouter slowapi ou middleware |
| 7 | Pas de refresh token | Implémenter refresh ou allonger session + rotation |

### Bonnes pratiques à appliquer

- [ ] HTTPS en production
- [ ] Headers sécurité (HSTS, X-Frame-Options, CSP)
- [ ] Audit logs connexions
- [ ] Politique mots de passe forte
- [ ] RBAC granulaire (profils/permissions)
- [ ] Validation upload fichiers (type, taille)

## 8. Checklist sécurité déploiement

```
□ SECRET_KEY unique généré
□ Mot de passe admin changé
□ DATABASE_URL avec credentials forts
□ CORS restreint au domaine frontend
□ HTTPS activé (reverse proxy)
□ Register désactivé ou admin-only
□ Backups DB chiffrés
□ .env jamais commité
□ Dépendances à jour (pip audit, npm audit)
```
