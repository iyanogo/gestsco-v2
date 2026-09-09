# 03 - Installation & Démarrage

## 1. Prérequis

| Outil | Version minimale | Vérification |
|-------|------------------|--------------|
| Python | 3.11+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | Service actif |
| Git | 2.x | `git --version` |

Optionnel : Poetry (gestion deps backend alternative à pip).

## 2. Installation PostgreSQL

```sql
-- Connexion psql
CREATE DATABASE gestscov2;
```

Utilisateur par défaut dans `.env.example` : `postgres:postgres@localhost:5432/gestscov2`

## 3. Backend

```powershell
cd backend

# Environnement virtuel
python -m venv venv
.\venv\Scripts\activate

# Dépendances
pip install -r requirements.txt

# Configuration
copy .env.example .env
# Éditer DATABASE_URL et SECRET_KEY si nécessaire

# Initialisation base (tables + admin)
python scripts\init_db.py

# Lancement
uvicorn app.main:app --reload --port 8000
```

### Variables d'environnement (`.env`)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestscov2
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_CORS_ORIGINS=["http://localhost:3000"]
```

### Compte admin par défaut

| Champ | Valeur |
|-------|--------|
| Email | `admin@gestsco.com` |
| Mot de passe | `Admin@123` |

## 4. Frontend

```powershell
cd frontend

npm install

copy .env.example .env

npm run dev
```

### Variables d'environnement (`.env`)

```env
VITE_API_URL=http://localhost:8000
VITE_APP_ENV=development
```

## 5. Vérification

| Test | Commande / URL | Attendu |
|------|----------------|---------|
| API health | http://localhost:8000/health | `database: connected` |
| Swagger | http://localhost:8000/docs | Interface interactive |
| Frontend | http://localhost:3000 | Page login/dashboard |
| Login API | POST `/api/v1/auth/login` | Token JWT |

```powershell
# Test login PowerShell
$body = @{ username = "admin@gestsco.com"; password = "Admin@123" }
Invoke-RestMethod -Uri "http://localhost:8000/api/v1/auth/login" -Method Post -Body $body
```

## 6. Scripts utiles

### Backend

| Script | Commande | Description |
|--------|----------|-------------|
| Init DB | `python scripts/init_db.py` | Tables + super admin |
| Seed référence | `python scripts/seed_reference_data.py` | Données CAMES (cycles, niveaux…) |
| Seed finances | `python -m app.scripts.seed_finances` | Types frais, barèmes |
| Init paramètres | `python -m app.scripts.init_parametres` | Paramètres système |
| Tests | `pytest -v` | Suite de tests |
| Migration LMD | `python -m app.scripts.run_migration` | SQL LMD manuel |

### Frontend

| Script | Commande | Description |
|--------|----------|-------------|
| Dev | `npm run dev` | Serveur développement |
| Build | `npm run build` | Production |
| Tests unitaires | `npm test` | Jest |
| Tests e2e | `npm run cypress:open` | Cypress UI |
| Tous tests | `npm run test:all` | Jest + Cypress |

## 7. Dépannage courant

| Problème | Solution |
|----------|----------|
| `ModuleNotFoundError: pandas` | `pip install pandas openpyxl` |
| Erreur bcrypt / passlib | `pip install "bcrypt>=4.0,<5.0"` |
| `no such table` en test | Voir [09_TESTS_QUALITE.md](./09_TESTS_QUALITE.md) |
| CORS error | Vérifier `BACKEND_CORS_ORIGINS` inclut `:3000` |
| Port 8000 occupé | Changer port uvicorn + `VITE_API_URL` |
| Login Bootstrap ne fonctionne pas | Utiliser `/register` MUI ou corriger LoginPage (voir audit) |

## 8. Données de démonstration

Après `init_db.py`, exécuter optionnellement :

```powershell
cd backend
.\venv\Scripts\python scripts\seed_reference_data.py
.\venv\Scripts\python -m app.scripts.init_all
```

Cela peuple cycles LMD, paramètres, barèmes, templates et configurations pays.
