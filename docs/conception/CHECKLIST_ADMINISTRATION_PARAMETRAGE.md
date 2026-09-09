# Checklist - Branchement CRUD Administration & Paramétrage (GestSco v2)

**Date reconnaissance** : 07/09/2026  
**Statut chantier** : **terminé** (sous-lots A → D livrés le 07/09/2026)
**Références** : [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §9, [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5, [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10

**Décisions validées** :
- Découpage sous-lots **A → B → C → D** confirmé.
- Durcissement RBAC backend (sous-lot B) : écriture **superuser** sur `/parametres`, `/configurations`, `/baremes`, `/templates`, `/regles-calcul`, `/modeles-communication` - lecture ouverte à tout utilisateur authentifié (pattern EDT/Stages).

---

## Point de décision (Étape 0)

### Le backend est-il prêt ?

**Oui, largement** pour le paramétrage CRUD. Neuf modules API montés ; le chantier est surtout **branchement UI Bootstrap** + `userService.ts` + alignement schémas + durcissement RBAC/tests.

| Module API | Monté | CRUD | RBAC écriture (actuel) | Tests auto |
|------------|-------|------|------------------------|------------|
| `/parametres` | ✅ | ✅ + init défaut | create/delete/init → **superuser** ; update valeur → auth + `est_modifiable` | ❌ |
| `/configurations` | ✅ | ✅ + logo upload | delete → superuser ; reste → **tout auth** | ❌ |
| `/baremes` | ✅ | ✅ + mentions | **tout auth** | ❌ |
| `/templates` | ✅ | ✅ + preview HTML | init → superuser ; reste → **tout auth** | ❌ |
| `/regles-calcul` | ✅ | ✅ + test règle | **tout auth** | ❌ |
| `/modeles-communication` | ✅ | ✅ emails + SMS | **tout auth** | ❌ |
| `/pays` | ✅ | ✅ + init | **tout auth** | ❌ |
| `/users` | ✅ | ✅ | CRUD **superuser** ; `GET /users/select` **scolarité+** | ✅ `test_users_rbac.py` (12) |
| `/modules-systeme` | ✅ | lecture + activer/désactiver | activer/désactiver → **admin** | ❌ |
| `/annees-scolaires` | ✅ | ✅ + `/activate` | **superuser** | ❌ |

**Hors périmètre (déjà traité ailleurs)**
- `/configurations-deliberation` → chantier Évaluations
- `/annees-academiques` (LMD) → `GestionAnneesPage` déjà branchée API (`/admin/gestion-annees`)

**Sans API backend (placeholders purs)**
- Logs système, sauvegardes, audit trail, matrice permissions granulaires → §9 « Logs (UI placeholder) »

### Lacunes / écarts identifiés

1. ~~**Frontend Bootstrap = 100 % mock**~~ - **corrigé** (paramétrage, utilisateurs, administration branchés ou placeholders honnêtes ; voir sous-lots A-D).
2. **Stack MUI legacy déjà branchée API** - composants réutilisables dans `frontend/src/components/parametrage/` :
   - `ParametresList`, `ConfigurationForm`, `BaremesList`, `TemplateEditor`, `PaysConfigList`
3. **Services frontend complets** sauf `userService.ts` ; pas de pages MUI pour `regleCalculService` ni `modeleCommunicationService`.
4. **Écarts schéma bloquants** :
   - `AnneesScolairesPage` : `dateDebut`/`dateFin`/`estActive`/`estCloturee` → API : `statut`, `etat`, `lier_enseignement` (pas de dates)
   - `UtilisateursListPage` : `nom`/`prenom` → API : `full_name`, `role`, `is_superuser`, `is_active`
   - `ParametresGenerauxPage` : formulaire monolithique fictif → séparer `/parametres` + `/configurations`
5. **Export PDF templates** : preview HTML ✅ ; export PDF ✅ (`weasyprint` prod / `xhtml2pdf` fallback dev)
6. **RBAC backend faible** sur 6 modules paramétrage (écriture = tout auth) → durcissement prévu sous-lot B
7. **`GestionModulesPage`** : déjà API-ready, route `/admin/gestion-modules` absente du menu
8. **`useModulesActifs.ts`** : encore mock alors que l'API modules existe
9. **Zéro test** dédié paramétrage / annees-scolaires / modules-systeme

### Pages Bootstrap vs MUI (inventaire)

| Page Bootstrap (menu) | État | Réutilisation MUI |
|----------------------|------|-------------------|
| `ParametresGenerauxPage` | ❌ mock | `ParametresList` + `ConfigurationForm` |
| `AnneesScolairesPage` | ❌ mock | Bootstrap natif + `anneeScolaireService` |
| `UtilisateursListPage` | ❌ mock | Bootstrap natif + `userService` (à créer) |
| `TemplatesListPage` | ✅ API | `TemplatesManagement` + `TemplateEditor` |
| `DocumentsListPage` | ❌ mock | Pas d'API documents générés |
| Administration (×4) | ✅ placeholder | Bandeau Phase 2 - pas d'API (sous-lot D) |
| `GestionAnneesPage` | ✅ API | Déjà livré (LMD) |
| `GestionModulesPage` | ✅ API | Déjà livré (menu sous-lot B) |

---

## Découpage proposé (sous-lots)

### Sous-lot A - Fondations paramétrage *(livré 07/09/2026)*

**Objectif** : remplacer les 2 pages visibles sous « Paramétrage ».

- [x] Brancher `ParametresGenerauxPage` via `ParametrageGenerauxManagement` :
  - Onglet système → `ParametresList` + `parametreService.getParCategorie()`
  - Onglet établissement → `ConfigurationForm` + `configurationService` (sélection `etablissement_id`)
  - Supprimer onglets fictifs (académique, notifications, sécurité)
- [x] Brancher `AnneesScolairesPage` sur `anneeScolaireService` (CRUD + activate)
- [x] Aligner colonnes/formulaire : `statut` ↔ badge « Active », `etat` ↔ clôture
- [x] Lien menu vers `GestionAnneesPage` (années LMD, déjà API)
- [x] Tests : `tests/test_annees_scolaires_rbac.py`
- [x] Tests frontend smoke : `ParametresGenerauxPage`, `AnneesScolairesPage`

#### Vérification non-régression (sous-lot A)

- [x] Modules précédents OK (EDT, évaluations, inscriptions…)
- [x] `tsc --noEmit`
- [x] `pytest` au vert (`test_annees_scolaires_rbac.py` - 7 tests)

#### Documentation (sous-lot A)

- [x] [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5
- [x] [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.1

---

### Sous-lot B - Utilisateurs & modules système *(livré 07/09/2026)*

**Objectif** : administration des comptes et activation fonctionnelle.

- [x] Créer `userService.ts` (`GET/POST/PUT/DELETE /users`)
- [x] Brancher `UtilisateursListPage` : mapper `full_name`, rôles API ↔ badges, `is_superuser`, `is_active`
- [x] Modal changement mot de passe + alerte P0 comptes seed (`admin@gestsco.com`, etc.)
- [x] Exposer `GestionModulesPage` dans le menu (`/admin/gestion-modules`)
- [x] Fix `useModulesActifs.ts` → `moduleSystemeService.getModulesActifs()`
- [x] **Durcissement RBAC backend** : `get_current_superuser` sur écriture `/parametres`, `/configurations`, `/baremes`, `/templates`, `/regles-calcul`, `/modeles-communication` ; lecture → `get_current_active_user`
- [x] `UserCreate` étendu (`role`, `is_active`, `is_superuser`) + garde dernier superuser
- [x] Tests : `test_users_rbac.py` (12), `test_parametrage_rbac.py` (27), `test_modules_systeme_rbac.py` (6)

#### Vérification non-régression (sous-lot B)

- [x] Sous-lot A OK
- [x] `tsc --noEmit`
- [x] `pytest` au vert (43 tests RBAC sous-lot B)

#### Documentation (sous-lot B)

- [x] [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5
- [x] [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.1

---

### Sous-lot C - Documents & paramétrage avancé *(livré 07/09/2026)*

**Objectif** : templates (menu Documents) + modules paramétrage sans page Bootstrap.

- [x] Brancher `TemplatesListPage` via `TemplatesManagement` + `TemplateEditor` + `templateService`
- [x] Preview HTML in-app ; export PDF ✅ (07/09/2026 - chantier reportlab)
- [x] Fix mapping `en_tete_html` : attribut ORM aligné sur schéma/API (colonne DB `entete_html` - pas de migration)
- [x] Pages Bootstrap sous-menu Paramétrage : barèmes, pays, règles calcul, modèles email/SMS
- [x] `DocumentsListPage` : badge « à venir » (pas d'API)
- [x] Tests : `test_templates_crud.py` (3), RBAC template réactivé ; smoke `TemplatesListPage`, `BaremesPage`

#### Vérification non-régression (sous-lot C)

- [x] Sous-lots A + B OK
- [x] `tsc --noEmit`
- [x] `pytest` au vert (46 tests RBAC + CRUD sous-lot C)

#### Documentation (sous-lot C)

- [x] [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5
- [x] [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.1

---

### Sous-lot D - Administration placeholder *(livré 07/09/2026)*

**Objectif** : traiter honnêtement ce qui n'a pas d'API.

- [x] Bandeau visible `PlannedFeatureBanner` sur logs / backup / audit / permissions
- [x] Suppression des maquettes mock trompeuses (tables, boutons fictifs)
- [x] Docs : administration = Phase 2 dans `07_MODULES`, `11_PLAN_ACTION`
- [x] Distinction `PermissionsPage` vs RBAC frontend (`rbac.ts`, `usePermissions.ts`) documentée in-app + docs

#### Vérification non-régression (sous-lot D)

- [x] Sous-lots A + B + C OK
- [x] `tsc --noEmit`
- [x] Smoke test `PermissionsPage.test.tsx`
- [x] Cypress `parametrage.cy.ts` - 8 pages paramétrage + API (08/09/2026)
- [x] Cypress `administration.cy.ts` - bandeaux Phase 2 (08/09/2026)
- [x] Administration sous-lot B - nav + matrice RBAC read-only - voir [CHECKLIST_ADMINISTRATION.md](./CHECKLIST_ADMINISTRATION.md) (09/09/2026)
- [x] RBAC frontend P0 paramétrage : `ReglesCalculManagement`, `ModelesCommunicationManagement`, `TemplatesManagement`, `ParametrageGenerauxManagement`, `ParametresList` (08/09/2026)
- [x] Pytest paramétrage : `test_parametrage_rbac`, `test_annees_scolaires_rbac`, `test_users_rbac`, `test_modules_systeme_rbac` - **55/55** ✅
- [x] RBAC frontend `UtilisateursListPage` - `moduleActions('utilisateurs')` (09/09/2026)
- [x] Cypress `utilisateurs.cy.ts` - smoke + RBAC API (09/09/2026)
- [x] `GET /users/select` - staff pour examens/stages (scolarité+, sans CRUD comptes) (09/09/2026)

#### Documentation (sous-lot D)

- [x] [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNALS.md) §9
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.1

---

## Étape 0 - Reconnaissance

- [x] Endpoints listés et vérifiés (`api.py` + 10 modules paramétrage/admin)
- [x] Pages Bootstrap inventoriées (mock vs API)
- [x] Composants MUI réutilisables identifiés (`components/parametrage/*`)
- [x] Services manquants identifiés (`userService.ts`)
- [x] Écarts schéma UI ↔ API documentés
- [x] Découpage sous-lots A→D proposé et validé

---

## Points de vigilance transverses

- **RBAC** : durcissement écriture superuser sous-lot B ; ne pas confondre avec matrice permissions UI (sous-lot D).
- **PDF templates** : export PDF ✅ - `weasyprint` (prod) / `xhtml2pdf` (fallback dev). Voir [CHECKLIST_PDF_REPORTLAB.md](./CHECKLIST_PDF_REPORTLAB.md).
- **Dual-stack UI** : privilégier réutilisation composants MUI `parametrage/*` + wrapper Bootstrap `PageHeader`.
- **Années scolaires vs LMD** : deux concepts distincts - ne pas fusionner les pages.
