# Dossier de Conception GestSco v2

**Version** : 2.0 (React + FastAPI)  
**Date** : 07/09/2026  
**Statut** : En développement actif - pré-beta (P0 sécurité corrigés)

---

## Objectif

Ce dossier centralise la documentation technique complète du projet **GestSco v2**, progiciel de gestion de scolarité pour établissements d'enseignement supérieur (conformité CAMES / LMD).

## Table des matières

| # | Document | Description |
|---|----------|-------------|
| 00 | [Audit complet](./00_AUDIT_COMPLET.md) | État des lieux, tests, problèmes, score global |
| 01 | [Présentation du projet](./01_PRESENTATION_PROJET.md) | Contexte, périmètre, acteurs, objectifs |
| 02 | [Architecture technique](./02_ARCHITECTURE_TECHNIQUE.md) | Stack, couches, diagrammes, flux |
| 03 | [Installation & démarrage](./03_INSTALLATION_DEMARRAGE.md) | Prérequis, config, commandes |
| 04 | [Backend API](./04_BACKEND_API.md) | FastAPI, endpoints, services, modèles |
| 05 | [Frontend UI](./05_FRONTEND_UI.md) | React, routes, auth, migration Bootstrap |
| 06 | [Modèle de données](./06_MODELE_DONNEES.md) | Entités, relations, initialisation DB |
| 07 | [Modules fonctionnels](./07_MODULES_FONCTIONNELS.md) | Référentiel, inscriptions, évaluations, finances… |
| 08 | [Sécurité & authentification](./08_SECURITE.md) | JWT, rôles, CORS, bonnes pratiques |
| 09 | [Tests & qualité](./09_TESTS_QUALITE.md) | Pytest, Jest, Cypress, couverture |
| 10 | [Déploiement & exploitation](./10_DEPLOIEMENT.md) | Production, monitoring, sauvegardes |
| 11 | [Plan d'action](./11_PLAN_ACTION.md) | Priorités, corrections, roadmap |

## Documentation complémentaire

| Emplacement | Contenu |
|-------------|---------|
| `docs/GESTION_ANNEES.md` | Cycle de vie des années académiques LMD |
| `docs/SYSTEME_LMD.md` | Système Licence-Master-Doctorat |
| `docs/STAGES_SOUTENANCES.md` | Gestion stages et soutenances |
| `backend/README.md` | Guide backend (installation, API) |
| `frontend/README.md` | Guide frontend (dev, auth) |
| `DossierConception/` | Conception v1 (Angular/Spring Boot) - référence historique |

## Démarrage rapide

```powershell
# Backend (port 8000)
cd backend
python -m venv venv
.\venv\Scripts\pip install -r requirements.txt
copy .env.example .env
.\venv\Scripts\python scripts\init_db.py
.\venv\Scripts\uvicorn app.main:app --reload --port 8000

# Frontend (port 3000)
cd frontend
npm install
copy .env.example .env
npm run dev
```

**Connexion admin** : `admin@gestsco.com` / `Admin@123`  
**URLs** : http://localhost:3000 | http://localhost:8000/docs
