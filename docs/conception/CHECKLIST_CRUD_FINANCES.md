# Checklist - Module Finances (GestSco v2)

**Date** : 08/09/2026  
**Références** : [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §6, [CHECKLIST_PDF_REPORTLAB.md](./CHECKLIST_PDF_REPORTLAB.md)

---

## Étape 0 - Reconnaissance

| Module API | Monté | CRUD admin | Portail étudiant | RBAC |
|------------|-------|------------|------------------|------|
| `/types-frais` | ✅ | ✅ (superuser write) | - | lecture auth |
| `/frais-scolarite` | ✅ | ✅ scolarité | - | scolarité write |
| `/factures` | ✅ | ✅ + génération auto + PDF | `/mes-factures` | staff ou owner |
| `/paiements-factures` | ✅ | ✅ + valider/rejeter + reçu PDF | `/mes-paiements` | staff write ; owner read |
| `/comptes-etudiants` | ✅ | ✅ + blocage/déblocage + relevé PDF | `/mon-compte` | liste staff ; owner read |
| `/remises`, `/echeanciers` | ✅ | ✅ | - | scolarité |

**Frontend Bootstrap** : `/admin/finances/factures`, `/paiements`, `/types-frais`, `/remises`, `/echeanciers` - branchés API.

**Portail étudiant** : `/etudiant/finances/compte|factures|paiements` - lecture seule + PDF.

---

## Sous-lot A - Admin factures & paiements *(livré)*

- [x] `FacturesListPage` - liste, stats, PDF, filtres
- [x] `PaiementsListPage` - liste, modal saisie, validation, reçu PDF
- [x] `TypesFraisPage` - CRUD types de frais
- [x] `RemisesListPage` - CRUD remises (09/09/2026)
- [x] `EcheanciersListPage` - suivi échéances + refresh statuts (09/09/2026)
- [x] Services `factureService`, `paiementFactureService`, `financeService`

---

## Sous-lot B - Portail étudiant finances *(livré)*

- [x] `StudentFinancesComptePage`, `StudentFinancesFacturesPage`, `StudentFinancesPaiementsPage`
- [x] Routes `/mes-factures`, `/mes-paiements`, `/mon-compte`
- [x] `assert_etudiant_owner` sur accès par ID
- [x] Seed E2E - `e2e_portail_etudiant_verify.py setup` (facture `PDF_PREVIEW_*` + compte)

---

## Sous-lot C - RBAC durci *(livré 08/09/2026)*

- [x] `GET /factures/` et `GET /paiements-factures/` sans filtre → **403** étudiant/enseignant
- [x] `POST /paiements-factures/` → staff finances (`get_current_scolarite_user`, inclut comptable)
- [x] Filtre `facture_id` sur paiements → vérif propriétaire facture
- [x] Tests `test_finances_rbac.py` (7 tests)
- [x] Tests portail `test_portal_access.py` (isolation étudiant)

---

## Vérification non-régression

- [x] `pytest` finances RBAC - **7/7**
- [x] PDF facture/reçu/relevé - `test_pdf_generator.py`
- [x] Cypress `finances.cy.ts` - pages admin + API
- [x] Test manuel dev - `scripts/e2e_manual_test_finances.py`

---

## Sous-lot D - Dettes finances *(livré 09/09/2026)*

- [x] Génération auto facture à la validation inscription (`PATCH /inscriptions/{id}/valider`)
- [x] Service `inscription_finance_service.py` - frais filière+niveau, anti-doublon
- [x] `CompteEtudiant` - contrainte unique composite `(etudiant_id, annee_academique_id)` + migration Alembic `001_compte_etudiant_composite`
- [x] Tests `test_inscription_auto_facture.py` (2)
- [x] Cypress `finances.cy.ts` - remises + échéanciers

---

## Points de vigilance

- **Génération auto facture** : dépend des `frais_scolarite` paramétrés ; silencieuse si aucun frais (inscription validée quand même).
- **Migration CompteEtudiant** : exécuter `alembic upgrade head` sur bases existantes PostgreSQL.
- **Comptable** : accès finances via `can_access_any_etudiant` + `get_current_scolarite_user` ; pas d'accès modules pédagogiques.
