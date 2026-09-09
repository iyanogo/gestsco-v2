# Rapport E2E - Portail Enseignant (GestSco v2)

**Date** : 08/09/2026  
**Compte test** : `e2e-teacher@example.com` / `E2E-Portail-2026!`  
**Enseignant B (test négatif)** : `e2e-teacher-b@example.com` (même mot de passe)

---

## Préparation

```bash
cd backend
python scripts/e2e_manual_test_resultats.py          # si pas déjà fait (E2E-MANUAL-001)
python scripts/e2e_portail_enseignant_verify.py setup
python scripts/e2e_portail_enseignant_verify.py inspect
python scripts/e2e_portail_enseignant_verify.py api
```

**Données seedées** :
- Séances `E2E-PORTAIL-ENS-SEANCE-01` (aujourd'hui) et `-02` (demain) - enseignant connecté
- Stage `E2E-PORTAIL-ENS-STAGE-01` - encadrant = enseignant E2E, étudiant = `E2E-MANUAL-001`

---

## Résultats E2E (08/09/2026)

| Vérification | Résultat |
|--------------|----------|
| API post-login | `/mes-seances` → 200 (2 séances), `/mes-stages-encadres` → 200 (1 stage) |
| Cypress | **6/6** en 1 min 13 s |
| pytest portail | **28 passed** |
| tsc | OK |

**Prérequis** : backend à jour sur `:8000`, frontend sur `:3000`.

```bash
cd frontend
npx cypress run --spec cypress/e2e/portail-enseignant.cy.ts
```

| Écran / test | Attendu |
|--------------|---------|
| Login → dashboard | Redirection `/enseignant/dashboard`, nom « Prof E2E Portail » |
| Dashboard | Stats séances / stages, stage `E2E-PORTAIL-ENS-STAGE-01` visible |
| Mon EDT | Grille chargée sans erreur |
| Mes stages | Table avec code, thème, statut `en_cours` |
| Sécurité stages | `GET /stages/encadrant/99999` → **403** |
| Sécurité séances | `GET /seances/enseignant/99999` → **403** |

---

## Backend - routes portail enseignant

| Route | Filtre propriétaire |
|-------|---------------------|
| `GET /seances/mes-seances` | `enseignant_id = current_user.id` (enseignant) |
| `GET /stages/mes-stages-encadres` | `encadrant_academique_id = current_user.id` |
| `GET /seances/enseignant/{id}` | `assert_encadrant_owner` |
| `GET /stages/encadrant/{id}` | `assert_encadrant_owner` |

---

## Dette connue (hors périmètre sous-lot C)

- ~~Saisie notes enseignant~~ → **sous-lot D livré** (voir § Saisie notes ci-dessous)
- ~~Présences enseignant (feuille d'appel)~~ → **compléments E/F livrés** (voir § Compléments ci-dessous)
- ~~Consultation résultats enseignant~~ → **compléments E/F livrés**
- Libellés matière/niveau affichés par ID sur le dashboard (UX)
- Codes année `E2E-COMP-*` - dette test sans impact (voir `RAPPORT_E2E_PORTAIL_ETUDIANT.md`)

---

## Sous-lot D - Saisie notes enseignant (08/09/2026)

### Préparation

```bash
cd backend
python scripts/e2e_manual_test_resultats.py          # E2E-MANUAL-001 + sessions en_cours
python scripts/e2e_portail_enseignant_verify.py setup
python scripts/e2e_portail_enseignant_verify.py notes-api
```

**Données** : séances enseignant sur matière `E2E-MANUAL-MAT-11` ; note CC **14.5** sur `E2E-MANUAL-001`.

### Résultats

| Vérification | Résultat |
|--------------|----------|
| `GET /mes-matieres-enseignement` | Matière enseignée présente dans le scope |
| `POST /examens/saisie-enseignant` | 201 - session `en_cours` requise |
| `POST /notes/bulk` | Note 14.5 persistée |
| `GET /notes/examen/{id}` | Valeur identique en lecture |
| Matière hors périmètre (enseignant B) | **403** |
| Cypress | **9/9** (3 tests saisie notes ajoutés) |
| pytest | `test_teacher_notes_access.py` - 12 passed |

```bash
cd frontend
npx cypress run --spec cypress/e2e/portail-enseignant.cy.ts
```

| Test saisie notes | Attendu |
|-------------------|---------|
| Page `/enseignant/notes/saisie` | Titre + sous-titre portail enseignant |
| API saisie CC | Note 14.5 visible via `GET /notes/examen/{id}` |
| Sécurité matière étrangère | `POST /examens/saisie-enseignant` → **403** |

### Backend - routes saisie notes enseignant

| Route | Garde |
|-------|-------|
| `GET /seances/mes-matieres-enseignement` | `enseignant_id = current_user.id` |
| `POST /examens/saisie-enseignant` | session `en_cours` + `teacher_teaches_matiere_niveau` |
| `POST /notes/bulk`, `POST /notes/`, `PUT /notes/{id}` | `assert_can_read_or_write_examen_notes` |
| `GET /examens/match`, `GET /notes/examen/{id}` | lecture filtrée par périmètre enseignant |

**Règle métier** : l'enseignant saisit pour toute la matière/niveau s'il a ≥1 séance non annulée (même périmètre étudiants que la scolarité : inscriptions matières). Pas de duplication de `calcul_notes.py` / `deliberation_rules.py`.

---

## Compléments - Présences & Résultats (08/09/2026)

### Présences (feuille d'appel)

| Route | Garde |
|-------|-------|
| `GET /presences/seance/{id}` | `assert_teacher_can_manage_seance_presence` |
| `POST /presences/bulk` | idem + séance non annulée/reportée |
| Page `/enseignant/presences/appel` | `PresencesManagement` mode enseignant |

### Résultats (lecture seule)

| Route | Garde |
|-------|-------|
| `GET /resultats/mes-matieres-enseignement` | scope matière/niveau enseigné ; nominatif + stats agrégées |
| `GET /resultats/matieres/session/{id}` | **403** enseignant |
| `GET /resultats/semestres/classement` | **403** enseignant |
| Page `/enseignant/resultats` | pas de recalcul LMD |

### Préparation

```bash
cd backend
python scripts/e2e_manual_test_resultats.py          # E2E-MANUAL-001 + résultats matière
python scripts/e2e_portail_enseignant_verify.py setup # inclut E2E-PORTAIL-ENS-SEANCE-B (enseignant B)
```

**Données** : séance `E2E-PORTAIL-ENS-SEANCE-B` (enseignant B, matière hors périmètre A) ; matière `E2E-MANUAL-MAT-11` avec résultats calculés.

### Résultats E2E (08/09/2026)

| Vérification | Résultat |
|--------------|----------|
| `GET /presences/seance/{id}` (séance propre) | **200** - feuille d'appel |
| `GET /presences/seance/{id}` (séance enseignant B, token A) | **403** |
| `GET /resultats/mes-matieres-enseignement` (matière enseignée) | **200** - `resultats[]` + stats agrégées |
| `GET /resultats/mes-matieres-enseignement` (matière étrangère) | **403** |
| Cypress | **15/15** en 1 min 33 s |
| pytest compléments | `test_teacher_portal_complements.py` - 8 passed |
| pytest non-régression | notes + présences admin - 23 passed (ensemble portail enseignant) |
| tsc | OK |

```bash
cd frontend
npx cypress run --spec cypress/e2e/portail-enseignant.cy.ts
```

| Test compléments | Attendu |
|------------------|---------|
| Page `/enseignant/presences/appel` | Titre « Feuille d'appel », sélecteur séance |
| API feuille propre | `GET /presences/seance/{id}` → **200** |
| Sécurité séance étrangère | Token enseignant A + séance enseignant B → **403** |
| Page `/enseignant/resultats` | Titre + mention lecture seule |
| API résultats matière enseignée | `GET /resultats/mes-matieres-enseignement` → **200** |
| Sécurité matière étrangère | Matière hors scope → **403** |

**Chantier Portails enseignant** : sous-lots A-D + compléments E/F - **clôturé** (Cypress 15/15).
