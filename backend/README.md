# GestSco Backend API

Backend API pour GestSco - Progiciel de gestion des établissements d'enseignement supérieur.

## Technologies

- **FastAPI** 0.104+
- **Python** 3.11+
- **SQLAlchemy** 2.0+ (ORM)
- **Alembic** 1.12+ (migrations)
- **Pydantic** 2.4+ (validation)
- **PostgreSQL** (base de données)
- **Poetry** (gestion des dépendances)

## Structure du projet

```
app/
  ├── api/
  │   └── v1/
  │       ├── endpoints/     # Routes par module
  │       └── api.py         # Router principal
  ├── core/
  │   ├── config.py          # Configuration
  │   ├── security.py        # JWT et sécurité
  │   └── database.py        # Connexion DB
  ├── models/                # Modèles SQLAlchemy
  ├── schemas/               # Schémas Pydantic
  ├── services/              # Logique métier
  ├── repositories/          # Accès aux données
  └── main.py                # Point d'entrée
```

## Installation

### Avec Poetry (recommandé)

```bash
# Installer Poetry si nécessaire
pip install poetry

# Installer les dépendances
poetry install

# Activer l'environnement virtuel
poetry shell
```

### Avec pip

```bash
# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement (Windows)
venv\Scripts\activate

# Activer l'environnement (Linux/Mac)
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt
```

## Configuration

1. Copier le fichier d'environnement :
```bash
cp .env.example .env
```

2. Modifier les variables dans `.env` :
```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/gestscov2
SECRET_KEY=your-secret-key-here-change-in-production
```

## Base de données

### 1. Créer la base de données PostgreSQL

Connectez-vous à PostgreSQL et créez la base de données :

```sql
-- Connexion à PostgreSQL
psql -U postgres

-- Créer la base de données
CREATE DATABASE gestscov2;

-- Vérifier la création
\l
```

### 2. Configurer les variables d'environnement

Assurez-vous que le fichier `.env` contient les bonnes informations :

```env
DATABASE_URL=postgresql://postgres:admin@localhost:5432/gestscov2
SECRET_KEY=your-secret-key-here-change-in-production
```

### 3. Initialiser la base de données

#### Option A : Avec le script d'initialisation (recommandé)

```bash
# Crée les tables et le super utilisateur par défaut
python scripts/init_db.py
```

Cela va :
- Créer toutes les tables définies dans les modèles
- Créer un super utilisateur par défaut :
  - Email : `admin@gestsco.com`
  - Mot de passe : `Admin@123` (à changer en production)

#### Option B : Avec Alembic (migrations)

```bash
# Générer une migration automatique
alembic revision --autogenerate -m "Create users table"

# Appliquer les migrations
alembic upgrade head
```

### 4. Vérifier l'installation

```bash
# Lancer le serveur
uvicorn app.main:app --reload --port 8000

# Tester le healthcheck (doit retourner "database": "connected")
curl http://localhost:8000/health
```

### Commandes Alembic utiles

```bash
# Voir l'historique des migrations
alembic history

# Voir la migration actuelle
alembic current

# Revenir à une migration précédente
alembic downgrade -1

# Créer une nouvelle migration
alembic revision --autogenerate -m "Description de la migration"
```

### Post-migration : liaison User ↔ Etudiant (portail)

La migration `002_etudiant_user_id` ajoute la colonne `etudiant.user_id` **sans** lier les comptes existants. Après chaque déploiement de cette migration (dev, staging, prod), exécuter le backfill :

```bash
# 1. Appliquer les migrations
alembic upgrade head

# 2. Dry-run (défaut) - lire le rapport sans modifier la base
python scripts/backfill_etudiant_user_id.py

# 3. Si le rapport est cohérent, appliquer les liens
python scripts/backfill_etudiant_user_id.py --apply
```

**Comportement** : pour chaque étudiant sans `user_id`, recherche d'un `User` au même email (normalisation lowercase + trim). Les cas ambigus ou sans compte correspondant sont listés dans le rapport - résolution manuelle requise.

**Limites** :
- Ne crée pas de comptes User manquants (créer le compte étudiant puis relancer le script).
- Ne remplace jamais un `user_id` déjà renseigné.
- À réexécuter après import de nouveaux étudiants/comptes tant qu'aucun flux automatique de liaison n'existe à la création.

**Cas non résolus automatiquement** :
- Étudiant sans email → renseigner l'email ou lier manuellement : `UPDATE etudiant SET user_id = … WHERE id = …`
- Étudiant sans compte User → créer un utilisateur (rôle `etudiant`) avec le même email, puis relancer le script
- Email ambigu (plusieurs User) → corriger les doublons en base

Voir aussi `docs/conception/CHECKLIST_BACKFILL_ETUDIANT_USER_ID.md`.

## Lancement

### Développement

```bash
# Avec Poetry
poetry run uvicorn app.main:app --reload --port 8000

# Ou avec le script
./run.sh
```

### Production

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Documentation API

- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc
- **OpenAPI JSON** : http://localhost:8000/openapi.json

## Tests

```bash
# Exécuter tous les tests
pytest

# Avec couverture
pytest --cov=app --cov-report=html

# Tests spécifiques
pytest tests/test_api.py -v
```

## Endpoints

### Endpoints généraux

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Page d'accueil |
| GET | `/health` | Healthcheck avec test DB |
| GET | `/docs` | Documentation Swagger |

### Authentication (`/api/v1/auth`)

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/login` | Connexion (retourne JWT) | Non |
| POST | `/register` | Inscription | Non |
| GET | `/me` | Profil utilisateur connecté | Oui |
| PUT | `/me` | Mise à jour du profil | Oui |

### Users (`/api/v1/users`) - Admin uniquement

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| GET | `/` | Liste des utilisateurs | Admin |
| POST | `/` | Créer un utilisateur | Admin |
| GET | `/{user_id}` | Récupérer un utilisateur | Admin |
| PUT | `/{user_id}` | Modifier un utilisateur | Admin |
| DELETE | `/{user_id}` | Supprimer un utilisateur | Admin |

## Authentification JWT

L'API utilise des tokens JWT (JSON Web Tokens) pour l'authentification.

### Obtenir un token

```bash
# Connexion
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@gestsco.com&password=Admin@123"
```

Réponse :
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### Utiliser le token

```bash
# Récupérer le profil
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <votre_token>"
```

### Inscription d'un nouvel utilisateur

```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "motdepasse123",
    "full_name": "Nom Complet"
  }'
```

### Exemples de requêtes curl

```bash
# Health check
curl http://localhost:8000/health

# Connexion admin
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -d "username=admin@gestsco.com&password=Admin@123"

# Liste des utilisateurs (admin)
TOKEN="votre_token_ici"
curl -X GET "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN"

# Créer un utilisateur (admin)
curl -X POST "http://localhost:8000/api/v1/users/" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "new@example.com", "password": "password123"}'
```

## Codes d'erreur HTTP

| Code | Description |
|------|-------------|
| 200 | Succès |
| 201 | Créé avec succès |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource non trouvée |
| 422 | Erreur de validation |
