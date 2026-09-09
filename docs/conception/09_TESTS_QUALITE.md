# 09 - Tests & Qualité

## 1. Stratégie de tests cible

```
        ┌─────────────┐
        │   Cypress   │  E2E - parcours utilisateur
        │   (6 specs) │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │    Jest     │  Composants + services + hooks
        │ (12 files)  │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │   Pytest    │  API + repositories
        │  (3 files)  │
        └─────────────┘
```

## 2. Backend - Pytest

### Configuration

- Fichier : `backend/pyproject.toml` → `[tool.pytest.ini_options]`
- Path : `tests/`
- Mode asyncio : auto

### Résultats audit (18/08/2026)

| Métrique | Valeur |
|----------|--------|
| Total tests | 48 |
| Passés | 17 (35%) |
| Échoués | 14 (29%) |
| Erreurs setup | 17 (35%) |

### Détail par fichier

| Fichier | Pass | Fail/Error | Couverture |
|---------|------|------------|------------|
| `test_auth.py` | 11 | 0 | Register, login, me, profile |
| `test_api_universites.py` | 2 | 17 | CRUD universités, RBAC |
| `test_repositories.py` | 4 | 14 | BaseRepository, Cycle, Universite |

### Cause racine des échecs

```
sqlite3.OperationalError: no such table: users
```

Les fixtures de `test_api_universites.py` et `test_repositories.py` créent une DB SQLite in-memory mais n'importent pas tous les modèles avant `create_all()`.

### Correction recommandée

Créer `tests/conftest.py` :

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base, get_db
from app.main import app
import app.models  # noqa - importe tous les modèles

@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()
```

### Lancer les tests

```powershell
cd backend
.\venv\Scripts\pytest -v
.\venv\Scripts\pytest --cov=app --cov-report=html
```

## 3. Frontend - Jest

### Configuration

- `jest.config.js` - jsdom, ts-jest ESM, alias `@/`
- Setup : `src/setupTests.ts`
- Mocks API : MSW (`src/__mocks__/handlers.ts`)
- Seuil couverture : **70%** (branches, functions, lines, statements)

### Résultats audit

| Métrique | Valeur |
|----------|--------|
| Suites | 12 (11 pass, 1 fail) |
| Tests | 76 (75 pass, 1 fail) |

### Échec

- `EtudiantsListPage.test.tsx` - assertion async sur filtres (timeout chargement)

### Lancer

```powershell
cd frontend
npm test
npm run test:coverage
```

## 4. Frontend - Cypress

### Configuration

- `cypress.config.ts` - baseUrl `http://localhost:3000`
- Specs : `cypress/e2e/*.cy.ts`

| Spec | Domaine |
|------|---------|
| auth.cy.ts | Connexion |
| navigation.cy.ts | Navigation menus |
| referentiel.cy.ts | CRUD référentiel |
| etudiants.cy.ts | Gestion étudiants |
| finances.cy.ts | Module finances |
| administration.cy.ts | Admin |

```powershell
npm run cypress:open    # Mode interactif
npm run cypress:run     # Headless
npm run test:all        # Jest + Cypress
```

## 5. Lint & analyse statique

| Outil | Statut | Action |
|-------|--------|--------|
| ESLint | ❌ Non configuré | Ajouter eslint + @typescript-eslint |
| TypeScript | ✅ strict | Build vérifie |
| mypy (Python) | ❌ Absent | Optionnel |
| ruff (Python) | ❌ Absent | Recommandé |

## 6. CI/CD

**État actuel** : aucun pipeline GitHub Actions / GitLab CI.

### Pipeline recommandé

```yaml
# .github/workflows/ci.yml
jobs:
  backend:
    - pip install -r requirements.txt
    - pytest
  frontend:
    - npm ci
    - npm test -- --ci
    - npm run build
```

## 7. Métriques qualité

| Métrique | Actuel | Cible |
|----------|--------|-------|
| Couverture backend | ~5% | 60% |
| Couverture frontend | ~15% est. | 70% |
| Tests e2e automatisés | 6 specs (non CI) | CI nightly |
| Dette Pydantic v2 | ~20 warnings | 0 |
| Bundle size | 2.5 Mo | < 1 Mo |

## 8. Plan d'amélioration tests

### Phase 1 - Stabiliser (1 semaine)

1. Créer `conftest.py` backend
2. Corriger test EtudiantsListPage async
3. Ajouter ESLint frontend

### Phase 2 - Étendre (2-4 semaines)

4. Tests API par module critique (inscriptions, notes, factures)
5. Tests services frontend (mock MSW complets)
6. CI GitHub Actions

### Phase 3 - Industrialiser

7. Cypress en CI avec services PostgreSQL
8. Tests de charge API (locust/k6)
9. Mutation testing (optionnel)
