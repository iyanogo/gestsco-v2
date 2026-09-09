# Checklist - Module Documents (GestSco v2)

**Date** : 08/09/2026  
**Références** : [CHECKLIST_PDF_REPORTLAB.md](./CHECKLIST_PDF_REPORTLAB.md), [CHECKLIST_ETUDIANTS.md](./CHECKLIST_ETUDIANTS.md)

---

## Périmètre

| Zone | Backend | Admin UI | Portail |
|------|---------|----------|---------|
| **Templates HTML/PDF** | `/templates` | ✅ `TemplatesListPage` | - |
| **Documents administratifs** | `/documents-etudiant` | ✅ liste + fiche étudiant | ✅ hub + dossier |
| **Documents générés** (historique bulletins/attestations) | ❌ Phase 2 | bandeau info | via Résultats/Finances |

---

## Sous-lot A - Templates *(livré 07/09/2026)*

- [x] CRUD templates + preview HTML + export PDF
- [x] RBAC écriture superuser ; tests `test_templates_crud.py`, `test_pdf_generator.py`

---

## Sous-lot B - Documents administratifs *(livré 08/09/2026)*

- [x] CRUD `/documents-etudiant` - métadonnées + statut (en_attente / valide / refuse)
- [x] Fiche étudiant - composant `DocumentsList` (validation/refus scolarité)
- [x] Admin - `DocumentsListPage` liste globale dossiers déposés
- [x] Portail - `GET /mes-documents` + `StudentDossierAdministratifPage`
- [x] RBAC - listes globales staff ; étudiant owner only ; `test_documents_rbac.py`

---

## Sous-lot C - Portails hub documents *(livré)*

- [x] `/etudiant/documents` - hub liens rapides (bulletins, relevés, finances, dossier…)
- [x] `/enseignant/documents` - hub ressources pédagogiques
- [x] Cypress portail + `documents.cy.ts` admin

---

## Vérification

- [x] `pytest` documents RBAC - **6/6**
- [x] Templates + PDF - tests existants
- [ ] Historique documents générés - **Phase 2** (API dédiée à concevoir)

---

## Points de vigilance

- Upload fichier réel (storage S3/local) - métadonnées `fichier_url` seulement aujourd'hui
- Distinction claire : **dossier administratif** ≠ **document généré** (bulletin PDF)
