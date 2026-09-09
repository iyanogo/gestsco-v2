# Checklist - Portails Enseignant / Étudiant (GestSco v2)

**Date** : 07/09/2026  
**Statut** : P0 + sous-lots A + B + **C** livrés - E2E navigateur validé étudiant + enseignant

---

## Étape 0 - Reconnaissance globale

### 0.1 Frontend - placeholders vs existant

| Zone | État | Détail |
|------|------|--------|
| Routes `/enseignant/*`, `/etudiant/*` | ✅ | `App.tsx` + `ProtectedRoute` (portal teacher/student) |
| Layouts | ✅ | `TeacherLayout`, `StudentLayout` + menus `menuConfig.ts` |
| Dashboards | 🔶 | `StudentDashboard` + `TeacherDashboard` branchés API ; saisie notes enseignant = mock |
| Pages fonctionnelles portail | ✅ | Étudiant : dashboard, profil, résultats, bulletins, relevés, EDT, présences, stages, finances, documents ; Enseignant : complet |

**Routes enseignant (branchées)** - `TeacherRoutes` :
- `/enseignant/dashboard` → `TeacherDashboard` (API mes-seances + mes-stages-encadres + scope)
- `/enseignant/cours` → `TeacherCoursPage` (périmètre `mes-matieres-enseignement`)
- `/enseignant/emploi-temps` → `TeacherEmploiTempsPage` (`MonEmploiTemps` role=enseignant)
- `/enseignant/stages` → `TeacherStagesPage` (étudiant enrichi)
- `/enseignant/notes/saisie` → `TeacherSaisieNotesPage`
- `/enseignant/notes/historique` → `TeacherResultatsPage` (lecture seule)
- `/enseignant/presences/appel|historique` → `TeacherPresencesPage`
- `/enseignant/resultats` → `TeacherResultatsPage`
- `/enseignant/etudiants` → `TeacherEtudiantsPage` (API `mes-etudiants`)
- `/enseignant/documents` → `TeacherDocumentsPage` (hub liens rapides)

**Routes étudiant (branchées)** - `StudentRoutes` :
- `/etudiant/dashboard` → `StudentDashboard` (API)
- `/etudiant/profil` → `StudentProfilPage` (mes-profil + mes-inscriptions)
- `/etudiant/notes` → `StudentResultatsPage`
- `/etudiant/bulletins` → `StudentBulletinsPage` (bulletin semestre/annuel + PDF)
- `/etudiant/releves` → `StudentRelevesPage` (relevé notes complet)
- `/etudiant/emploi-temps` → `StudentEmploiTempsPage`
- `/etudiant/presences` → `StudentPresencesPage`
- `/etudiant/stages` → `StudentStagesPage`
- `/etudiant/finances/compte|factures|paiements` → pages finances (lecture seule)
- `/etudiant/documents/*` → `StudentDocumentsPage` (hub liens rapides)

**Composants réutilisables (MUI, hors BootstrapRoutes)** :
- `MonEmploiTemps.tsx` - grille hebdo ; appelle déjà `seanceService.getSeancesEnseignant(userId)` ou `/seances/semaine` selon rôle ; **non branché** dans le portail Bootstrap
- `MonEmploiTempsPage.tsx`, `PlanningEnseignantPage.tsx` - pages MUI legacy (hors routes portail)
- Services frontend prêts : `resultatService`, `bulletinService`, `presenceService`, `compteEtudiantService`, `factureService`, `paiementFactureService`, `inscriptionService`, `stageService`, `seanceService`

### 0.2 Lien User ↔ Etudiant / Enseignant

| Entité | Lien avec `User` | Constat |
|--------|------------------|---------|
| **Enseignant** | Pas de table `enseignant` | `Seance.enseignant_id` → `users.id` ; `Stage.encadrant_academique_id` → `users.id`. **L'enseignant connecté = `current_user.id`.** |
| **Étudiant** | Pas de FK `user_id` sur `etudiant` | Champ `etudiant.email` (unique, nullable). **`User` n'a pas `etudiant_id`.** |

**Conséquences** :
- `bulletins.py` → `verifier_acces_etudiant()` teste `current_user.etudiant_id` qui **n'existe pas** sur le modèle → accès étudiant **toujours refusé** (sauf admin/scolarité).
- Aucun helper central `resolve_etudiant_from_user(db, user)` aujourd'hui.
- **Prérequis P0 (bloquant)** avant tout sous-lot étudiant : résolution fiable User → Etudiant (FK `user_id` sur `etudiant` **ou** matching email documenté + testé ; FK recommandée long terme).

### 0.3 Backend - endpoints existants vs filtre propriétaire

Légende : ✅ filtre OK ou route `/mes-*` | ⚠️ lecture ouverte (`get_current_active_user` + ID URL) | 🔒 admin/scolarité only | ➕ route `/mes-*` à créer

#### Résultats / bulletins / notes

| Endpoint | RBAC actuel | Filtre propriétaire |
|----------|-------------|---------------------|
| `GET /resultats/matieres/etudiant/{id}` | `active_user` | ⚠️ **Aucun** - tout auth peut lire n'importe quel étudiant |
| `GET /resultats/semestres/etudiant/{id}` | idem | ⚠️ idem |
| `GET /resultats/annuels/etudiant/{id}` | idem | ⚠️ idem |
| `GET /bulletins/etudiant/{id}/*` | `active_user` + `verifier_acces_etudiant` | ⚠️ **Cassé** (`etudiant_id` absent sur User) |
| `GET /notes/etudiant/{id}` | `active_user` | ⚠️ **Aucun** |
| POST calculs `/resultats/calculer/*` | scolarité | 🔒 OK (écriture admin) |

#### EDT / séances

| Endpoint | RBAC | Filtre propriétaire |
|----------|------|---------------------|
| `GET /seances/enseignant/{enseignant_id}` | `active_user` | ⚠️ **Aucun** - ID en URL libre |
| `GET /seances/semaine` (+ filtres niveau/filière) | `active_user` | ⚠️ Pas de filtre étudiant ; usage portail = dériver niveau/filière depuis inscription active |
| `GET /emplois-temps/{id}/export/pdf` | `active_user` | ⚠️ Accès par ID emploi du temps |

#### Présences

| Endpoint | RBAC | Filtre propriétaire |
|----------|------|---------------------|
| `GET /presences/etudiant/{id}` | `active_user` | ⚠️ **Aucun** |
| `GET /presences/etudiant/{id}/taux` | `active_user` | ⚠️ **Aucun** |
| POST feuille d'appel / bulk | scolarité | 🔒 OK |

#### Finances

| Endpoint | RBAC | Filtre propriétaire |
|----------|------|---------------------|
| `GET /factures/etudiant/{id}` | `active_user` + owner | ✅ `assert_etudiant_owner` |
| `GET /comptes-etudiants/etudiant/{id}` | `active_user` + owner | ✅ idem |
| `GET /paiements-factures/etudiant/{id}` | `active_user` + owner | ✅ idem |
| `GET /factures/` sans filtre | staff | ✅ **403** portail (08/09/2026) |
| Matrice RBAC doc | - | 👁️ soi prévu pour étudiant ([07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §11) |

#### Stages / inscriptions

| Endpoint | RBAC | Filtre propriétaire |
|----------|------|---------------------|
| `GET /stages/etudiant/{id}` | admin/scolarité | 🔒 pas accessible étudiant |
| `GET /stages/encadrant/{id}` | admin/scolarité | 🔒 pas accessible enseignant |
| `GET /inscriptions/etudiant/{id}/current` | `active_user` | ⚠️ **Aucun** |

#### Patron existant à suivre

| Endpoint | Pattern |
|----------|---------|
| `GET /reservations-salles/mes-reservations` | ✅ Filtre `current_user.id` côté backend - **modèle à généraliser** |

### 0.4 Matrice RBAC documentée (cible produit)

Source : [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §10-11

| Action | Enseignant | Étudiant |
|--------|------------|----------|
| Saisie notes | ✅ (cible) | ❌ |
| Finances | ❌ | 👁️ soi |
| Stages encadrés | 👁️ (prévu portail) | 👁️ son stage (prévu) |
| EDT | 👁️ soi | 👁️ soi |

---

## Point de décision - Prérequis P0 (avant sous-lot A)

**Validé et implémenté** :

1. **Lien User ↔ Etudiant** : migration `etudiant.user_id` (FK nullable, unique) - `002_add_etudiant_user_id.py`
2. **Helper backend transverse** : `app/core/portal_access.py` :
   - `resolve_etudiant_id(db, user) -> int`
   - `assert_etudiant_owner(user, etudiant_id, db)`
   - `assert_encadrant_owner(user, encadrant_id)`
3. **Routes `/mes-*`** pour les portails - voir endpoints inscriptions, resultats, presences, seances, stages, factures, notes, comptes

---

## Découpage proposé (validation requise)

### Sous-lot A - Portail étudiant : dashboard, résultats, EDT

**Prérequis** : P0 (lien User ↔ Etudiant)

- [x] Dashboard : inscription active (`/inscriptions/mes-inscription/current`, `/mes-profil`), raccourcis
- [x] Mes résultats : wrapper `/mes-resultats` + `portalService` côté front
- [x] Mon EDT : `MonEmploiTemps` (filtre niveau/filière depuis inscription) dans `StudentRoutes`
- [x] Tests sécurité : étudiant A ne lit pas résultats/EDT de B (403) - `test_portal_access.py`

### Sous-lot B - Portail étudiant : présence, finances

**Prérequis** : sous-lot A + routes `/mes-presences`, `/mes-factures`, `/mon-compte`

- [x] Mon taux de présence (lecture seule) - `GET /presences/mes-presences/taux` + historique `/mes-presences`
- [x] Mes finances (compte, factures, paiements) - aligné matrice 👁️ soi ; PDF facture/reçu/relevé si autorisé
- [x] Tests sécurité : pas d'accès aux finances/présences d'un autre étudiant - `test_portal_access.py`

### Vérification E2E réelle portail étudiant (07/09/2026)

- [x] Compte `e2e-manual@example.com` lié à `E2E-MANUAL-001` - script `backend/scripts/e2e_portail_etudiant_verify.py setup`
- [x] Parcours navigateur Cypress 13/13 - `frontend/cypress/e2e/portail-etudiant.cy.ts`
- [x] Rapport détaillé avec valeurs affichées - [RAPPORT_E2E_PORTAIL_ETUDIANT.md](./RAPPORT_E2E_PORTAIL_ETUDIANT.md)
- [x] Test négatif 403 en conditions réelles (devtools / cy.request)
- [x] Bug E2E #1 - `EmailStr` / `.local` : validateur `EmailEtablissement` + tests `test_auth`, `test_schema_validators`
- [x] Bug E2E #2 - format année `YYYY-YYYY` : seed corrigé, `503` explicite si legacy, script `normalize_annee_academique_legacy.py`
- [x] Seed `CompteEtudiant` pour E2E - `e2e_portail_etudiant_verify.py setup` (`_ensure_e2e_finances`)

### Sous-lot C - Portail enseignant : dashboard, EDT, stages encadrés

**Prérequis** : helper `assert_encadrant_owner` (simple : `encadrant_id == current_user.id`)

- [x] Dashboard : séances du jour/semaine via `/seances/mes-seances`
- [x] Mon EDT : `MonEmploiTemps` role=enseignant dans `TeacherRoutes`
- [x] Mes stages encadrés : `GET /stages/mes-stages-encadres` (remplace ouverture globale `/encadrant/{id}`) - **filtre propriétaire**, pas levée RBAC globale
- [x] Tests sécurité : enseignant A ne voit pas stages encadrés par B - `test_portal_access.py`

### Vérification E2E réelle portail enseignant (08/09/2026)

- [x] Compte `e2e-teacher@example.com` - script `backend/scripts/e2e_portail_enseignant_verify.py setup`
- [x] Parcours navigateur Cypress 6/6 - `frontend/cypress/e2e/portail-enseignant.cy.ts`
- [x] Rapport - [RAPPORT_E2E_PORTAIL_ENSEIGNANT.md](./RAPPORT_E2E_PORTAIL_ENSEIGNANT.md)
- [x] Test négatif 403 (stages + séances) - Cypress + pytest

### Sous-lot D - Portail enseignant : saisie notes *(livré 08/09/2026)*

**Règle retenue** : pas de table d'affectation dédiée - filtre via `Seance.enseignant_id` + `matiere_id` + `niveau_id` ; session `en_cours` obligatoire (aligné admin).

- [x] Lien enseignant/matière : via `Seance.matiere_id` + examens de ses séances (pas de table dédiée)
- [x] `GET /seances/mes-matieres-enseignement` - scope enseignant
- [x] `POST /examens/saisie-enseignant` + garde-fous sur `POST/PUT /notes/*`, `GET /notes/examen/{id}`, `GET /examens/match`
- [x] Frontend : `TeacherSaisieNotesPage` réutilise `SaisieNotesPage` (`portalMode="teacher"`)
- [x] Tests sécurité : `test_teacher_notes_access.py` (403 matière hors périmètre, session non ouverte)
- [x] Non-régression : `test_deliberation_rules`, `test_calcul_notes_config` - inchangés
- [x] E2E : Cypress saisie notes + 403 ; script `e2e_portail_enseignant_verify.py notes-api`
- [x] Rapport complété - [RAPPORT_E2E_PORTAIL_ENSEIGNANT.md](./RAPPORT_E2E_PORTAIL_ENSEIGNANT.md) § Saisie notes

**Hors périmètre lot D (livré compléments E/F)** : ~~consultation résultats~~ → voir § Compléments ci-dessous.

### Compléments portail enseignant - Présences & Résultats *(livré 08/09/2026)*

**Même scope que sous-lot D** : `teacher_notes_access.py` / `Seance.enseignant_id` + `matiere_id` + `niveau_id`.

#### Volet E - Feuille d'appel (présences)

- [x] `assert_teacher_can_manage_seance_presence` + `assert_seance_emargement_ouverte`
- [x] Gardes sur `GET/POST/PUT /presences/*` (feuille, bulk, stats séance)
- [x] `TeacherPresencesPage` - réutilise `PresencesManagement` (`portalMode="teacher"`, séances via `/mes-seances`)
- [x] Tests : `test_teacher_portal_complements.py` (403 séance étrangère, séance annulée)

#### Volet F - Consultation résultats (lecture seule)

- [x] `GET /resultats/mes-matieres-enseignement` - nominatif par étudiant + stats agrégées (effectif, taux réussite)
- [x] Classements / liste session entière → **403** enseignant
- [x] `TeacherResultatsPage` - lecture seule, pas de bouton Calculer
- [x] Tests : 403 matière étrangère, 403 `/matieres/session/{id}`

#### E2E compléments

- [x] Cypress `portail-enseignant.cy.ts` - 19 tests (cours, étudiants, documents, présences + résultats)
- [x] Seed `E2E-PORTAIL-ENS-SEANCE-B` (enseignant B, matière hors périmètre A)

---

## Vérification non-régression (chaque sous-lot)

- [x] Admin/scolarité inchangé - `test_presences_feuille_appel.py` (bulk admin) + endpoints résultats scolarité non modifiés
- [x] `tsc --noEmit` (sous-lot B)
- [x] `pytest` au vert - portails enseignant (notes, présences, résultats)
- [x] Test sécurité : modification ID URL → 403 systématique (sous-lot B)

## Documentation (chaque sous-lot livré)

- [x] [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5
- [x] [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §10
- [x] [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.3

---

## Synthèse risques

| Risque | Mitigation |
|--------|------------|
| Fuite inter-utilisateurs | Routes `/mes-*` + assert backend ; **jamais** faire confiance à `etudiant_id` query/body |
| Parcours E2E réel jamais validé | ✅ Validé 07/09 - voir `RAPPORT_E2E_PORTAIL_ETUDIANT.md` ; redémarrer backend après deploy |
| Email `@test.local` sur comptes User | ✅ Corrigé - `EmailEtablissement` accepte domaines internes ; migration legacy année via `normalize_annee_academique_legacy.py` |
| Codes année `E2E-COMP-*` en base dev | Dette test isolée - **pas de correction** (hors portail E2E) ; documenté dans `RAPPORT_E2E_PORTAIL_ETUDIANT.md` |
| Duplication logique | Réutiliser services/composants admin (`MonEmploiTemps`, `resultatService`, etc.) |
| Saisie notes (lot D) | Lot séparé, validation périmètre, tests délibération - **livré** : garde backend `teacher_notes_access.py`, E2E obligatoire |
