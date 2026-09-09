# Checklist - RBAC Actions Fines par Composant (GestSco v2)

**Date** : 08/09/2026  
**Approche retenue** : matrice centralisée `rbacActions.ts` + `usePermissions().canPerform(module, action)` + composant `PermissionGate` - **pas** de logique ad hoc par page.

> ⚠️ Ce chantier améliore la **cohérence UX**. Le **backend reste la seule garantie de sécurité** (gardes FastAPI inchangés).

---

## Étape 0 - Reconnaissance

- [x] Inventaire pages/composants CRUD (référentiel, étudiants, finances, évaluations, EDT, stages, paramétrage, portails)
- [x] État `usePermissions` : navigation uniquement avant ce chantier ; `CreneauxListPage` seul gate composant (`isSuperuser`)
- [x] Croisement gardes backend : matrice alignée `permissions.py`, `get_current_admin_scolarite_user`, `get_current_admin_user`, `teacher_notes_access.py`

**Décision** : hook unique `canPerform('etudiants', 'delete')` plutôt que 20 variantes locales.

---

## Étape 1 - Référentiel permissions actions

- [x] `frontend/src/utils/rbacActions.ts` - matrice module × action × rôles
- [x] `usePermissions().canPerform()` et `moduleActions(module)`
- [x] `frontend/src/components/ui/PermissionGate.tsx` (mode hide / disable + tooltip)
- [x] Tests Jest `frontend/src/utils/__tests__/rbacActions.test.ts`

---

## Étape 2 - Application par module

### P0 - Paramétrage / Référentiel / Admin

- [x] `ReferentielCrudPage` - create/edit/delete masqués si rôle ≠ admin
- [x] `AnneesScolairesPage`, `BaremesManagement`, `PaysConfigManagement`
- [x] `ReglesCalculManagement`, `ModelesCommunicationManagement`, `TemplatesManagement`, `ParametrageGenerauxManagement`
- [x] `UtilisateursListPage` (route superadmin + `moduleActions('utilisateurs')`)
- [ ] `GestionAnneesPage`, `GestionModulesPage`, `ConfigurationDeliberationPage`

### P1 - Sensibles métier

- [x] `DeliberationsPage` - create / terminer / valider
- [x] `ResultatsPage` - bouton Calculer
- [x] `SaisieNotesPage` - Enregistrer (admin/scolarité + portail enseignant via `portalMode`)
- [x] `EtudiantsListPage` - create / edit / delete / bulk / **export**
- [x] `TypesFraisPage` - CRUD finances
- [ ] `PaiementsListPage`, `FacturesList`, pages inscriptions (`InscriptionsPage`, `InscriptionsMatieresPage`, `ReinscriptionsPage`, `DossiersPage`)

### P2 - EDT / Stages

- [x] `CreneauxListPage` - migré vers `edt_creneaux` (superadmin write)
- [x] `EmploiTempsPlanning` - nouvelle séance / récurrente / **export Excel-PDF**
- [x] `StagesPage` - nouveau stage
- [ ] `ReservationsManagement`, `PresencesManagement` (admin), `StageDetailPage`, soutenances

### P3 - Portails

- [x] Enseignant : saisie notes / présences via `portalMode` + scope API (pas de duplication RBAC admin)
- [x] Étudiant : pages lecture seule par design (pas de boutons CRUD à gater)

---

## Étape 3 - Cohérence backend/frontend

- [x] Matrice documentée reflète `get_current_admin_user` (paramétrage, référentiel)
- [x] Matrice reflète `get_current_admin_scolarite_user` (étudiants, évaluations, stages)
- [x] Comptable : finances ✅, étudiants/stages ❌
- [ ] Revue systématique composants restants (P0/P1 non cochés)

---

## Vérification non-régression

- [x] `tsc --noEmit`
- [x] Jest `rbac.test.ts` + `rbacActions.test.ts`
- [x] Parcours manuel 4 rôles démo - Cypress `rbac-actions-manual.cy.ts` (08/09/2026) : **39/39** ✅ - 0 écart RBAC réel
- [x] Cypress `parametrage.cy.ts` - smoke 8 pages + API (08/09/2026)
- [x] Cypress `administration.cy.ts` - bandeaux Phase 2 (08/09/2026)
- [x] Cypress `utilisateurs.cy.ts` - page + API superuser + blocage scolarité (09/09/2026)

### Résultats parcours manuel (08/09/2026 - consolidé)

Comptes : `admin@gestsco.com` (→ **superadmin**), `scolarite@gestsco.com`, `e2e-teacher@example.com`, `e2e-manual@example.com`.

| Module | Superadmin | Scolarité | Enseignant | Étudiant |
|--------|------------|-----------|------------|----------|
| Référentiel | ✅ Créer ; edit/delete si ligne | ✅ Route bloquée | ✅ Admin refusé | ✅ Admin refusé |
| Param. (années/barèmes/pays) | ✅ CRUD | ✅ Route bloquée | ✅ Admin refusé | ✅ Admin refusé |
| Étudiants | ✅ CRUD + **Exporter** | ✅ CRUD + **Exporter** | ✅ Admin refusé | ✅ Admin refusé |
| Délibérations | ✅ Lancer | ✅ Lancer | ✅ Admin refusé | ✅ Admin refusé |
| Résultats | ✅ Calculer | ✅ Calculer | ✅ Portail RO | ✅ Pas Calculer |
| Notes | ✅ Enregistrer* | ✅ Enregistrer* | ✅ Enregistrer* | ✅ Pas accès admin |
| Finances TypesFrais | ✅ CRUD | ✅ CRUD | ✅ Admin refusé | ✅ Pas CRUD |
| EDT créneaux | ✅ Write | ✅ Lecture seule | ✅ Admin refusé | ✅ Admin refusé |
| EDT planning | ✅ Nouvelle séance + **export** | ✅ Nouvelle séance + **export** | ✅ Pas création/export | ✅ Pas création/export |
| Stages | ✅ Nouveau stage | ✅ Nouveau stage | ✅ Portail RO | ✅ Admin refusé |

\*Enregistrer visible après filtres session/filière/niveau/matière/type (`filtersComplete`).

**Écarts matrice RBAC** : aucune action interdite visible sur les 9 modules branchés.

### Corrections Cypress (08/09/2026)

Première passe **31/39** - 8 faux négatifs (sélecteurs, tables vides, notes sans filtres), **0 bug RBAC**. Corrections :

- Référentiel / Années / TypesFrais : helpers `ensure*Row()` - créer une ligne si table vide avant edit/delete
- Étudiants : sélecteur `button, a.btn` (Link stylé bouton pour « Nouvel étudiant »)
- Notes (×3 rôles) : remplissage filtres via API + UI avant assertion « Enregistrer »
- Login : attente explicite `POST /auth/login` + token localStorage (fiabilité superadmin)
- Seed E2E enseignant : `filiere_id` sur séances (`e2e_portail_enseignant_verify.py setup`)

**Résultat final** : **39/39** (durée ~8 min).

### Action `export` - décision d'accès

| Module | Action | Rôles autorisés | Justification |
|--------|--------|-----------------|---------------|
| `etudiants` | `export` | superadmin, admin, scolarite | Export CSV nominatif - même périmètre que CRUD étudiants (`get_current_admin_scolarite_user`) |
| `edt` | `export` | superadmin, admin, scolarite | Export Excel/PDF planning - données pédagogiques sensibles, pas enseignant/étudiant |

Composants gatés : `EtudiantsListPage` (`canExport`), `EmploiTempsPlanning` (`canExportEdt`).

**Hors scope actuel** (non branchés RBAC actions fines) : Exporter sur Factures, Paiements, Enseignants, Examens, Classement - à traiter lors du branchement de ces modules.

---

## Documentation

- [x] `07_MODULES_FONCTIONNELS.md` §11 - actions fines marquées implémentées
- [x] `11_PLAN_ACTION.md` §4.4
- [x] Cette checklist

---

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `frontend/src/utils/rbacActions.ts` | Matrice source de vérité frontend |
| `frontend/src/hooks/usePermissions.ts` | `canPerform`, `moduleActions` |
| `frontend/src/components/ui/PermissionGate.tsx` | Wrapper UI optionnel |
| `backend/app/core/permissions.py` | Autorité backend (inchangé) |

## Usage composant

```tsx
const { moduleActions } = usePermissions();
const { canCreate, canDelete } = moduleActions('etudiants');

{canCreate && <Button onClick={handleAdd}>Nouveau</Button>}

// ou
<PermissionGate module="evaluations_deliberations" action="validate">
  <Button variant="success">Valider</Button>
</PermissionGate>
```
