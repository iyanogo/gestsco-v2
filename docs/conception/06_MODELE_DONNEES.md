# 06 - Modèle de Données

## 1. SGBD

- **Moteur** : PostgreSQL 18
- **Base** : `gestscov2`
- **ORM** : SQLAlchemy 2.0 (declarative)
- **Init** : `scripts/init_db.py` → `Base.metadata.create_all()`

⚠️ Alembic configuré mais sans fichiers de migration dans le dépôt.

## 2. Entités (60 modèles)

### Référentiel & organisation

| Entité | Table | Description |
|--------|-------|-------------|
| Universite | universite | Structure académique racine |
| Etablissement | etablissement | Campus / école |
| Departement | departement | Département |
| Cycle | cycle | L, M, D (LMD) |
| Filiere | filiere | Parcours formation |
| Niveau | niveau | L1, L2, M1… |
| Module | module | UE pédagogique |
| Matiere | matiere | EC / cours |
| Annee | annee | Année scolaire (legacy) |
| AnneeAcademique | annee_academique | Année LMD avec statuts |
| Semestre | semestre | S1, S2 par année |

### Utilisateurs & sécurité

| Entité | Description |
|--------|-------------|
| User | Comptes système (email, rôle, is_superuser) |

### Étudiants & inscriptions

| Entité | Description |
|--------|-------------|
| Etudiant | Dossier étudiant |
| DocumentEtudiant | Pièces du dossier |
| Inscription | Inscription pédagogique |
| InscriptionMatiere | Choix matières |
| Inscrit | Legacy inscription |
| CampagneInscription | Campagne ouverte |
| DossierCandidature | Candidature en ligne |
| PieceJointe | Fichiers candidature |
| Paiement | Paiement inscription |
| TypePieceRequise | Documents requis |

### Évaluations

| Entité | Description |
|--------|-------------|
| SessionExamen | Session normale/rattrapage |
| Examen | Épreuve |
| Note | Note par étudiant/matière |
| ResultatMatiere | Résultat matière |
| ResultatSemestre | Résultat semestriel |
| ResultatAnnuel | Résultat annuel |
| Deliberation | Conseil de délibération |
| ConfigurationDeliberation | Règles délibération |
| BaremeNotation | Barème notes/mentions |
| MentionNotation | Mentions (AB, B, TB…) |
| RegleCalcul | Règles calcul moyennes |

### Emploi du temps

| Entité | Description |
|--------|-------------|
| Batiment | Bâtiment |
| Salle | Salle de cours |
| CreneauHoraire | Plage horaire |
| Seance | Séance de cours |
| EmploiTemps | Grille EDT |
| Presence | Feuille présence |
| ReservationSalle | Réservation |

### Finances

| Entité | Description |
|--------|-------------|
| TypeFrais | Catégorie frais |
| FraisScolarite | Montants par niveau |
| Facture | Facture étudiant |
| LigneFacture | Lignes facture |
| PaiementFacture | Encaissement |
| CompteEtudiant | Compte financier |
| MouvementCompte | Mouvements |
| Remise / RemiseEtudiant | Remises |
| Echeancier | Échéancier paiement |
| PeriodeComptable | Période comptable |

### Paramétrage & documents

| Entité | Description |
|--------|-------------|
| ParametreSysteme | Paramètres globaux |
| ConfigurationEtablissement | Config par établissement |
| TemplateDocument | Modèles documents |
| ModeleEmail / ModeleSMS | Communications |
| PaysConfiguration | Config par pays |

### LMD & modules

| Entité | Description |
|--------|-------------|
| ModuleSysteme | Modules activables |
| ModuleActif | Modules actifs par année |

### Stages & soutenances

| Entité | Description |
|--------|-------------|
| Stage | Stage étudiant |
| Soutenance | Soutenance mémoire |

## 3. Relations principales

```
Universite 1──* Etablissement 1──* Departement 1──* Filiere
Filiere 1──* Niveau
Niveau *──* Module *──* Matiere
Etudiant *──1 Filiere, *──1 Niveau
Etudiant 1──* Inscription *──1 AnneeAcademique
Inscription 1──* InscriptionMatiere *──1 Matiere
SessionExamen 1──* Examen 1──* Note *──1 Etudiant
AnneeAcademique 1──* Semestre
Facture *──1 Etudiant 1──* LigneFacture
```

## 4. Statuts année académique (LMD)

| Statut | Description |
|--------|-------------|
| brouillon | Créée, non ouverte |
| ouverte | Inscriptions possibles |
| en_cours | Semestre 2 actif |
| cloturee | Délibérations terminées |
| archivee | Archivée |

Voir `docs/GESTION_ANNEES.md` pour le workflow complet.

## 5. Initialisation

### Ordre recommandé

1. `python scripts/init_db.py` - schéma + admin
2. `python scripts/seed_reference_data.py` - référentiel CAMES
3. `python -m app.scripts.init_all` - paramètres, barèmes, templates, pays
4. `python -m app.scripts.init_modules_systeme` - modules système
5. `python -m app.scripts.init_cycles_lmd` + `init_semestres_lmd`

## 6. Migrations

### État actuel

- Alembic : `alembic.ini` + `env.py` présents
- Dossier `alembic/versions/` : **vide**
- Alternative : SQL manuel `app/scripts/migrations/add_lmd_tables.sql`

### Recommandation production

```bash
# Corriger env.py pour importer tous les modèles
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

## 7. Référence historique

Structure v1 documentée dans :
- `DossierConception/Dossier_Conception_GestSco_v2_Enrichi/db_structure.json`
- `DossierConception/.../rapport_structure_db.md`
- `DossierConception/.../liste_entites.txt`

La v2 étend le modèle v1 avec campagnes, finances, LMD, modules système.
