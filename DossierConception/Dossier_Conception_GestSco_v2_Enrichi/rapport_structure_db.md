# Structure de la Base de Données GestSco

**Nombre total de tables** : 29

---

## Table : `annee`

**Nombre de colonnes** : 10

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| statut | boolean |  |  |  |  |
| etat | character |  |  |  |  |
| lier_enseignement | boolean |  |  |  | ✓ |

---

## Table : `coeficient`

**Nombre de colonnes** : 11

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| valeur | double |  |  | ✓ |  |
| matiere_id | bigint |  | ✓ |  |  |
| enseignement_id | bigint |  | ✓ |  |  |
| type_note_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| annee | character |  |  |  |  |

**Relations (clés étrangères)** :

- `matiere_id` → `matiere.id`
- `enseignement_id` → `enseignement.id`
- `type_note_id` → `type_note.id`

---

## Table : `coordinateur`

**Nombre de colonnes** : 12

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| nom | character |  |  | ✓ |  |
| prenom | character |  |  | ✓ |  |
| telephone | character |  |  |  |  |
| email | character |  |  |  |  |
| date_naissance | character |  |  |  |  |
| lieu_naissance | character |  |  |  |  |
| sexe | character |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

---

## Table : `cycle`

**Nombre de colonnes** : 8

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

---

## Table : `databasechangelog`

**Nombre de colonnes** : 14

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | character |  |  | ✓ |  |
| author | character |  |  | ✓ |  |
| filename | character |  |  | ✓ |  |
| dateexecuted | timestamp |  |  | ✓ |  |
| orderexecuted | integer |  |  | ✓ |  |
| exectype | character |  |  | ✓ |  |
| md5sum | character |  |  |  |  |
| description | character |  |  |  |  |
| comments | character |  |  |  |  |
| tag | character |  |  |  |  |
| liquibase | character |  |  |  |  |
| contexts | character |  |  |  |  |
| labels | character |  |  |  |  |
| deployment_id | character |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `deployment_id` → `deployment.id`

---

## Table : `databasechangeloglock`

**Nombre de colonnes** : 4

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | integer |  |  | ✓ |  |
| locked | boolean |  |  | ✓ |  |
| lockgranted | timestamp |  |  |  |  |
| lockedby | character |  |  |  |  |

---

## Table : `departement`

**Nombre de colonnes** : 9

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| etablissement_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

**Relations (clés étrangères)** :

- `etablissement_id` → `etablissement.id`

---

## Table : `enseignement`

**Nombre de colonnes** : 16

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| module_id | bigint |  | ✓ |  |  |
| filiere_id | bigint |  | ✓ |  |  |
| semestre_id | bigint |  | ✓ |  |  |
| cycle_id | bigint |  | ✓ |  |  |
| niveau_id | bigint |  | ✓ |  |  |
| annee_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| tpe | double |  |  |  |  |
| va | double |  |  |  |  |
| vcvh | double |  |  |  |  |
| vp | double |  |  |  |  |

**Relations (clés étrangères)** :

- `module_id` → `module.id`
- `filiere_id` → `filiere.id`
- `semestre_id` → `semestre.id`
- `cycle_id` → `cycle.id`
- `niveau_id` → `niveau.id`
- `annee_id` → `annee.id`

---

## Table : `etablissement`

**Nombre de colonnes** : 17

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| nom | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| ville | character |  |  |  |  |
| adresse | character |  |  |  |  |
| telephone | character |  |  |  |  |
| fixe | character |  |  |  |  |
| email | character |  |  |  |  |
| universite_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| nom_directeur | character |  |  |  |  |
| prenom_directeur | character |  |  |  |  |
| tel_directeur | character |  |  |  |  |

**Relations (clés étrangères)** :

- `universite_id` → `universite.id`

---

## Table : `etudiant`

**Nombre de colonnes** : 20

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| nom | character |  |  | ✓ |  |
| prenom | character |  |  | ✓ |  |
| date_naissance | character |  |  |  |  |
| lieu_naissance | character |  |  |  |  |
| telephone | character |  |  |  |  |
| cni | character |  |  |  |  |
| annee_bac | character |  |  |  |  |
| numero_bac | character |  |  |  |  |
| mention | character |  |  |  |  |
| boursier | boolean |  |  |  |  |
| sexe | character |  |  |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| diplome | character |  |  |  |  |
| matricule | character |  |  |  |  |
| nationalite | character |  |  |  |  |
| importation_id | bigint |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `importation_id` → `importation.id`

---

## Table : `filiere`

**Nombre de colonnes** : 13

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| etabissement_id | bigint |  | ✓ |  |  |
| coordonateur_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| coordinateur_id | bigint |  | ✓ |  |  |
| etablissement_id | bigint |  | ✓ |  |  |
| annee | character |  |  |  |  |

**Relations (clés étrangères)** :

- `etabissement_id` → `etabissement.id`
- `coordonateur_id` → `coordonateur.id`
- `coordinateur_id` → `coordinateur.id`
- `etablissement_id` → `etablissement.id`

---

## Table : `importation`

**Nombre de colonnes** : 13

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| code | character |  |  |  |  |
| file_name | character |  |  |  |  |
| libelle | character |  |  |  |  |
| sheet_name | character |  |  |  |  |
| annee_id | bigint |  | ✓ |  |  |
| cycle_id | bigint |  | ✓ |  |  |
| filiere_id | bigint |  | ✓ |  |  |
| niveau_id | bigint |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `annee_id` → `annee.id`
- `cycle_id` → `cycle.id`
- `filiere_id` → `filiere.id`
- `niveau_id` → `niveau.id`

---

## Table : `inscrit`

**Nombre de colonnes** : 9

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  |  |  |
| etudiant_id | bigint |  | ✓ |  |  |
| enseignement_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

**Relations (clés étrangères)** :

- `etudiant_id` → `etudiant.id`
- `enseignement_id` → `enseignement.id`

---

## Table : `jhi_authority`

**Nombre de colonnes** : 1

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| name | character |  |  | ✓ |  |

---

## Table : `jhi_user`

**Nombre de colonnes** : 18

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| login | character |  |  | ✓ |  |
| password_hash | character |  |  | ✓ |  |
| first_name | character |  |  |  |  |
| last_name | character |  |  |  |  |
| email | character |  |  |  |  |
| image_url | character |  |  |  |  |
| activated | boolean |  |  | ✓ |  |
| lang_key | character |  |  |  |  |
| activation_key | character |  |  |  |  |
| reset_key | character |  |  |  |  |
| created_by | character |  |  | ✓ |  |
| created_date | timestamp |  |  |  |  |
| reset_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| profil_id | bigint |  | ✓ |  |  |
| telephone | character |  |  |  |  |

**Relations (clés étrangères)** :

- `profil_id` → `profil.id`

---

## Table : `jhi_user_authority`

**Nombre de colonnes** : 2

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| user_id | bigint |  | ✓ | ✓ |  |
| authority_name | character |  |  | ✓ |  |

**Relations (clés étrangères)** :

- `user_id` → `user.id`

---

## Table : `matiere`

**Nombre de colonnes** : 14

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| module_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| annee | character |  |  |  |  |
| tpe | double |  |  |  |  |
| va | double |  |  |  |  |
| vcvh | double |  |  |  |  |
| vp | double |  |  |  |  |

**Relations (clés étrangères)** :

- `module_id` → `module.id`

---

## Table : `mention`

**Nombre de colonnes** : 9

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| code | character |  |  |  |  |
| libelle | character |  |  |  |  |
| max_moyenne | double |  |  |  |  |
| min_moyenne | double |  |  |  |  |

---

## Table : `module`

**Nombre de colonnes** : 17

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| vol_horaire | character |  |  |  |  |
| coordinateur_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| annee | character |  |  |  |  |
| tpe | double |  |  |  |  |
| va | double |  |  |  |  |
| vcvh | double |  |  |  |  |
| vp | double |  |  |  |  |
| semestre_id | bigint |  | ✓ |  |  |
| filiere_id | bigint |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `coordinateur_id` → `coordinateur.id`
- `semestre_id` → `semestre.id`
- `filiere_id` → `filiere.id`

---

## Table : `moyenne`

**Nombre de colonnes** : 16

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| annee | character |  |  |  |  |
| appreciation | character |  |  |  |  |
| code | character |  |  |  |  |
| moyenne | double |  |  |  |  |
| note_ponderee | double |  |  |  |  |
| session | character |  |  |  |  |
| etudiant_id | bigint |  | ✓ |  |  |
| filiere_id | bigint |  | ✓ |  |  |
| matiere_id | bigint |  | ✓ |  |  |
| module_id | bigint |  | ✓ |  |  |
| semestre_id | bigint |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `etudiant_id` → `etudiant.id`
- `filiere_id` → `filiere.id`
- `matiere_id` → `matiere.id`
- `module_id` → `module.id`
- `semestre_id` → `semestre.id`

---

## Table : `niveau`

**Nombre de colonnes** : 7

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

---

## Table : `note`

**Nombre de colonnes** : 13

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| libelle | character |  |  |  |  |
| note | double |  |  | ✓ |  |
| matiere_id | bigint |  | ✓ |  |  |
| type_note_id | bigint |  | ✓ |  |  |
| etudiant_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| etat | character |  |  |  |  |
| note_order | character |  |  |  |  |
| session | character |  |  |  |  |

**Relations (clés étrangères)** :

- `matiere_id` → `matiere.id`
- `type_note_id` → `type_note.id`
- `etudiant_id` → `etudiant.id`

---

## Table : `parametre`

**Nombre de colonnes** : 4

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| key | character |  |  |  |  |
| selection | boolean |  |  |  |  |
| value | character |  |  |  |  |

---

## Table : `profil`

**Nombre de colonnes** : 8

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| code | character |  |  |  |  |
| description | character |  |  |  |  |
| libelle | character |  |  |  |  |

---

## Table : `profil_role`

**Nombre de colonnes** : 2

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| profils_id | bigint |  | ✓ | ✓ |  |
| authority_name | character |  |  | ✓ |  |

**Relations (clés étrangères)** :

- `profils_id` → `profils.id`

---

## Table : `resultat`

**Nombre de colonnes** : 15

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| created_by | character |  |  | ✓ |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |
| annee | character |  |  |  |  |
| credit_semestre | double |  |  |  |  |
| decision | character |  |  |  |  |
| moyenne_semestre | double |  |  |  |  |
| session | character |  |  |  |  |
| total_semestre | double |  |  |  |  |
| etudiant_id | bigint |  | ✓ |  |  |
| filiere_id | bigint |  | ✓ |  |  |
| niveau_id | bigint |  | ✓ |  |  |
| semestre_id | bigint |  | ✓ |  |  |

**Relations (clés étrangères)** :

- `etudiant_id` → `etudiant.id`
- `filiere_id` → `filiere.id`
- `niveau_id` → `niveau.id`
- `semestre_id` → `semestre.id`

---

## Table : `semestre`

**Nombre de colonnes** : 9

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| niveau_id | bigint |  | ✓ |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

**Relations (clés étrangères)** :

- `niveau_id` → `niveau.id`

---

## Table : `type_note`

**Nombre de colonnes** : 7

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| libelle | character |  |  | ✓ |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

---

## Table : `universite`

**Nombre de colonnes** : 14

| Colonne | Type | PK | FK | NOT NULL | DEFAULT |
|---------|------|----|----|----------|----------|
| id | bigint |  |  | ✓ |  |
| code | character |  |  |  |  |
| nom | character |  |  | ✓ |  |
| sigle | character |  |  |  |  |
| ville | character |  |  |  |  |
| adresse | character |  |  |  |  |
| telephone | character |  |  |  |  |
| fixe | character |  |  |  |  |
| email | character |  |  |  |  |
| site | character |  |  |  |  |
| created_by | character |  |  |  |  |
| created_date | timestamp |  |  |  |  |
| last_modified_by | character |  |  |  |  |
| last_modified_date | timestamp |  |  |  |  |

---

