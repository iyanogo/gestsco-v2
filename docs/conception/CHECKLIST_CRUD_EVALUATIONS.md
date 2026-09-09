# Checklist - Branchement CRUD Évaluations / Notes (GestSco v2)

**Date** : 07/09/2026  
**Références** : [SYSTEME_LMD.md](../SYSTEME_LMD.md), checklists inscriptions précédentes

---

## Point de décision (Étape 0)

### Le moteur de calcul existe-t-il côté backend ?

**Oui, partiellement** - ce n'est **pas** un simple branchement CRUD :

| Composant | Statut | Détail |
|-----------|--------|--------|
| `backend/app/utils/calcul_notes.py` | ✅ | Moyennes, mentions, décisions matière/semestre/année |
| `resultat_matiere_repository.calculer_*` | ✅ | Agrège CC/TP/examen, appelle `calcul_notes` |
| `resultats.py` `/calculer/*` | ✅ | Endpoints POST calcul matière/session/semestre/annuel |
| `DeliberationService` | ✅ | S'appuie sur `ResultatSemestre`/`ResultatAnnuel` (plus `note.note_finale`) |
| `ConfigurationDeliberation` | ✅ | Tous les champs LMD (`compensation_semestres`, seuils, dettes max…) |
| `configurations_deliberation` API | ✅ | CRUD config - pas de calcul direct |

### Lacunes bloquantes identifiées

1. ~~**`Matiere`** : pas de champs `credit`, `obligatoire`~~ - **corrigé** (07/09/2026) : colonnes + migration Alembic `001_matiere_credit`, défaut ECTS = 3
2. ~~**Types d'examen** : schéma API vs repository résultats (`cc` vs `controle_continu`)~~ - **corrigé** via `app/core/type_evaluation.py`
3. **Rattrapage « meilleure note »** : implémenté dans `assign_note_to_slot` - ✅ test unitaire `test_meilleure_note_kept_for_same_type`
4. **Validation session ouverte** : `SessionExamen.statut === en_cours` - ✅ backend (`assert_can_read_or_write_examen_notes`) + test `test_teacher_cannot_saisie_when_session_not_en_cours`
5. ~~**`DeliberationService`** : `note.note_finale`~~ - **corrigé** (sous-lot 4)

### Clé de liaison notes ↔ inscriptions

`Note.inscription_matiere_id` + `Note.examen_id` + `Examen.session_id` - confirmé dans le modèle SQLAlchemy.

### Périmètre RBAC (admin/scolarité pour l'instant)

Saisie via endpoints notes (auth active user) ; validation notes et calculs résultats = scolarité.

---

## Étape 0 - Reconnaissance

- [x] SYSTEME_LMD.md lu
- [x] ConfigurationDeliberation - champs présents et exploités (méthodes `peut_compenser`, etc.)
- [x] Endpoints identifiés : notes, examens, sessions-examen, deliberations, resultats
- [x] Calcul backend : **oui** pour résultats via `/resultats/calculer/*` ; **non fiable** via DeliberationService seul
- [x] Pages front : `SaisieNotesPage`, `ResultatsPage`, `DeliberationsPage` branchées API ; **`SessionsPage`, `ExamensPage` branchées API** (08/09/2026)
- [x] Lien InscriptionMatiere confirmé

---

## Étape 1 - Saisie des notes (sous-lot 1 - livré)

- [x] `SaisieNotesPage.tsx` branchée API
- [x] Étudiants via inscriptions + `getMatieresByInscription` (semestre session)
- [x] Types : `controle_continu`, `tp`, `examen_final`, etc. (schéma backend)
- [x] Enregistrement `createNotesBulk` + `updateNote`
- [x] Filtre session ; blocage si statut ≠ `en_cours`
- [x] Moyenne **indicative** seulement (pas décision officielle)
- [x] Test E2E Cypress page saisie notes

---

## Étape 2 - Sessions d'examen (livré 08/09/2026)

- [x] `SessionsPage.tsx` → API (`sessionExamenService`)
- [x] CRUD + ouvrir / clôturer / valider (superuser)
- [x] Filtres année, semestre, statut ; compteur examens par session
- [x] Règle session ouverte avant saisie (backend + frontend)
- [x] Rattrapage meilleure note - `assign_note_to_slot` + test unitaire

---

## Étape 2b - Examens (livré 08/09/2026)

- [x] `ExamensPage.tsx` → API (`examenService`)
- [x] CRUD + terminer / valider
- [x] Filtres session, statut ; matières/niveaux/enseignants depuis référentiel

---

## Étape 3 - Calcul moyennes / compensation (sous-lot 3 - livré)

**Prérequis backend (Étape 0)** : types examen alignés + `Matiere.credit` - ✅ livré 07/09/2026.

- [x] Brancher UI résultats sur `/resultats/calculer/*` (ne pas recalculer LMD côté front) - `ResultatsPage.tsx`
- [x] Corriger alignement types examen (`cc` vs `controle_continu`) - **backend**
- [x] Crédits ECTS - migration `Matiere.credit` + `obligatoire` (Alembic `001_matiere_credit`)
- [x] Fix backend `resultat_semestre_repository` : filtre par `InscriptionMatiere.semestre` (plus `Matiere.semestre` inexistant)

### Affiché depuis le backend (via calcul + GET)

| Niveau | Données | Limites |
|--------|---------|---------|
| Matière | CC/TP/examen, moyenne, ECTS, statut validé/non validé, décision | Seuils via `ConfigurationDeliberation` (`note_eliminatoire` + **`taux_presence_min`** appliqués si données présence) |
| Semestre | Moyenne pondérée crédits, ECTS, mention, décision (admis / admis avec dette / ajourné / exclus) | Même moteur que `deliberation_rules.py` (passage conditionnel, crédits min absolus ou 70 %) |
| Annuel | Moyenne S1/S2, ECTS, mention, décision, passage, compensation inter-semestres | Aligné `deliberation_rules.determiner_decision_annuelle` |

## Étape 4 - Délibérations (sous-lot 4 - livré)

- [x] `DeliberationService` réécrit - s'appuie sur `ResultatSemestre`/`ResultatAnnuel` (plus `note.note_finale`)
- [x] Règles via `deliberation_rules.py` + `ConfigurationDeliberation` (seuils, compensation S1+S2, passage conditionnel, exclus)
- [x] Tests unitaires `test_deliberation_rules.py` (6 scénarios)
- [x] `DeliberationsPage.tsx` branchée API (`/deliberations/creer`, terminer, valider)
- [x] Validation officielle : `valider_deliberation` → `is_valide=true` sur résultats (superuser API)
- [ ] **Suite** : remplacer heuristique `ReinscriptionsPage` par décision délibération validée - ✅ 07/09/2026
- [x] **`taux_presence_min`** appliqué dans `calcul_notes.determiner_decision_matiere` (sous-lot D EDT, 07/09/2026)
- [ ] **Partiel** : RBAC validation = superuser uniquement (pas rôle « jury » dédié)

### Découpage retenu (4a / 4b / 4c)

| Sous-lot | Contenu | Statut |
|--------|---------|--------|
| 4a | Service + config + tests règles | ✅ |
| 4b | Compensation inter-semestres + passage conditionnel | ✅ (via `deliberation_rules`) |
| 4c | UI DeliberationsPage | ✅ |

---

## Vérification

- [x] `tsc --noEmit`
- [x] Jest SaisieNotesPage + ResultatsPage + DeliberationsPage
- [x] `pytest` 62+ passed (dont délibération + calcul config)
- [x] Test manuel compensation + passage conditionnel - `scripts/e2e_manual_test_resultats.py` (08/09/2026)
- [x] Fix schéma `type_deliberation` : accepte `semestrielle` (évite 500 sur GET `/deliberations/`) - 08/09/2026
- [x] Cypress `evaluations.cy.ts` - **7/7** (sessions, examens, notes, résultats, délibérations)
- [x] Test manuel bout en bout notes → résultats → délibération - `e2e_manual_test_resultats.py` étapes 1-5 OK

---

## Documentation

- [x] Ce fichier - chantier Évaluations **complet côté UI admin** (sessions + examens branchés)
- [x] `00_AUDIT_COMPLET.md` §5
- [x] `05_FRONTEND_UI.md` §10
- [x] `11_PLAN_ACTION.md` §4.1
