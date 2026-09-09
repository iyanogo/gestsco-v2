# Checklist - Module Administration (GestSco v2)

**Date** : 09/09/2026  
**Statut global** : **Phase 1 ✅ terminée** · **Phase 2 🔶 largement livrée** (reste matrice éditable, cron, doc prod)

**Références** : [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §9, [CHECKLIST_ADMINISTRATION_PARAMETRAGE.md](./CHECKLIST_ADMINISTRATION_PARAMETRAGE.md)

---

## Phase 1 - Terminée ✅

| Livrable | Fichiers / routes | Statut |
|----------|-------------------|--------|
| RBAC navigation & routes | `rbac.ts`, `usePermissions`, `menuConfig`, `ProtectedRoute` | ✅ |
| RBAC backend | `permissions.py`, guards FastAPI | ✅ |
| Comptes utilisateurs | `/admin/utilisateurs`, API `/users` | ✅ |
| Placeholders honnêtes (retrait mocks) | Sous-lot A - 07/09/2026 | ✅ |
| Navigation admin + matrice read-only | `AdminSectionNav`, `RbacMatrixViewer` - 09/09/2026 | ✅ |

---

## Phase 2 - État doc vs code (09/09/2026)

| Item Phase 2 | Doc initiale | Code actuel | UI Bootstrap | Tests | Reste à faire |
|--------------|--------------|-------------|--------------|-------|---------------|
| **API logs système** | ❌ planifié | ✅ + `POST /logs/purge` (rétention) | ✅ `LogsPage` + modal purge `PURGER` | ✅ `test_administration.py` | Filtres date avancés, purge planifiée (cron) |
| **API sauvegardes** | ❌ planifié | ✅ + `POST /backups/{id}/restore` (`psql`) | ✅ `BackupPage` restore + download | ✅ purge/restore tests | Planification auto, chiffrement |
| **API audit trail** | ❌ planifié | ✅ + `POST /audit/purge` | ✅ `AuditPage` + filtres + purge | ✅ snapshots + intégration param | Voir couverture hooks ci-dessous |
| **Hooks audit CRUD** | ❌ planifié | ✅ quasi-complet (CRUD + transitions + exports PDF) | - | 🔶 partiel | tests d'intégration par parcours |
| **Résumé permissions API** | ❌ | ✅ `GET /permissions/summary` | ✅ compteurs PermissionsPage | ✅ | - |
| **Matrice RBAC via API** | ❌ | ✅ `GET /permissions/matrix` | ✅ `RbacMatrixViewer` (repli frontend) | ✅ | - |
| **Matrice permissions éditable** | ❌ planifié | ✅ BDD + API + `rbac_resolver.py` | ✅ édition checkboxes | ✅ | ✅ endpoints métier branchés (sauf module Administration) |
| **Migration BDD admin** | - | ✅ `002_administration_tables.py` | - | ✅ rollback script | Appliquer en prod si pas fait |

**Accès** : menu + routes Administration = **superadmin uniquement** (`superuserOnly`, `canAccessPath`).

---

## Pages Administration - statut UI

| Page | Route | API | Statut |
|------|-------|-----|--------|
| Logs système | `/admin/administration/logs` | ✅ | Données réelles + purge rétention |
| Sauvegardes | `/admin/administration/backup` | ✅ | Données réelles (`pg_dump` / `psql`) + restauration |
| Permissions | `/admin/administration/permissions` | ✅ | Matrice éditable + résumé comptes |
| Audit trail | `/admin/administration/audit` | ✅ | Données réelles |

---

## Couverture audit trail (hooks `audit_and_commit` / `audit_calculate`)

### ✅ Modules audités

| Domaine | Endpoints / fichiers |
|---------|----------------------|
| Auth & comptes | `auth.py` (login), `users.py` |
| Inscriptions | `inscriptions.py`, `inscriptions_matieres.py`, `campagnes_inscription.py`, `dossiers_candidature.py`, `inscription_groupe.py`, `pieces_jointes.py` |
| Étudiants | `etudiants.py` |
| Finances | `factures.py`, `paiements_factures.py`, `remises.py`, `types_frais.py`, `echeanciers.py`, `frais_scolarite.py`, `comptes_etudiants.py`, `paiements.py` |
| Évaluations | `notes.py`, `examens.py`, `deliberations.py`, `resultats.py` (calculate) |
| Paramétrage | `parametres.py`, `configurations.py`, `baremes.py`, `templates.py`, `regles_calcul.py`, `modeles_communication.py`, `pays.py`, `configurations_deliberation.py` |
| Présences | `presences.py` |
| Stages | `stages.py` |
| Référentiel | `filieres.py`, `niveaux.py`, `matieres.py`, `departements.py`, `universites.py`, `cycles.py`, `etablissements.py`, `modules.py` |
| Documents | `documents_etudiant.py` |
| Emploi du temps | `seances.py`, `reservations_salles.py`, `emplois_temps.py`, `salles.py`, `batiments.py`, `creneaux_horaires.py` |
| Soutenances | `soutenances.py` |
| Sessions examen | `sessions_examen.py` |
| Années & modules | `annees_scolaires.py`, `annees_academiques.py`, `modules_systeme.py` (activer/désactiver) |
| Documents | `bulletins.py` (export PDF), `documents_etudiant.py` |

### ❌ Modules non audités (Phase 2 restante)

| Domaine | Fichiers principaux |
|---------|---------------------|
| - | Couverture CRUD métier largement complète ; reste tests d'intégration non-régression |

---

## Tests & E2E

| Suite | Statut | Remarque |
|-------|--------|----------|
| `test_administration.py` | ✅ 18/18 | RBAC, logs, audit, backups, purge, restore, matrice éditable |
| `test_audit_snapshots.py` | ✅ | note, examen, délibération, générique |
| `test_audit_parametrage.py` | ✅ | intégration create paramètre → audit |
| Cypress `administration.cy.ts` | ✅ | 4 pages API réelles |
| Cypress `navigation.cy.ts` | ✅ | header profil contextuel |
| Tests E2E audit par module métier | ❌ | À ajouter pour non-régression hooks |

---

## RBAC dynamique - couverture `require_permission` (09/09/2026)

### ✅ Branché sur la matrice BDD

| Module RBAC | Fichiers / domaines |
|-------------|---------------------|
| `referentiel` | `filieres`, `niveaux`, `matieres`, `departements`, `universites`, `cycles`, `etablissements`, `modules`, `annees_academiques`, `annees_scolaires` |
| `parametrage` | `parametres`, `configurations`, `baremes`, `templates`, `regles_calcul`, `modeles_communication`, mutations `configurations_deliberation` |
| `utilisateurs` | `users.py` |
| `inscriptions` | `inscriptions.py`, `inscriptions_matieres`, `campagnes_inscription`, `dossiers_candidature`, `inscription_groupe`, `pieces_jointes` (validate) |
| `etudiants` | `etudiants.py`, mutations `documents_etudiant.py` |
| `evaluations_notes` | `notes.py`, `examens.py`, `sessions_examen.py` |
| `evaluations_deliberations` | `deliberations.py`, lecture `configurations_deliberation.py` |
| `evaluations_resultats` | `resultats.py` |
| `finances` | `factures`, `paiements_factures`, `remises`, `comptes_etudiants`, `echeanciers`, `paiements`, `types_frais`, `frais_scolarite` |
| `edt` | `seances`, `reservations_salles`, `presences`, `emplois_temps`, `salles`, `batiments` |
| `edt_creneaux` | `creneaux_horaires.py` |
| `stages` | `stages.py` |
| `soutenances` | `soutenances.py` |

### Frontend runtime (`usePermissions`)

| Composant | Rôle |
|-----------|------|
| `GET /api/v1/auth/permissions-matrix` | Matrice effective (tout utilisateur authentifié) |
| `rbacMatrixStore` | Chargement au login / `loadUser`, reset au logout |
| `rbacActions.ts` | Matrice runtime avec repli `STATIC_MODULE_ACTIONS` |
| `RbacMatrixViewer` | Propagation immédiate après sauvegarde (`applyRows`) |

### Exceptions volontaires

| Fichier | Garde | Raison |
|---------|-------|--------|
| `administration.py` | `get_current_superuser` | Module Administration réservé superadmin |
| `finance_access.py` | rôles codés en dur | Helper listes globales (`assert_finances_staff_list`) - complément portail étudiant |

**Navigation admin** : `canAccessPath` → `rbacPathRules.ts` (préfixe route → module×action `read`, repli `STATIC_MODULE_ACTIONS`).

**Tests RBAC** : backend 95+ (auth matrix inclus), frontend `rbacActions.test.ts` + `rbac.test.ts` - runtime matrix ✅

---

## Phase 2 restante - backlog priorisé

1. ~~**Sync frontend `usePermissions`** avec matrice BDD~~ ✅ (`GET /auth/permissions-matrix` + `rbacMatrixStore`)
2. ~~**Aligner `canAccessPath`** sur matrice module×action~~ ✅ (`rbacPathRules.ts`)
3. ~~**Étendre audit** aux modules métier~~ ✅ (finances complément, inscriptions avancées, années, bulletins export)
4. **Activer maintenance prod** : `ADMIN_MAINTENANCE_ENABLED=true` ou cron `scripts/run_administration_maintenance.py`
5. **Tests d'intégration** audit sur parcours critiques (inscription → facture, saisie notes → délibération)
6. **Documentation prod** : migrations `002` + `003`, `BACKUP_DIR`, `pg_dump` + `psql`, procédure restore

### Maintenance planifiée (livré)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `ADMIN_MAINTENANCE_ENABLED` | `false` | Boucle async au démarrage FastAPI |
| `ADMIN_MAINTENANCE_INTERVAL_HOURS` | `24` | Intervalle entre exécutions |
| `ADMIN_LOG_RETENTION_DAYS` | `90` | Purge logs |
| `ADMIN_AUDIT_RETENTION_DAYS` | `365` | Purge audit |
| `ADMIN_SCHEDULED_BACKUP_ENABLED` | `false` | Sauvegarde auto (1er superuser) |

Alternative cron : `python scripts/run_administration_maintenance.py`

---

## Points de vigilance

- **Backend reste la garantie** - la matrice éditable pilote l'UX et le resolver ; les gardes FastAPI appliquent les droits sur chaque endpoint.
- **Comptes réels** : gestion via `/admin/utilisateurs`, pas via PermissionsPage.
- **`PlannedFeatureBanner`** retiré des 4 pages - ne pas le réintroduire sans raison.
