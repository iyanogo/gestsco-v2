# 01 - Présentation du Projet

## 1. Contexte

**GestSco** (Gestion Scolaire) est un Progiciel de Gestion Intégré (PGI) destiné aux établissements d'enseignement supérieur en Afrique francophone, avec une conformité au référentiel **CAMES** (Conseil Africain et Malgache pour l'Enseignement Supérieur) et au système **LMD** (Licence-Master-Doctorat).

### Historique

| Version | Stack | Statut |
|---------|-------|--------|
| GestSco v1 | Angular + Spring Boot / JHipster | Legacy (2013-2025) |
| **GestSco v2** | **React + FastAPI + PostgreSQL** | **En cours** |

La v2 modernise la stack technique tout en conservant le modèle métier et les règles CAMES/LMD.

## 2. Objectifs

- Centraliser la gestion du parcours étudiant (inscription → diplôme)
- Automatiser les calculs de notes, délibérations et bulletins
- Gérer les finances scolarité (factures, paiements, échéanciers)
- Produire documents administratifs (attestations, relevés, bulletins PDF)
- Offrir des portails différenciés (admin, enseignant, étudiant)
- Supporter le cycle annuel LMD (ouverture, reconduction, clôture semestres)

## 3. Périmètre fonctionnel

### Inclus

- Organisation pédagogique (référentiel)
- Gestion des inscriptions (admin + en ligne)
- Évaluations et délibérations
- Emploi du temps et présences
- Finances scolarité
- Stages et soutenances
- Paramétrage établissement
- Gestion des années académiques LMD
- Administration utilisateurs

### Hors périmètre (v2 actuelle)

- Intégration bancaire / mobile money
- Messagerie SMS/email en production
- Multi-tenant SaaS
- Application mobile native

## 4. Acteurs

| Acteur | Rôle | Accès typique |
|--------|------|---------------|
| **Administrateur** | Configuration système, utilisateurs, modules | `/admin/*` |
| **Agent de scolarité** | Inscriptions, dossiers, finances | `/admin/*` |
| **Enseignant** | Notes, emploi du temps, présences | `/enseignant/*` |
| **Étudiant** | Consultation notes, bulletins, EDT | `/etudiant/*` |
| **Candidat** | Inscription en ligne | `/inscription` (public) |

## 5. Structure du dépôt

```
gestsco-v2/
├── backend/              API FastAPI
├── frontend/             SPA React
├── docs/                 Documentation métier
│   └── conception/       Dossier de conception v2 (ce dossier)
├── DossierConception/    Conception v1 (Angular/Spring Boot)
└── README.md             (à créer - point d'entrée racine)
```

## 6. Références normatives

1. Référentiel CAMES - SI dans l'ESR (2014)
2. Guide de formation LMD - CAMES
3. Cadre de cohérence CPU (2005)
4. Documentation GestSco v1 - YanSoft (2013)

## 7. Glossaire

| Terme | Définition |
|-------|------------|
| **LMD** | Licence (6 sem.) - Master (4 sem.) - Doctorat |
| **UE/EC** | Unité d'Enseignement / Élément Constitutif |
| **Session** | Période d'examens (normale, rattrapage) |
| **Délibération** | Conseil validant les résultats |
| **Reconduction** | Copie du référentiel N-1 vers année N |
| **Campagne** | Période d'inscription en ligne ouverte |
