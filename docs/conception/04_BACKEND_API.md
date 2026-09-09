# 04 - Backend API

## 1. Point d'entrée

- **Fichier** : `backend/app/main.py`
- **Documentation** : http://localhost:8000/docs (Swagger)
- **Préfixe API** : `/api/v1`

## 2. Modules endpoints (54 fichiers)

### Authentification & utilisateurs

| Préfixe | Fichier | Description |
|---------|---------|-------------|
| `/auth` | `auth.py` | Login, register, me, update profile |
| `/users` | `users.py` | CRUD utilisateurs (admin) |

### Référentiel pédagogique

| Préfixe | Fichier |
|---------|---------|
| `/universites` | `universites.py` |
| `/etablissements` | `etablissements.py` |
| `/departements` | `departements.py` |
| `/cycles` | `cycles.py` |
| `/filieres` | `filieres.py` |
| `/niveaux` | `niveaux.py` |
| `/modules` | `modules.py` |
| `/matieres` | `matieres.py` |
| `/annees-scolaires` | `annees_scolaires.py` |

### Étudiants & inscriptions

| Préfixe | Fichier |
|---------|---------|
| `/etudiants` | `etudiants.py` |
| `/documents-etudiant` | `documents_etudiant.py` |
| `/inscriptions` | `inscriptions.py` |
| `/inscriptions-matieres` | `inscriptions_matieres.py` |
| `/campagnes-inscription` | `campagnes_inscription.py` |
| `/dossiers-candidature` | `dossiers_candidature.py` |
| `/pieces-jointes` | `pieces_jointes.py` |
| `/paiements` | `paiements.py` |
| `/inscription-publique` | `inscription_publique.py` |
| `/inscription-groupe` | `inscription_groupe.py` |

### Évaluations

| Préfixe | Fichier |
|---------|---------|
| `/sessions-examen` | `sessions_examen.py` |
| `/examens` | `examens.py` |
| `/notes` | `notes.py` |
| `/resultats` | `resultats.py` |
| `/deliberations` | `deliberations.py` |
| `/bulletins` | `bulletins.py` |

### Emploi du temps

| Préfixe | Fichier |
|---------|---------|
| `/batiments` | `batiments.py` |
| `/salles` | `salles.py` |
| `/creneaux-horaires` | `creneaux_horaires.py` |
| `/seances` | `seances.py` |
| `/presences` | `presences.py` |
| `/reservations-salles` | `reservations_salles.py` |
| `/emplois-temps` | `emplois_temps.py` |

### Finances

| Préfixe | Fichier |
|---------|---------|
| `/types-frais` | `types_frais.py` |
| `/frais-scolarite` | `frais_scolarite.py` |
| `/factures` | `factures.py` |
| `/paiements-factures` | `paiements_factures.py` |
| `/comptes-etudiants` | `comptes_etudiants.py` |
| `/remises` | `remises.py` |
| `/echeanciers` | `echeanciers.py` |

### Paramétrage (`app/api/endpoints/`)

| Préfixe | Fichier |
|---------|---------|
| `/parametres` | `parametres.py` |
| `/configurations` | `configurations.py` |
| `/baremes` | `baremes.py` |
| `/templates` | `templates.py` |
| `/regles-calcul` | `regles_calcul.py` |
| `/modeles-communication` | `modeles_communication.py` |
| `/pays` | `pays.py` |

### LMD & modules système

| Préfixe | Fichier | Note |
|---------|---------|------|
| `/annees-academiques` | `annees_academiques.py` + `annees_academiques_gestion.py` | ⚠️ Double router même préfixe |
| `/modules-systeme` | `modules_systeme.py` |
| `/semestres` | `semestres.py` |
| `/stages` | `stages.py` |
| `/soutenances` | `soutenances.py` |

## 3. Couche services (logique métier)

| Service | Responsabilité |
|---------|----------------|
| `annee_academique_service` | Cycle vie année LMD, reconduction |
| `calcul_service` / `calcul_resultats_service` | Moyennes, mentions |
| `deliberation_service` | Conseils, validation résultats |
| `bulletin_service` | Génération bulletins PDF |
| `facture_service` / `paiement_service` | Facturation, reçus PDF |
| `emploi_temps_service` | EDT, export Excel/PDF |
| `admission_service` | Admission candidats |
| `compte_service` | Compte étudiant, relevé |
| `module_service` | Activation modules système |
| `template_service` | Documents HTML/PDF |
| `parametre_service` | Configuration établissement |

## 4. Couche repositories

Pattern `BaseRepository` générique avec :

- `create`, `get_by_id`, `get_by_code`
- `get_all` (pagination, filtres)
- `update`, `delete` (logique + hard)
- `search`, `code_exists`

Chaque entité a son repository spécialisé dans `app/repositories/`.

## 5. Modèles de données

60 entités SQLAlchemy - voir [06_MODELE_DONNEES.md](./06_MODELE_DONNEES.md).

## 6. Schémas Pydantic

Convention :
- `*Create` - création
- `*Update` - mise à jour partielle
- `*InDB` / `*` - lecture

⚠️ Plusieurs schémas utilisent encore `class Config` (deprecated Pydantic v2) → migrer vers `ConfigDict`.

## 7. Authentification backend

Deux implémentations coexistent :

| Module | Usage |
|--------|-------|
| `app/api/deps.py` | ~46 endpoints - **principal** |
| `app/api/dependencies.py` | 9 endpoints legacy + tests auth |

**Recommandation** : fusionner en un seul module.

### Guards disponibles

- `get_current_active_user` - utilisateur connecté
- `get_current_superuser` - admin
- `get_current_scolarite_user` - agent scolarité

## 8. Initialisation base

`app/core/init_db.py` :
1. `Base.metadata.create_all()` - toutes les tables
2. Création super utilisateur si absent

Alternative : scripts SQL dans `app/scripts/migrations/`.

## 9. Exports PDF / Excel

Module partagé : `app/utils/pdf_generator.py`.

| Format | Librairie | Services |
|--------|-----------|----------|
| PDF | **reportlab** | bulletins, factures, reçus, comptes, EDT (documents programmatiques) |
| PDF | **weasyprint** (+ **xhtml2pdf** fallback) | templates documents HTML/CSS |
| Excel | openpyxl | emploi du temps, inscription groupe |
| Excel | pandas | import inscription groupe |

**Stratégie** : reportlab pour les tableaux structurés ; weasyprint en prod Linux pour un rendu CSS fidèle des templates ; xhtml2pdf en fallback pure Python (dev Windows sans GTK/Cairo).

Endpoints principaux :
- `GET /api/v1/factures/{id}/pdf`
- `GET /api/v1/paiements-factures/{id}/recu`
- `GET /api/v1/emplois-temps/{id}/export/pdf`
- `POST /api/v1/templates/{id}/pdf` et `POST /api/v1/templates/code/{code}/pdf`

## 10. Codes HTTP standards

| Code | Usage |
|------|-------|
| 200 | Succès GET/PUT |
| 201 | Création |
| 400 | Requête invalide |
| 401 | Non authentifié |
| 403 | Accès interdit |
| 404 | Ressource absente |
| 422 | Validation Pydantic |
