# Checklist - Référentiel LMD (GestSco v2)

**Date vérification** : 08/09/2026  
**Spec E2E** : `frontend/cypress/e2e/referentiel.cy.ts` - **9/9** ✅

## Sous-menus vérifiés

| Sous-menu | Route | CRUD UI | API | Notes |
|-----------|-------|---------|-----|-------|
| Universités | `/admin/referentiel/universites` | ✅ | ✅ | - |
| Établissements | `/admin/referentiel/etablissements` | ✅ | ✅ | Lié université |
| Départements | `/admin/referentiel/departements` | ✅ | ✅ | Lié établissement |
| Cycles | `/admin/referentiel/cycles` | ✅ | ✅ | Autonome |
| Filières | `/admin/referentiel/filieres` | ✅ | ✅ | Lié établissement |
| Niveaux | `/admin/referentiel/niveaux` | ✅ | ✅ | Autonome |
| Modules | `/admin/referentiel/modules` | ✅ | ✅ | Lié filière |
| Matières | `/admin/referentiel/matieres` | ✅ | ✅ | Lié module |
| Salles | `/admin/emploi-temps/salles` | - | ✅ | Hors CRUD générique (module EDT) |

## RBAC

- Menu référentiel : **superadmin / admin** uniquement
- Scolarité : route bloquée (test Cypress #9)

## Bugs corrigés (08/09/2026)

1. **Filières POST → 500** : endpoint exigeait `departement_id` / `cycle_id` absents du modèle → aligné sur `etablissement_id`
2. **Niveaux POST → 400** : validation `cycle_id` obligatoire alors que le schéma/table n'en a pas → supprimée
3. **Cypress `cy.login`** : mot de passe par défaut corrigé (`Admin@123`)
4. **Cypress `referentiel.cy.ts`** : réécrit (sélecteurs labels, hiérarchie réelle)

## Tests automatisés

```bash
# Backend
cd backend
python -m pytest tests/test_api_universites.py tests/test_api_filieres.py tests/test_api_niveaux.py -q

# Frontend E2E
cd frontend
npx cypress run --spec cypress/e2e/referentiel.cy.ts
```

## Prérequis manuel

Compte : `admin@gestsco.com` / `Admin@123` (superuser requis pour écriture API).
