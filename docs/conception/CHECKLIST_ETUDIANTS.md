# Checklist - Module Étudiants (GestSco v2)

**Date vérification** : 08/09/2026  
**Spec E2E** : `frontend/cypress/e2e/etudiants.cy.ts` - **12/12** ✅

## Sous-menus vérifiés

| Sous-menu | Route | Statut | Notes |
|-----------|-------|--------|-------|
| Liste des étudiants | `/admin/etudiants` | ✅ | CRUD liste, export RBAC, recherche, lien édition |
| Nouvel étudiant | `/admin/etudiants/nouveau` | ✅ | Wizard 3 étapes → API étudiant + inscription |
| Fiche / édition | `/admin/etudiants/:id`, `/edit` | ✅ | Notes/paiements API, formulaire modification |
| Inscriptions | `/admin/etudiants/inscriptions` | ✅ | Liste + validation (après fix legacy année) |
| Inscription groupe | `/admin/etudiants/inscription-groupe` | ✅ | Import CSV + template |
| Inscriptions matières | `/admin/etudiants/inscriptions-matieres` | ✅ | Sélection inscription + matières |
| Réinscriptions | `/admin/etudiants/reinscriptions` | ✅ | Décision LMD + création inscription |
| Dossiers administratifs | `/admin/etudiants/dossiers` | ✅ | Complétude documents |

## RBAC

- **Scolarité / admin** : accès complet module étudiants
- **Enseignant / étudiant** : pas d'accès admin étudiants

## Bugs corrigés (08/09/2026)

1. **GET /inscriptions → 503** : codes année legacy (`E2E-COMP-2025`, etc.) faisaient échouer toute la liste → coercion en lecture dans `inscription_response.py`
2. **Lien `/edit` cassé** : route inexistante → `EditEtudiantPage` + crayon/liste et bouton Modifier
3. **Cypress `etudiants.cy.ts`** : réécrit (sélecteurs `h2`, `a.btn`, wizard réel)
4. **Notes/paiements mockés** : `EtudiantDetailsPage` branché sur relevé notes, factures et paiements API

## Dettes connues

- Normalisation DB optionnelle : `python scripts/normalize_annee_academique_legacy.py --apply`

## Tests

```bash
cd backend
python -m pytest tests/test_inscription_response.py -q

cd frontend
npx cypress run --spec cypress/e2e/etudiants.cy.ts
```

Compte : `admin@gestsco.com` / `Admin@123`
