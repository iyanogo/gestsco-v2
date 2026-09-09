# 02 - Architecture Technique

## 1. Vue d'ensemble

Architecture **3-tiers** découplée :

```
┌─────────────────────────────────────────────────────────┐
│  COUCHE PRÉSENTATION                                     │
│  React 18 + TypeScript + Vite                           │
│  MUI (legacy) + Bootstrap 5 (migration)                 │
│  Port 3000 - Proxy /api → backend                       │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP REST + JWT
┌───────────────────────▼─────────────────────────────────┐
│  COUCHE MÉTIER                                           │
│  FastAPI + Pydantic + SQLAlchemy 2.0                    │
│  Pattern Repository / Service                            │
│  Port 8000 - /api/v1/*                                   │
└───────────────────────┬─────────────────────────────────┘
                        │ SQL (psycopg2)
┌───────────────────────▼─────────────────────────────────┐
│  COUCHE DONNÉES                                          │
│  PostgreSQL 18 - Base gestscov2                          │
└─────────────────────────────────────────────────────────┘
```

## 2. Stack technologique

### Frontend

| Technologie | Version | Rôle |
|-------------|---------|------|
| React | 18.2 | UI composants |
| TypeScript | 5.3+ | Typage statique |
| Vite | 7.x | Build / dev server |
| React Router | 6.20 | Routing SPA |
| MUI | 5.14 | UI legacy |
| React Bootstrap | 2.9 | UI migration |
| Zustand | 4.4 | State management |
| Axios | 1.6 | Client HTTP |
| React Hook Form | 7.48 | Formulaires |

### Backend

| Technologie | Version | Rôle |
|-------------|---------|------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.104+ | Framework API |
| Uvicorn | 0.23+ | Serveur ASGI |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.12+ | Migrations (non utilisé) |
| Pydantic | 2.4+ | Validation |
| python-jose | 3.3+ | JWT |
| passlib + bcrypt | 1.7 / 4.x | Hash mots de passe |
| pandas + openpyxl | 2.0 / 3.1 | Import/export Excel |

### Base de données

| Technologie | Rôle |
|-------------|------|
| PostgreSQL 18 | Persistance relationnelle |

## 3. Organisation backend

```
app/
├── main.py                 Point d'entrée FastAPI
├── core/
│   ├── config.py           Settings (.env)
│   ├── database.py         Engine SQLAlchemy, SessionLocal
│   ├── security.py         JWT, hash passwords
│   └── init_db.py          Création tables + admin
├── api/
│   ├── deps.py             get_db, get_current_user (principal)
│   ├── dependencies.py     Stack auth alternative (legacy)
│   ├── v1/
│   │   ├── api.py          Router principal
│   │   └── endpoints/      47 modules routes
│   └── endpoints/          7 modules paramétrage
├── models/                 60 entités SQLAlchemy
├── schemas/                Schémas Pydantic request/response
├── repositories/           Accès données (CRUD générique)
└── services/               Logique métier
```

### Flux requête typique

```
Client HTTP
  → FastAPI Router (endpoints/*.py)
    → Depends(get_current_user)  [auth]
    → Depends(get_db)            [session DB]
    → Service.*                  [logique métier]
      → Repository.*             [SQLAlchemy]
        → PostgreSQL
```

## 4. Organisation frontend

```
src/
├── App.tsx                 Routes racine
├── routes/BootstrapRoutes.tsx   Routes par rôle
├── pages/                  Pages MUI legacy
├── pages/bootstrap/        Pages Bootstrap (migration)
├── components/
│   ├── layouts/            AdminLayout, Sidebar, Header
│   └── ui/                 Composants Bootstrap réutilisables
├── services/               51 clients API (Axios)
├── store/
│   ├── authStore.ts        État authentification
│   └── useAppStore.ts      État application
├── hooks/useAuth.ts        Hook auth
└── types/                  Types TypeScript
```

## 5. Communication API

- **Base URL** : `VITE_API_URL=http://localhost:8000`
- **Préfixe** : `/api/v1`
- **Auth** : Header `Authorization: Bearer <JWT>`
- **Proxy dev** : Vite redirige `/api/*` → `:8000`

### Format login

```
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
username=email&password=xxx
→ { "access_token": "...", "token_type": "bearer" }
```

## 6. État de la migration UI

Le frontend est en **double stack** :

| Aspect | Legacy (MUI) | Nouveau (Bootstrap) |
|--------|--------------|---------------------|
| Routes | `/dashboard`, `/etudiants`… | `/admin/*`, `/enseignant/*`, `/etudiant/*` |
| Layout | `Layout.tsx` + Drawer MUI | `AdminLayout` + Sidebar Bootstrap |
| Auth | `ProtectedRoute` + JWT réel | **Non protégé**, login démo |
| Redirection `/` | - | → `/admin/dashboard` |

**Objectif** : migrer entièrement vers Bootstrap et retirer MUI.

## 7. Diagramme de déploiement cible

```
                    ┌──────────────┐
     Utilisateurs ──►│   Nginx      │
                    │  (reverse    │
                    │   proxy)     │
                    └──┬───────┬───┘
                       │       │
              static   │       │  /api/*
                       ▼       ▼
              ┌────────────┐ ┌────────────┐
              │  Frontend  │ │  FastAPI   │
              │  (dist/)   │ │  Uvicorn   │
              └────────────┘ └─────┬──────┘
                                   │
                                   ▼
                            ┌────────────┐
                            │ PostgreSQL │
                            └────────────┘
```

## 8. Points d'attention architecturaux

1. **Pas de message broker** - architecture synchrone REST
2. **Pas de cache Redis** - requêtes directes DB
3. **Fichiers uploadés** - stockage local (à confirmer par module)
4. **PDF** - génération côté serveur (reportlab, optionnel weasyprint)
5. **Pas de WebSocket** - polling/refresh manuel
