# Guide de Migration GestSco - Angular/Spring Boot vers React/FastAPI

**Version** : 1.0  
**Date** : 26/12/2025  
**Auteur** : Manus AI

---

## Table des matières

1. [Introduction](#1-introduction)
2. [Vue d'ensemble de la migration](#2-vue-densemble-de-la-migration)
3. [Architecture cible](#3-architecture-cible)
4. [Stratégie de migration](#4-stratégie-de-migration)
5. [Prompts Windsurf optimisés](#5-prompts-windsurf-optimisés)
6. [Plan de migration détaillé](#6-plan-de-migration-détaillé)
7. [Tests et validation](#7-tests-et-validation)
8. [Déploiement](#8-déploiement)

---

## 1. Introduction

Ce guide détaille la migration complète du Progiciel GestSco depuis sa stack technique actuelle (Angular 12 + Spring Boot + PostgreSQL) vers une stack moderne et performante (React 18 + FastAPI + PostgreSQL).

### 1.1. Objectifs de la migration

La migration vise à moderniser l'application tout en conservant une **parité fonctionnelle complète** avec l'application d'origine. Les objectifs principaux sont :

- **Amélioration des performances** : React offre un rendu plus rapide et FastAPI est l'un des frameworks Python les plus performants.
- **Simplification de la stack** : Python est plus accessible que Java pour de nombreux développeurs, facilitant la maintenance.
- **Réduction des coûts** : Python et FastAPI nécessitent moins de ressources serveur que Spring Boot.
- **Modernisation du frontend** : React est actuellement le framework frontend le plus populaire avec un écosystème riche.
- **Amélioration de la maintenabilité** : Code plus concis et plus lisible.

### 1.2. Périmètre de la migration

La migration couvre l'ensemble de l'application :

- **Frontend** : Migration complète d'Angular 12 vers React 18 avec TypeScript.
- **Backend** : Migration complète de Spring Boot vers FastAPI avec Python 3.11+.
- **Base de données** : Conservation de PostgreSQL (pas de migration nécessaire).
- **Authentification** : Migration de JWT Spring Security vers JWT FastAPI.
- **API REST** : Réécriture complète des endpoints avec parité fonctionnelle.

---

## 2. Vue d'ensemble de la migration

### 2.1. Stack actuelle vs Stack cible

| Composant | Stack Actuelle | Stack Cible | Justification |
|---|---|---|---|
| **Frontend Framework** | Angular 12 | React 18 | Écosystème plus riche, courbe d'apprentissage plus douce |
| **Frontend Language** | TypeScript 4.2 | TypeScript 5.0+ | Version moderne avec de meilleures performances |
| **State Management** | RxJS | React Context + Zustand | Plus simple et plus performant pour React |
| **Routing** | Angular Router | React Router v6 | Standard de facto pour React |
| **UI Framework** | Bootstrap 5 | Material-UI (MUI) ou Tailwind CSS | Composants modernes et personnalisables |
| **Backend Framework** | Spring Boot 2.7 | FastAPI 0.104+ | Performances supérieures, code plus concis |
| **Backend Language** | Java 17 | Python 3.11+ | Syntaxe plus simple, développement plus rapide |
| **ORM** | Hibernate | SQLAlchemy 2.0+ | ORM Python mature et performant |
| **Validation** | Bean Validation | Pydantic v2 | Validation automatique avec types Python |
| **Migration DB** | Liquibase | Alembic | Outil de migration standard pour SQLAlchemy |
| **API Documentation** | Swagger (SpringDoc) | OpenAPI (intégré FastAPI) | Documentation automatique native |
| **Testing Backend** | JUnit + Mockito | Pytest + Pytest-mock | Framework de test Python puissant |
| **Testing Frontend** | Jasmine + Karma | Jest + React Testing Library | Standard pour React |
| **Build Tool** | Maven | Poetry / pip | Gestion de dépendances Python moderne |

### 2.2. Avantages de la nouvelle stack

**Frontend (React)**
- Composants fonctionnels avec Hooks : code plus concis et réutilisable.
- Virtual DOM optimisé : meilleures performances de rendu.
- Écosystème riche : nombreuses bibliothèques tierces.
- Server-Side Rendering (SSR) possible avec Next.js (évolution future).

**Backend (FastAPI)**
- Performances exceptionnelles : comparable à Node.js et Go.
- Documentation automatique : OpenAPI/Swagger généré automatiquement.
- Validation automatique : Pydantic valide les données entrantes.
- Async/await natif : support complet de la programmation asynchrone.
- Code concis : 2 à 3 fois moins de code que Spring Boot pour les mêmes fonctionnalités.

---

## 3. Architecture cible

### 3.1. Architecture globale

L'architecture cible conserve le modèle 3-tiers mais avec des technologies modernisées :

```
┌─────────────────────────────────────────────────────────────┐
│                     Navigateur Web                          │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │           Application React (SPA)                     │ │
│  │  - React 18 + TypeScript                             │ │
│  │  - React Router v6                                   │ │
│  │  - Material-UI / Tailwind CSS                        │ │
│  │  - Axios pour les appels API                         │ │
│  │  - Zustand pour le state management                  │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS / REST API (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Serveur Backend FastAPI                   │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              API REST FastAPI                         │ │
│  │  - FastAPI 0.104+                                     │ │
│  │  - Python 3.11+                                       │ │
│  │  - Pydantic v2 (validation)                           │ │
│  │  - JWT Authentication                                 │ │
│  │  - SQLAlchemy 2.0 (ORM)                               │ │
│  │  - Alembic (migrations)                               │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Base de Données PostgreSQL                 │
│                                                             │
│  - PostgreSQL 14+                                          │
│  - Schéma existant conservé                                │
│  - Indexation optimisée                                    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2. Structure du projet

```
gestsco-v2/
├── frontend/                    # Application React
│   ├── public/
│   ├── src/
│   │   ├── components/         # Composants réutilisables
│   │   ├── pages/              # Pages de l'application
│   │   ├── services/           # Services API
│   │   ├── store/              # State management (Zustand)
│   │   ├── hooks/              # Custom hooks
│   │   ├── utils/              # Utilitaires
│   │   ├── types/              # Types TypeScript
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                     # API FastAPI
│   ├── app/
│   │   ├── api/                # Endpoints API
│   │   │   ├── v1/
│   │   │   │   ├── endpoints/  # Routes par module
│   │   │   │   └── api.py      # Router principal
│   │   ├── core/               # Configuration
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/             # Modèles SQLAlchemy
│   │   ├── schemas/            # Schémas Pydantic
│   │   ├── services/           # Logique métier
│   │   ├── repositories/       # Accès aux données
│   │   └── main.py             # Point d'entrée
│   ├── alembic/                # Migrations
│   ├── tests/                  # Tests
│   ├── pyproject.toml          # Dépendances Poetry
│   └── requirements.txt
│
├── docs/                        # Documentation
├── scripts/                     # Scripts utilitaires
└── README.md
```

---

## 4. Stratégie de migration

### 4.1. Approche recommandée : Migration progressive

La migration sera effectuée de manière **progressive et itérative** pour minimiser les risques :

1. **Phase 1 : Infrastructure et authentification** (Semaine 1-2)
   - Configuration du projet React et FastAPI
   - Migration du système d'authentification JWT
   - Configuration de la base de données avec SQLAlchemy

2. **Phase 2 : Modules de référence** (Semaine 3-4)
   - Migration des entités de référence (Université, Établissement, Cycle, Niveau, etc.)
   - Création des composants React de base

3. **Phase 3 : Module Étudiant** (Semaine 5-6)
   - Migration de la gestion des étudiants
   - Formulaires d'inscription

4. **Phase 4 : Module Inscription** (Semaine 7-8)
   - Migration de la gestion des inscriptions

5. **Phase 5 : Module Évaluation** (Semaine 9-11)
   - Migration de la saisie des notes
   - Calcul des moyennes et résultats

6. **Phase 6 : Tests et optimisation** (Semaine 12-13)
   - Tests d'intégration complets
   - Optimisation des performances

7. **Phase 7 : Déploiement** (Semaine 14)
   - Mise en production

### 4.2. Principes de migration

- **Parité fonctionnelle** : Chaque fonctionnalité de l'application Angular/Spring Boot doit être reproduite à l'identique.
- **Tests systématiques** : Chaque module migré doit être testé avant de passer au suivant.
- **Documentation continue** : Documenter les décisions techniques au fur et à mesure.
- **Revue de code** : Chaque composant/endpoint doit être revu avant intégration.

---

## 5. Prompts Windsurf optimisés

Cette section contient des prompts prêts à l'emploi pour Windsurf, organisés par phase de migration. Chaque prompt est conçu pour être **autonome, précis et économe en crédits**.

### 5.1. Phase 1 : Infrastructure et authentification

#### Prompt 1.1 : Initialisation du projet React

```
Crée un nouveau projet React avec TypeScript en utilisant Vite.
Configure le projet avec les dépendances suivantes :
- React 18
- TypeScript 5
- React Router v6
- Material-UI (MUI)
- Axios
- Zustand (state management)

Structure le projet selon cette arborescence :
src/
  ├── components/
  ├── pages/
  ├── services/
  ├── store/
  ├── hooks/
  ├── utils/
  ├── types/
  ├── App.tsx
  └── index.tsx

Ajoute un fichier .env.example avec les variables d'environnement nécessaires (VITE_API_URL).
Configure le fichier tsconfig.json avec des options strictes.
Crée un fichier README.md avec les instructions d'installation et de lancement.
```

#### Prompt 1.2 : Initialisation du projet FastAPI

```
Crée un nouveau projet FastAPI avec Python 3.11+ en utilisant Poetry.
Configure le projet avec les dépendances suivantes :
- FastAPI 0.104+
- Uvicorn (serveur ASGI)
- SQLAlchemy 2.0+
- Alembic (migrations)
- Pydantic v2
- python-jose (JWT)
- passlib (hashing passwords)
- psycopg2-binary (PostgreSQL)
- python-multipart (upload files)

Structure le projet selon cette arborescence :
app/
  ├── api/
  │   └── v1/
  │       ├── endpoints/
  │       └── api.py
  ├── core/
  │   ├── config.py
  │   ├── security.py
  │   └── database.py
  ├── models/
  ├── schemas/
  ├── services/
  ├── repositories/
  └── main.py

Crée un fichier .env.example avec les variables d'environnement nécessaires :
- DATABASE_URL
- SECRET_KEY
- ALGORITHM (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES

Configure Alembic pour les migrations de base de données.
Crée un fichier README.md avec les instructions d'installation et de lancement.
```

#### Prompt 1.3 : Configuration de la base de données

```
Dans le projet FastAPI, crée le fichier app/core/database.py qui :
1. Configure la connexion à PostgreSQL avec SQLAlchemy 2.0
2. Utilise les variables d'environnement pour la connexion
3. Crée une SessionLocal pour les sessions de base de données
4. Définit une fonction get_db() qui retourne une session et la ferme automatiquement
5. Crée une Base déclarative pour les modèles

Exemple de structure attendue :
- Utiliser create_engine avec pool_pre_ping=True
- Configurer sessionmaker avec autocommit=False, autoflush=False
- Utiliser declarative_base() pour la Base
```

#### Prompt 1.4 : Système d'authentification JWT (Backend)

```
Dans le projet FastAPI, crée le système d'authentification JWT complet :

1. Fichier app/core/security.py :
   - Fonction create_access_token(data: dict) -> str
   - Fonction verify_password(plain_password: str, hashed_password: str) -> bool
   - Fonction get_password_hash(password: str) -> str
   - Fonction decode_token(token: str) -> dict

2. Fichier app/schemas/user.py :
   - UserBase (BaseModel Pydantic)
   - UserCreate (hérite de UserBase)
   - UserLogin (email + password)
   - UserInDB (hérite de UserBase, ajoute hashed_password)
   - Token (access_token + token_type)

3. Fichier app/models/user.py :
   - Modèle SQLAlchemy User avec les champs : id, email, hashed_password, full_name, is_active, role

4. Fichier app/api/v1/endpoints/auth.py :
   - POST /auth/login : authentification et génération du token
   - POST /auth/register : création d'un nouvel utilisateur
   - GET /auth/me : récupération des informations de l'utilisateur connecté

5. Dépendance get_current_user pour protéger les routes
```

#### Prompt 1.5 : Système d'authentification JWT (Frontend)

```
Dans le projet React, crée le système d'authentification complet :

1. Fichier src/services/authService.ts :
   - login(email: string, password: string): Promise<{token: string, user: User}>
   - register(userData: RegisterData): Promise<User>
   - logout(): void
   - getCurrentUser(): Promise<User>
   - getToken(): string | null
   - setToken(token: string): void

2. Fichier src/store/authStore.ts (Zustand) :
   - État : user, token, isAuthenticated, isLoading
   - Actions : login, logout, checkAuth, setUser

3. Fichier src/components/PrivateRoute.tsx :
   - Composant qui redirige vers /login si l'utilisateur n'est pas authentifié

4. Fichier src/pages/Login.tsx :
   - Formulaire de connexion avec Material-UI
   - Gestion des erreurs
   - Redirection après connexion réussie

5. Configurer Axios pour ajouter automatiquement le token JWT dans les headers
```

### 5.2. Phase 2 : Modules de référence

#### Prompt 2.1 : Migration des modèles de référence (Backend)

```
Dans le projet FastAPI, crée les modèles SQLAlchemy pour les entités de référence suivantes,
en te basant sur le schéma de base de données PostgreSQL existant :

1. app/models/universite.py : Université
2. app/models/etablissement.py : Établissement
3. app/models/departement.py : Département
4. app/models/cycle.py : Cycle (Licence, Master, Doctorat)
5. app/models/niveau.py : Niveau (L1, L2, M1, etc.)
6. app/models/semestre.py : Semestre (S1, S2, etc.)
7. app/models/annee.py : Année académique
8. app/models/filiere.py : Filière

Pour chaque modèle :
- Utilise SQLAlchemy 2.0 avec la syntaxe moderne
- Définis les relations (ForeignKey, relationship)
- Ajoute des contraintes (unique, nullable, etc.)
- Ajoute des timestamps (created_at, updated_at)

Schéma de référence (extrait de la base de données existante) :
[Fournis ici le schéma SQL des tables concernées]
```

#### Prompt 2.2 : Création des schémas Pydantic (Backend)

```
Dans le projet FastAPI, crée les schémas Pydantic v2 pour les entités de référence :

Pour chaque entité (Université, Établissement, Département, Cycle, Niveau, Semestre, Année, Filière) :

1. Crée un fichier app/schemas/{entite}.py avec :
   - {Entite}Base : schéma de base avec les champs communs
   - {Entite}Create : schéma pour la création (hérite de Base)
   - {Entite}Update : schéma pour la mise à jour (tous les champs optionnels)
   - {Entite}InDB : schéma complet avec id et timestamps (hérite de Base)

Utilise :
- ConfigDict avec from_attributes=True pour la compatibilité avec SQLAlchemy
- Field() pour la validation et la documentation
- Les types Python appropriés (str, int, datetime, etc.)

Exemple de structure attendue pour Université :
- nom: str
- sigle: str
- adresse: str | None
- telephone: str | None
- email: str | None
```

#### Prompt 2.3 : CRUD Repository pattern (Backend)

```
Dans le projet FastAPI, crée un système de repositories génériques pour les opérations CRUD :

1. Fichier app/repositories/base.py :
   - Classe générique CRUDBase[ModelType, CreateSchemaType, UpdateSchemaType]
   - Méthodes : get(id), get_multi(skip, limit), create(obj_in), update(db_obj, obj_in), delete(id)

2. Pour chaque entité de référence, crée un repository spécifique dans app/repositories/ :
   - Hérite de CRUDBase
   - Ajoute des méthodes spécifiques si nécessaire (ex: get_by_code, search, etc.)

Exemple pour Université :
```python
class CRUDUniversite(CRUDBase[Universite, UniversiteCreate, UniversiteUpdate]):
    def get_by_sigle(self, db: Session, sigle: str) -> Universite | None:
        return db.query(Universite).filter(Universite.sigle == sigle).first()
```
```

#### Prompt 2.4 : Endpoints API pour les entités de référence (Backend)

```
Dans le projet FastAPI, crée les endpoints API REST pour les entités de référence :

Pour chaque entité (Université, Établissement, Département, Cycle, Niveau, Semestre, Année, Filière),
crée un fichier app/api/v1/endpoints/{entite}.py avec les routes suivantes :

- GET /{entites}/ : Liste toutes les entités (avec pagination)
- GET /{entites}/{id} : Récupère une entité par ID
- POST /{entites}/ : Crée une nouvelle entité (protégé, admin uniquement)
- PUT /{entites}/{id} : Met à jour une entité (protégé, admin uniquement)
- DELETE /{entites}/{id} : Supprime une entité (protégé, admin uniquement)

Utilise :
- Les schémas Pydantic pour la validation
- Les repositories pour l'accès aux données
- Les dépendances FastAPI (Depends) pour l'injection
- HTTPException pour les erreurs (404, 403, etc.)
- Response models pour la documentation OpenAPI

Ajoute ces routes au router principal dans app/api/v1/api.py
```

#### Prompt 2.5 : Services API Frontend pour les entités de référence

```
Dans le projet React, crée les services API pour les entités de référence :

Pour chaque entité (Université, Établissement, Département, Cycle, Niveau, Semestre, Année, Filière),
crée un fichier src/services/{entite}Service.ts avec les fonctions suivantes :

- getAll(params?: {skip?: number, limit?: number}): Promise<Entite[]>
- getById(id: number): Promise<Entite>
- create(data: EntiteCreate): Promise<Entite>
- update(id: number, data: EntiteUpdate): Promise<Entite>
- delete(id: number): Promise<void>

Utilise Axios avec :
- Instance Axios configurée avec baseURL et intercepteurs
- Types TypeScript pour les paramètres et retours
- Gestion des erreurs avec try/catch
- Transformation des données si nécessaire

Crée également un fichier src/types/{entite}.ts avec les interfaces TypeScript correspondantes.
```

#### Prompt 2.6 : Composants React pour les entités de référence

```
Dans le projet React, crée les composants pour la gestion des entités de référence :

Pour chaque entité (commence par Université comme exemple), crée :

1. src/pages/{Entite}List.tsx :
   - Affiche la liste des entités dans un tableau Material-UI
   - Pagination
   - Boutons d'action (Voir, Modifier, Supprimer)
   - Bouton "Ajouter" en haut à droite
   - Recherche/filtrage

2. src/pages/{Entite}Form.tsx :
   - Formulaire de création/modification avec Material-UI
   - Validation côté client
   - Gestion des erreurs
   - Boutons Enregistrer et Annuler

3. src/components/{Entite}Card.tsx :
   - Carte Material-UI pour afficher les détails d'une entité

Utilise :
- React Hooks (useState, useEffect, useCallback)
- React Router pour la navigation
- Material-UI pour les composants (Table, Button, TextField, Dialog, etc.)
- Le service API correspondant
- Gestion du loading et des erreurs
```

### 5.3. Phase 3 : Module Étudiant

#### Prompt 3.1 : Migration du modèle Étudiant (Backend)

```
Dans le projet FastAPI, crée le modèle SQLAlchemy pour l'entité Étudiant :

Fichier app/models/etudiant.py avec les champs suivants (basés sur le schéma existant) :
- id: int (PK)
- matricule: str (unique, index)
- nom: str
- prenom: str
- date_naissance: date
- lieu_naissance: str
- sexe: str (enum: M, F)
- nationalite: str
- adresse: str | None
- telephone: str | None
- email: str | None
- photo: str | None (chemin du fichier)
- tuteur_nom: str | None
- tuteur_telephone: str | None
- created_at: datetime
- updated_at: datetime

Relations :
- inscriptions: list[Inscrit] (one-to-many)

Ajoute des méthodes utilitaires :
- __repr__() pour l'affichage
- Propriété full_name qui retourne "nom prenom"
```

#### Prompt 3.2 : Schémas Pydantic pour Étudiant (Backend)

```
Dans le projet FastAPI, crée les schémas Pydantic pour l'entité Étudiant :

Fichier app/schemas/etudiant.py :

1. EtudiantBase :
   - Tous les champs de base (sans id, created_at, updated_at)
   - Validation : email (EmailStr), date_naissance (date passée), sexe (Literal["M", "F"])

2. EtudiantCreate (hérite de EtudiantBase) :
   - Tous les champs requis pour la création

3. EtudiantUpdate (hérite de EtudiantBase) :
   - Tous les champs optionnels

4. EtudiantInDB (hérite de EtudiantBase) :
   - Ajoute id, created_at, updated_at
   - ConfigDict avec from_attributes=True

5. EtudiantSearch :
   - Schéma pour la recherche avec des filtres optionnels (nom, prenom, matricule, etc.)

Ajoute des validators Pydantic pour :
- Vérifier que la date de naissance est cohérente (pas dans le futur, âge minimum)
- Formater le matricule en majuscules
```

#### Prompt 3.3 : Repository et Service Étudiant (Backend)

```
Dans le projet FastAPI, crée le repository et le service pour l'entité Étudiant :

1. Fichier app/repositories/etudiant.py :
   - Classe CRUDEtudiant héritant de CRUDBase
   - Méthodes supplémentaires :
     * get_by_matricule(matricule: str) -> Etudiant | None
     * search(filters: EtudiantSearch) -> list[Etudiant]
     * get_with_inscriptions(id: int) -> Etudiant (avec eager loading)

2. Fichier app/services/etudiant.py :
   - Classe EtudiantService avec la logique métier :
     * Génération automatique du matricule (si non fourni)
     * Validation de l'unicité du matricule
     * Gestion de l'upload de photo
     * Vérification des règles métier (âge minimum, etc.)

Utilise :
- Dependency Injection pour le repository
- Exceptions personnalisées pour les erreurs métier
- Logging pour tracer les opérations importantes
```

#### Prompt 3.4 : Endpoints API Étudiant (Backend)

```
Dans le projet FastAPI, crée les endpoints API pour l'entité Étudiant :

Fichier app/api/v1/endpoints/etudiant.py :

- GET /etudiants/ : Liste avec pagination, tri et recherche
- GET /etudiants/{id} : Détails d'un étudiant (avec ses inscriptions)
- GET /etudiants/matricule/{matricule} : Recherche par matricule
- POST /etudiants/ : Création d'un étudiant (protégé)
- PUT /etudiants/{id} : Mise à jour d'un étudiant (protégé)
- DELETE /etudiants/{id} : Suppression d'un étudiant (protégé, admin)
- POST /etudiants/{id}/photo : Upload de la photo (protégé)
- GET /etudiants/{id}/photo : Récupération de la photo

Paramètres de requête pour la liste :
- skip, limit (pagination)
- sort_by, sort_order (tri)
- search (recherche textuelle)
- Filtres : filiere_id, niveau_id, annee_id

Utilise :
- UploadFile pour l'upload de photo
- FileResponse pour le téléchargement de photo
- Query parameters avec Pydantic
```

#### Prompt 3.5 : Service et composants React pour Étudiant (Frontend)

```
Dans le projet React, crée le service et les composants pour la gestion des étudiants :

1. src/services/etudiantService.ts :
   - Toutes les fonctions d'appel API
   - Fonction uploadPhoto(id: number, file: File)

2. src/types/etudiant.ts :
   - Interfaces TypeScript pour Etudiant, EtudiantCreate, EtudiantUpdate, EtudiantSearch

3. src/pages/EtudiantList.tsx :
   - Liste des étudiants avec tableau Material-UI DataGrid
   - Recherche avancée avec filtres (nom, prénom, matricule, filière, niveau)
   - Export CSV/PDF
   - Actions : Voir, Modifier, Supprimer

4. src/pages/EtudiantForm.tsx :
   - Formulaire multi-étapes (Stepper Material-UI) :
     * Étape 1 : Informations personnelles
     * Étape 2 : Coordonnées
     * Étape 3 : Tuteur
     * Étape 4 : Photo
   - Validation avec react-hook-form
   - Upload de photo avec prévisualisation

5. src/pages/EtudiantDetail.tsx :
   - Affichage complet des informations de l'étudiant
   - Onglets : Informations, Inscriptions, Notes, Documents

Utilise :
- Material-UI pour les composants
- react-hook-form pour la gestion des formulaires
- react-query pour le cache et la synchronisation des données
```

### 5.4. Phase 4 : Module Inscription

#### Prompt 4.1 : Migration des modèles Inscription (Backend)

```
Dans le projet FastAPI, crée les modèles pour le module Inscription :

1. app/models/enseignement.py :
   - Représente une offre de formation pour une année/niveau/filière
   - Relations avec Annee, Niveau, Filiere, Semestre

2. app/models/inscrit.py :
   - Représente l'inscription d'un étudiant à un enseignement
   - Relations avec Etudiant, Enseignement
   - Champs : statut (enum: INSCRIT, VALIDE, ANNULE), date_inscription

3. app/models/inscription_matiere.py :
   - Représente l'inscription d'un étudiant à une matière spécifique
   - Relations avec Inscrit, Matiere
   - Champs : statut, est_dette (boolean)

Ajoute des contraintes d'unicité pour éviter les doublons.
```

#### Prompt 4.2 : Endpoints et logique métier Inscription (Backend)

```
Dans le projet FastAPI, crée les endpoints pour le module Inscription :

Fichier app/api/v1/endpoints/inscription.py :

- POST /inscriptions/ : Inscription d'un étudiant à un enseignement
  * Vérifie que l'étudiant n'est pas déjà inscrit
  * Vérifie les prérequis (niveau précédent validé, etc.)
  * Crée l'inscription et les inscriptions aux matières du semestre

- GET /inscriptions/etudiant/{etudiant_id} : Liste des inscriptions d'un étudiant
- GET /inscriptions/{id} : Détails d'une inscription (avec les matières)
- PUT /inscriptions/{id}/valider : Valide une inscription (admin)
- PUT /inscriptions/{id}/annuler : Annule une inscription (admin)
- POST /inscriptions/{id}/matieres : Ajoute des matières à une inscription
- DELETE /inscriptions/{id}/matieres/{matiere_id} : Retire une matière

Logique métier dans app/services/inscription.py :
- Vérification des prérequis
- Calcul automatique des matières à inscrire
- Gestion des dettes (matières non validées)
- Génération de documents (certificat de scolarité, etc.)
```

#### Prompt 4.3 : Composants React pour Inscription (Frontend)

```
Dans le projet React, crée les composants pour le module Inscription :

1. src/pages/InscriptionForm.tsx :
   - Formulaire d'inscription en plusieurs étapes :
     * Étape 1 : Sélection de l'étudiant (recherche par matricule ou nom)
     * Étape 2 : Sélection de la formation (année, cycle, niveau, filière, semestre)
     * Étape 3 : Sélection des matières (affichage automatique + ajout manuel)
     * Étape 4 : Récapitulatif et validation
   - Affichage des dettes éventuelles
   - Calcul automatique des frais de scolarité

2. src/pages/InscriptionList.tsx :
   - Liste des inscriptions avec filtres (année, filière, statut)
   - Actions : Voir, Valider, Annuler, Imprimer certificat

3. src/components/InscriptionCard.tsx :
   - Carte récapitulative d'une inscription

Utilise :
- Stepper Material-UI pour le formulaire multi-étapes
- Autocomplete pour la recherche d'étudiant
- Checkbox pour la sélection des matières
```

### 5.5. Phase 5 : Module Évaluation

#### Prompt 5.1 : Migration des modèles Évaluation (Backend)

```
Dans le projet FastAPI, crée les modèles pour le module Évaluation :

1. app/models/type_note.py :
   - Types de notes (CC, Examen, Rattrapage, TP, etc.)

2. app/models/coefficient.py :
   - Coefficients des matières pour chaque type de note

3. app/models/note.py :
   - Notes obtenues par les étudiants
   - Relations avec Etudiant, Matiere, TypeNote, Enseignement
   - Champs : valeur (float), date_saisie, saisie_par (User)

4. app/models/moyenne.py :
   - Moyennes calculées (par matière, module, semestre, année)
   - Relations avec Etudiant, Matiere/Module/Semestre
   - Champs : valeur, credits_acquis

5. app/models/resultat.py :
   - Résultats finaux (Admis, Ajourné, Redouble, etc.)
   - Relations avec Etudiant, Enseignement
   - Champs : statut (enum), mention, date_deliberation

Ajoute des contraintes pour éviter la double saisie de notes.
```

#### Prompt 5.2 : Service de calcul des moyennes (Backend)

```
Dans le projet FastAPI, crée le service de calcul des moyennes :

Fichier app/services/evaluation.py :

Classe EvaluationService avec les méthodes :

1. calculer_moyenne_matiere(etudiant_id, matiere_id, enseignement_id) -> float:
   - Récupère toutes les notes de l'étudiant pour la matière
   - Applique les coefficients de chaque type de note
   - Calcule la moyenne pondérée
   - Enregistre dans la table Moyenne

2. calculer_moyenne_module(etudiant_id, module_id, enseignement_id) -> float:
   - Calcule les moyennes de toutes les matières du module
   - Applique les coefficients des matières
   - Calcule la moyenne pondérée du module

3. calculer_moyenne_semestre(etudiant_id, semestre_id, enseignement_id) -> float:
   - Calcule les moyennes de tous les modules du semestre
   - Applique les coefficients des modules
   - Calcule la moyenne générale du semestre

4. calculer_credits_acquis(etudiant_id, semestre_id) -> int:
   - Détermine les crédits ECTS acquis selon les moyennes

5. determiner_resultat(etudiant_id, enseignement_id) -> str:
   - Détermine le résultat final (Admis, Ajourné, etc.)
   - Applique les règles de compensation
   - Détermine la mention (Passable, AB, B, TB)

Utilise :
- Règles métier configurables (seuils de validation, compensation, etc.)
- Transactions pour garantir la cohérence
- Logging des calculs
```

#### Prompt 5.3 : Endpoints API Évaluation (Backend)

```
Dans le projet FastAPI, crée les endpoints pour le module Évaluation :

Fichier app/api/v1/endpoints/evaluation.py :

**Saisie des notes :**
- POST /notes/ : Saisie d'une note
- POST /notes/batch : Saisie en masse (liste d'étudiants pour une évaluation)
- PUT /notes/{id} : Modification d'une note
- DELETE /notes/{id} : Suppression d'une note (admin)

**Consultation :**
- GET /notes/etudiant/{etudiant_id} : Toutes les notes d'un étudiant
- GET /notes/matiere/{matiere_id}/enseignement/{enseignement_id} : Notes d'une matière pour un enseignement

**Calculs :**
- POST /moyennes/calculer/etudiant/{etudiant_id} : Calcule toutes les moyennes d'un étudiant
- POST /moyennes/calculer/enseignement/{enseignement_id} : Calcule les moyennes de tous les étudiants
- GET /moyennes/etudiant/{etudiant_id} : Récupère les moyennes d'un étudiant

**Résultats :**
- GET /resultats/etudiant/{etudiant_id} : Résultats d'un étudiant
- GET /resultats/enseignement/{enseignement_id} : Résultats de tous les étudiants d'un enseignement
- POST /resultats/deliberation/{enseignement_id} : Lance la délibération pour un enseignement

**Documents :**
- GET /documents/releve-notes/{etudiant_id}/{enseignement_id} : Génère un relevé de notes (PDF)
- GET /documents/attestation-reussite/{etudiant_id}/{enseignement_id} : Génère une attestation

Utilise :
- Permissions strictes (seuls les enseignants peuvent saisir des notes)
- Validation des données (note entre 0 et 20)
- Génération de PDF avec ReportLab
```

#### Prompt 5.4 : Composants React pour Évaluation (Frontend)

```
Dans le projet React, crée les composants pour le module Évaluation :

1. src/pages/SaisieNotes.tsx :
   - Sélection de l'évaluation (matière, type de note, enseignement)
   - Affichage de la liste des étudiants inscrits dans un tableau
   - Saisie des notes directement dans le tableau (inline editing)
   - Validation (note entre 0 et 20)
   - Sauvegarde en masse
   - Indicateurs : nombre de notes saisies, moyenne de la classe

2. src/pages/ConsultationNotes.tsx :
   - Pour les étudiants : affichage de leurs propres notes
   - Filtres : année, semestre, matière
   - Affichage des moyennes calculées
   - Bouton "Télécharger le relevé de notes"

3. src/pages/Deliberation.tsx :
   - Pour les administrateurs
   - Sélection de l'enseignement
   - Affichage du tableau récapitulatif des résultats
   - Lancement du calcul automatique
   - Modification manuelle des résultats si nécessaire
   - Validation finale de la délibération

4. src/components/ReleveNotesViewer.tsx :
   - Visualisation du relevé de notes (PDF dans un iframe)

Utilise :
- Material-UI DataGrid pour les tableaux de saisie
- react-pdf pour l'affichage des PDF
- Gestion optimiste des mises à jour (react-query)
```

### 5.6. Phase 6 : Tests et optimisation

#### Prompt 6.1 : Tests Backend (FastAPI)

```
Dans le projet FastAPI, crée une suite de tests complète avec Pytest :

1. tests/conftest.py :
   - Fixtures pour la base de données de test (SQLite en mémoire)
   - Fixture pour le client de test FastAPI
   - Fixtures pour créer des données de test (users, étudiants, etc.)

2. tests/test_auth.py :
   - Test de l'inscription
   - Test de la connexion
   - Test de l'accès aux routes protégées
   - Test du refresh token

3. tests/test_etudiant.py :
   - Test CRUD complet
   - Test de la recherche
   - Test de l'upload de photo
   - Test des validations

4. tests/test_inscription.py :
   - Test du processus d'inscription
   - Test des vérifications de prérequis
   - Test de la gestion des dettes

5. tests/test_evaluation.py :
   - Test de la saisie des notes
   - Test du calcul des moyennes
   - Test de la délibération
   - Test de la génération de documents

Utilise :
- pytest-asyncio pour les tests asynchrones
- pytest-cov pour la couverture de code
- Factoryboy pour générer des données de test
- Objectif : couverture > 80%
```

#### Prompt 6.2 : Tests Frontend (React)

```
Dans le projet React, crée une suite de tests avec Jest et React Testing Library :

1. src/components/__tests__/Login.test.tsx :
   - Test du rendu du formulaire
   - Test de la soumission avec des données valides
   - Test de la gestion des erreurs
   - Test de la redirection après connexion

2. src/components/__tests__/EtudiantList.test.tsx :
   - Test du rendu de la liste
   - Test de la pagination
   - Test de la recherche
   - Test des actions (modifier, supprimer)

3. src/components/__tests__/EtudiantForm.test.tsx :
   - Test du rendu du formulaire
   - Test de la validation
   - Test de la soumission

4. src/services/__tests__/etudiantService.test.ts :
   - Mock des appels API avec MSW (Mock Service Worker)
   - Test de toutes les fonctions du service

Utilise :
- @testing-library/react pour les tests de composants
- @testing-library/user-event pour simuler les interactions
- MSW pour mocker les API
- jest-dom pour les assertions
- Objectif : couverture > 70%
```

#### Prompt 6.3 : Optimisation des performances (Backend)

```
Dans le projet FastAPI, optimise les performances :

1. Mise en cache avec Redis :
   - Cache les données de référence (cycles, niveaux, etc.)
   - Cache les résultats de recherche fréquents
   - Invalide le cache lors des mises à jour

2. Optimisation des requêtes SQL :
   - Utilise selectinload() et joinedload() pour éviter le problème N+1
   - Ajoute des index sur les colonnes fréquemment recherchées
   - Utilise des requêtes SQL brutes pour les calculs complexes

3. Pagination efficace :
   - Utilise offset/limit avec des index
   - Implémente la cursor-based pagination pour les grandes listes

4. Compression des réponses :
   - Active la compression gzip dans Uvicorn

5. Rate limiting :
   - Limite le nombre de requêtes par utilisateur

Crée un fichier app/core/cache.py avec les fonctions de cache.
Crée un fichier app/core/optimization.py avec les utilitaires d'optimisation.
```

#### Prompt 6.4 : Optimisation des performances (Frontend)

```
Dans le projet React, optimise les performances :

1. Code splitting :
   - Utilise React.lazy() pour charger les pages à la demande
   - Crée des bundles séparés pour chaque module

2. Mémoïsation :
   - Utilise React.memo() pour les composants purs
   - Utilise useMemo() et useCallback() pour éviter les re-rendus inutiles

3. Virtualisation des listes :
   - Utilise react-window pour les longues listes

4. Optimisation des images :
   - Compresse les images
   - Utilise le lazy loading pour les images

5. Gestion du state :
   - Évite les props drilling avec Context API
   - Utilise Zustand pour le state global

6. Caching des données :
   - Configure react-query avec des stratégies de cache appropriées
   - Implémente le stale-while-revalidate

Crée un fichier src/utils/performance.ts avec les utilitaires d'optimisation.
```

---

## 6. Plan de migration détaillé

### 6.1. Timeline et jalons

| Semaine | Phase | Tâches | Livrables |
|---|---|---|---|
| 1-2 | Infrastructure | Initialisation des projets, authentification | Projets configurés, login fonctionnel |
| 3-4 | Référence | Migration des entités de référence | CRUD complet pour 8 entités |
| 5-6 | Étudiant | Migration du module étudiant | Gestion complète des étudiants |
| 7-8 | Inscription | Migration du module inscription | Processus d'inscription fonctionnel |
| 9-11 | Évaluation | Migration du module évaluation | Saisie notes, calculs, délibération |
| 12-13 | Tests | Tests et optimisation | Suite de tests complète, performances optimisées |
| 14 | Déploiement | Mise en production | Application déployée |

### 6.2. Checklist de migration par module

Pour chaque module, suivre cette checklist :

**Backend**
- [ ] Modèles SQLAlchemy créés
- [ ] Schémas Pydantic créés
- [ ] Repository créé
- [ ] Service métier créé
- [ ] Endpoints API créés
- [ ] Tests unitaires écrits
- [ ] Tests d'intégration écrits
- [ ] Documentation OpenAPI vérifiée

**Frontend**
- [ ] Types TypeScript créés
- [ ] Service API créé
- [ ] Composants de liste créés
- [ ] Composants de formulaire créés
- [ ] Composants de détail créés
- [ ] Tests de composants écrits
- [ ] Tests de services écrits
- [ ] Navigation configurée

**Validation**
- [ ] Tests manuels effectués
- [ ] Parité fonctionnelle vérifiée
- [ ] Performances mesurées
- [ ] Documentation mise à jour

---

## 7. Tests et validation

### 7.1. Stratégie de test

**Tests unitaires (Backend)**
- Couverture minimale : 80%
- Tests de tous les services métier
- Tests de toutes les fonctions utilitaires

**Tests d'intégration (Backend)**
- Tests de tous les endpoints API
- Tests des scénarios métier complets

**Tests de composants (Frontend)**
- Couverture minimale : 70%
- Tests de tous les composants principaux
- Tests des interactions utilisateur

**Tests end-to-end**
- Utiliser Playwright ou Cypress
- Tester les parcours utilisateur critiques :
  * Connexion
  * Création d'un étudiant
  * Inscription d'un étudiant
  * Saisie de notes
  * Consultation de résultats

### 7.2. Validation de la parité fonctionnelle

Créer une matrice de validation pour chaque fonctionnalité :

| Fonctionnalité | Angular/Spring Boot | React/FastAPI | Statut | Notes |
|---|---|---|---|---|
| Connexion | ✅ | ✅ | Validé | |
| Gestion étudiants | ✅ | ✅ | Validé | |
| ... | ... | ... | ... | ... |

---

## 8. Déploiement

### 8.1. Architecture de déploiement

**Option 1 : Déploiement traditionnel**
- Frontend : Nginx servant les fichiers statiques React
- Backend : Uvicorn derrière Nginx (reverse proxy)
- Base de données : PostgreSQL sur serveur dédié

**Option 2 : Déploiement containerisé (Docker)**
- Frontend : Container Nginx avec les fichiers React
- Backend : Container Python avec Uvicorn
- Base de données : Container PostgreSQL
- Orchestration : Docker Compose ou Kubernetes

**Option 3 : Déploiement cloud**
- Frontend : Vercel, Netlify ou AWS S3 + CloudFront
- Backend : AWS Lambda, Google Cloud Run ou Heroku
- Base de données : AWS RDS, Google Cloud SQL ou Supabase

### 8.2. Configuration de production

**Backend (FastAPI)**
```python
# app/core/config.py
class Settings(BaseSettings):
    PROJECT_NAME: str = "GestSco API"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database
    DATABASE_URL: str
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000"]
    
    # Redis
    REDIS_URL: str | None = None
    
    class Config:
        env_file = ".env"
```

**Frontend (React)**
```typescript
// src/config.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  environment: import.meta.env.MODE,
  version: '2.0.0',
};
```

### 8.3. Scripts de déploiement

**Dockerfile Backend**
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./app ./app
COPY ./alembic ./alembic
COPY alembic.ini .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Dockerfile Frontend**
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**docker-compose.yml**
```yaml
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    depends_on:
      - db
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/gestsco
      - SECRET_KEY=${SECRET_KEY}
    volumes:
      - ./backend/app:/app/app

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=gestsco
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 9. Conclusion

Ce guide fournit une feuille de route complète pour migrer GestSco vers une stack moderne React + FastAPI. En suivant les prompts Windsurf optimisés et le plan de migration détaillé, vous pourrez effectuer cette migration de manière progressive, sécurisée et efficace.

### Points clés à retenir

1. **Migration progressive** : Ne pas tout migrer d'un coup, procéder module par module.
2. **Tests systématiques** : Tester chaque module avant de passer au suivant.
3. **Parité fonctionnelle** : S'assurer que chaque fonctionnalité est reproduite à l'identique.
4. **Documentation continue** : Documenter les décisions et les changements au fur et à mesure.
5. **Optimisation** : Profiter de la migration pour optimiser les performances et la qualité du code.

### Ressources utiles

- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation React](https://react.dev/)
- [Documentation SQLAlchemy](https://docs.sqlalchemy.org/)
- [Documentation Material-UI](https://mui.com/)
- [Documentation Pydantic](https://docs.pydantic.dev/)

---

**Fin du guide de migration**
