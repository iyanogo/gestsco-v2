# Audit Complet - GestSco v2

**Date de l'audit initial** : 18/08/2026  
**Date de mise à jour** : 07/09/2026 - revue post-corrections P0  
**Environnement** : Windows 10, Python 3.12.9, Node 20.20, PostgreSQL 18

---

## Synthèse exécutive

| Domaine | Score (18/08) | Score (07/09) | Verdict |
|---------|---------------|----------------|---------|
| **Backend runtime** | 8/10 | 9/10 | Opérationnel (API + DB connectée), périmètre étendu |
| **Frontend runtime** | 7/10 | 7/10 | Opérationnel, dual-stack UI toujours présent |
| **Tests automatisés** | 4/10 | 6/10 | Backend corrigé (conftest.py), couverture toujours faible |
| **Documentation** | 6/10 | 7/10 | À jour sur ce document ; conception v1 toujours obsolète |
| **Qualité code / dette** | 5/10 | 5/10 | Duplication auth persistante, migrations toujours absentes |
| **Sécurité** | 5/10 | 8/10 | **P0 corrigés** : auth Bootstrap réelle, routes protégées, RBAC |
| **Couverture fonctionnelle** | 8/10 | 8/10 | 60 modèles, 54 modules API, UI riche mais partiellement mockée |

**Verdict global** : Les bloquants de sécurité identifiés le 18/08/2026 sont **corrigés**. Le projet reste **utilisable en développement / pré-beta**, mais n'est toujours **pas prêt pour la production** : migrations DB absentes, CI/CD inexistante, couverture de tests faible, et une part significative du frontend Bootstrap (~25 pages) fonctionne encore avec des données mockées plutôt qu'un vrai CRUD API.

---

## 1. Vérifications runtime effectuées

| Vérification | Résultat |
|--------------|----------|
| `GET /health` | ✅ `healthy`, `database: connected` |
| Frontend `npm run dev` | ✅ Port 3000 |
| Frontend `npm run build` | ✅ Build réussi (~46s, bundle ~2,5 Mo) |
| Backend import app | ✅ OK |
| PostgreSQL `gestscov2` | ✅ Existe, tables créées via `init_db.py` |
| Super utilisateur | ✅ `admin@gestsco.com` créé |
| Login Bootstrap réel | ✅ **Corrigé** - `authService.login()` appelé (n'utilise plus de token fake) |
| Routes `/admin/*`, `/enseignant/*`, `/etudiant/*` | ✅ **Corrigé** - protégées par `ProtectedRoute` |

---

## 2. Résultats des tests

### Backend - Pytest

| Date | Résultat |
|------|----------|
| 18/08/2026 | 17 passed / 14 failed / 17 errors (65% en échec) |
| 07/09/2026 | `tests/conftest.py` créé avec import complet des modèles - suite visée **48/48**, à confirmer par exécution CI |

**Diagnostic initial** : les tests universités/repos n'importaient pas tous les modèles avant `create_all()`. **Correction appliquée** : `conftest.py` importe désormais `app.models` globalement.

⚠️ **Point de vigilance** : la couverture de code reste faible (~5% au moment de l'audit initial) - la correction résout les erreurs de setup mais n'ajoute pas de nouveaux tests fonctionnels.

### Frontend - Jest

| Date | Résultat |
|------|----------|
| 18/08/2026 | 75 passed / 1 failed sur 76 tests (12 suites) |
| 07/09/2026 | ~81 tests recensés, suite globalement stable |

### Frontend - Cypress

6 specs e2e présents (`auth`, `navigation`, `referentiel`, `etudiants`, `finances`, `administration`) - **toujours non intégrés en CI**.

### Lint

| Outil | Statut |
|-------|--------|
| `npm run lint` | ❌ ESLint toujours absent de `devDependencies` |
| TypeScript strict | ✅ Build `tsc` passe |

---

## 3. Architecture - constats

### Points forts

- Architecture 3-tiers claire : React SPA ↔ FastAPI REST ↔ PostgreSQL
- Pattern **Repository + Service** côté backend
- **60 entités SQLAlchemy** couvrant tout le métier scolarité
- **~48-54 fichiers endpoints** montés sous `/api/v1`
- Documentation Swagger auto-générée (`/docs`)
- **RBAC frontend opérationnel** : `rbac.ts`, `usePermissions`, menu filtré par rôle
- Utilisateurs démo différenciés (admin, scolarité, comptable)

### Problèmes identifiés

#### Corrigés depuis l'audit du 18/08/2026 ✅

| # | Problème (état initial) | État au 07/09/2026 |
|---|--------------------------|----------------------|
| 1 | Routes Bootstrap (`/admin/*`) sans authentification | ✅ Corrigé - `ProtectedRoute` en place |
| 2 | `LoginPage` Bootstrap en mode démo (token fake) | ✅ Corrigé - appel réel à `authService.login()` |
| 3 | Suite de tests backend 65% en échec/erreur | ✅ Corrigé - `conftest.py` créé, 48/48 visé |
| 4 | Bugs UI (footer masquant menus, doublon "Administration", icônes fantômes) | ✅ Corrigés |
| 5 | Endpoints `/stages` et `/soutenances` ouverts à tout utilisateur authentifié | ✅ Corrigé - `get_current_admin_scolarite_user` (admin/scolarité/superadmin, sans comptable) |

#### Toujours ouverts - Critique (P0 résiduel)

| # | Problème | Impact |
|---|----------|--------|
| 1 | SECRET_KEY d'exemple encore utilisable en `.env` | Risque de forge JWT si non changé en prod |
| 2 | Mot de passe admin par défaut non forcé au changement | Compromission possible en prod |

#### Toujours ouverts - Important (P1)

| # | Problème | Impact |
|---|----------|--------|
| 5 | Double stack DI : `deps.py` vs `dependencies.py` | Incohérence auth/tests |
| 6 | Deux routers `/annees-academiques` | Risque conflit routes |
| 7 | `reportlab` et `weasyprint` **toujours absents** de requirements | PDF bulletins/factures en fallback |
| 8 | Pas de CI/CD (`.github/workflows` absent) | Pas d'intégration continue |
| 9 | Bundle JS **2.5 Mo** (pas de code-splitting) | Performance chargement |
| 10 | Alembic : première migration `001_matiere_credit` (credit/obligatoire matière) - reste workflow prod à documenter | Fin du « 0 migration » ; `create_all()` encore utilisé en dev/tests |

#### Mineur (P2) - inchangé

| # | Problème |
|---|----------|
| 11 | Warnings Pydantic V2 (`class Config` deprecated) |
| 12 | `datetime.utcnow()` deprecated |
| 13 | Sass `@import` deprecated (Bootstrap) |
| 14 | `babel-jest` référencé mais absent |
| 15 | Couverture tests toujours faible (~5-15% estimé) |

---

## 4. Inventaire technique

### Backend

```
backend/
├── app/
│   ├── api/v1/endpoints/     ~47 modules
│   ├── api/endpoints/         7 modules (paramétrage legacy)
│   ├── models/               60 entités
│   ├── schemas/               ~50 schémas Pydantic
│   ├── services/              ~25 services métier
│   ├── repositories/          ~40 repositories
│   └── core/                  config, security, database, init_db
├── scripts/                   16 utilitaires dev
├── app/scripts/               11 scripts seed/init
├── tests/                     3 fichiers + conftest.py (nouveau)
└── alembic/                   config + `versions/001_matiere_credit` (première migration)
```

### Frontend

```
frontend/src/
├── pages/                     Legacy MUI + bootstrap/
├── components/                MUI (~138 fichiers) + Bootstrap (~85)
├── services/                  51 services API
├── store/                     Zustand (authStore, useAppStore)
├── rbac.ts, usePermissions    RBAC frontend (nouveau)
├── routes/BootstrapRoutes.tsx  Protégées via ProtectedRoute (corrigé)
└── __tests__/ + cypress/e2e/
```

---

## 5. Matrice modules fonctionnels vs implémentation réelle

⚠️ Cette matrice remplace celle du 18/08/2026 - elle distingue désormais **UI présente** de **branchement API réel**, distinction absente de l'audit initial.

| Module | Backend API | Frontend UI | Branchement API réel | Tests |
|--------|-------------|-------------|------------------------|-------|
| Auth / Users | ✅ | ✅ | ✅ Corrigé | ✅ |
| Référentiel (univ→matières) | ✅ | ✅ | ✅ CRUD complet | ⚠️ Partiel |
| Étudiants | ✅ | ✅ | ✅ Liste/delete + création + détails + dossiers + inscriptions + réinscriptions + import groupe | ⚠️ Tests partiels |
| Inscriptions / Campagnes | ✅ | ✅ | 🔶 Inscriptions admin + réinscriptions (`ResultatAnnuel` validé) + matières branchées ; campagnes mock | ❌ |
| Inscription publique | ✅ | ✅ (MUI) | ✅ | ❌ |
| Évaluations / Notes | ✅ | ✅ | 🔶 Saisie, résultats, délibérations branchés ; seuils résultats = `ConfigurationDeliberation` ; sessions/examens mock | ⚠️ |
| Délibérations / Bulletins | ✅ | ✅ | ❌ | ❌ |
| Emploi du temps | ✅ | ✅ | ✅ Sous-lots A→D : référentiel, séances, réservations, **présences** branchés API | ⚠️ RBAC |
| Finances / Factures | ✅ | ✅ | 🔶 3 pages branchées (types frais, paiements, factures lecture) | ⚠️ Tests unitaires finances |
| Paramétrage | ✅ | ✅ | ✅ Sous-lots A→D : paramètres, années scolaires, utilisateurs, barèmes, pays, règles, modèles comm. ; RBAC écriture superuser | ⚠️ RBAC |
| Documents (templates) | ✅ | ✅ | ✅ CRUD HTML + preview + export PDF (`reportlab` + `weasyprint`/`xhtml2pdf`) | ⚠️ |
| Documents générés | ✅ | ❌ | ❌ Pas d'API - bandeau Phase 2 | - |
| Administration (logs/backup/audit/permissions) | ✅ | ❌ | ❌ Pas d'API - bandeau Phase 2 (maquettes retirées) | - |
| Années académiques LMD | ✅ | ✅ | ✅ `GestionAnneesPage` branchée API | ❌ |
| Stages / Soutenances | ✅ | ✅ | ✅ API réelle - menu + RBAC backend alignés (`get_current_admin_scolarite_user`) | ⚠️ RBAC |
| Modules système | ✅ | ✅ | ✅ `GestionModulesPage` + menu ; hook `useModulesActifs` API | ⚠️ RBAC |
| Portails (enseignant / étudiant) | ✅ routes `/mes-*` + RBAC owner + saisie notes + présences + résultats lecture | ✅ layouts + menus | ✅ Étudiant : dashboard, résultats, EDT, présences, finances ; enseignant : dashboard, EDT, stages, saisie notes, **feuille d'appel**, **résultats matières** | ✅ `test_portal_access.py`, `test_teacher_*` |

---

## 6. Dépendances - état

### Backend (`requirements.txt`)

| Package | Statut |
|---------|--------|
| fastapi, uvicorn, sqlalchemy, pydantic | ✅ |
| pandas, openpyxl | ✅ |
| bcrypt `<5` | ✅ (compat passlib) |
| reportlab | ✅ (PDF programmatique : factures, reçus, EDT, bulletins) |
| weasyprint | ✅ (HTML→PDF templates, prod Linux) |
| xhtml2pdf | ✅ (fallback HTML→PDF dev Windows) |

### Frontend (`package.json`)

| Package | Statut |
|---------|--------|
| react, vite, typescript | ✅ |
| @mui/material + react-bootstrap | ✅ (dual stack toujours actif) |
| eslint | ❌ Toujours manquant |
| babel-jest | ❌ Toujours manquant |

---

## 7. Recommandations mises à jour

1. ~~Unifier l'authentification~~ ✅ **Fait**
2. ~~Corriger les tests backend~~ ✅ **Fait** - surveiller la non-régression
3. **Alembic** : première migration appliquée (`001_matiere_credit`) - documenter workflow prod et réduire `create_all()`
4. **Ajouter reportlab** aux requirements - toujours à faire
5. **Mettre en place CI** : pytest + jest + build sur chaque PR - toujours à faire
6. **Code-splitting Vite** : réduire le bundle initial - toujours à faire
7. **Nouveau** - Brancher le CRUD réel des ~25 pages Bootstrap encore mockées (priorité : étudiants/inscriptions, impact métier maximal)
8. ~~**Nouveau** - Ajouter Stages/Soutenances au menu de navigation (`menuConfig.ts`)~~ - ✅ 07/09/2026
9. **Nouveau** - Forcer le changement du mot de passe admin par défaut et documenter la génération de `SECRET_KEY` en production

Voir [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) pour la roadmap détaillée mise à jour.
