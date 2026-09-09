# Checklist - Module Stages & Soutenances (GestSco v2)

**Date vérification** : 08/09/2026  
**Spec E2E** : `frontend/cypress/e2e/stages-soutenances.cy.ts` - **8/8** ✅  
**Doc métier** : [STAGES_SOUTENANCES.md](../STAGES_SOUTENANCES.md)

## Sous-menus vérifiés

| Sous-menu | Route | Statut | Notes |
|-----------|-------|--------|-------|
| Liste stages | `/admin/stages` | ✅ | API `GET /stages`, stats, filtres, RBAC create |
| Nouveau stage | `/admin/stages/nouveau` | ✅ | Wizard `FormStage` 4 étapes → `POST /stages` |
| Fiche stage | `/admin/stages/:id` | ✅ | Infos, évaluation, programmation soutenance |
| Soutenances | `/admin/soutenances` | ✅ | Liste, à venir, calendrier `CalendrierSoutenances` |

## RBAC

- **Admin / scolarité / superuser** : accès complet module stages & soutenances
- **Comptable / enseignant / étudiant** : refus 403 sur endpoints admin (`test_stages_rbac.py`)
- **Portail enseignant** : `GET /stages/mes-stages-encadres` (filtre encadrant)

## Bugs corrigés (08/09/2026)

1. **Navigation cassée** : liens `/stages/...` au lieu de `/admin/stages/...` → corrigé sur toutes les pages
2. **Route création absente** : bouton « Nouveau stage » → 404 → `NouveauStagePage` + route `stages/nouveau`
3. **Calendrier mocké** : placeholder remplacé par composant `CalendrierSoutenances`
4. **FormStage incomplet** : champs obligatoires `matiere_id` et `annee_academique_id` ajoutés (requis API)
5. **GET /soutenances/a-venir → 422** : route capturée par `/{id}` → routes statiques déplacées avant paramètre
6. **Dettes UI** : fiche enrichie (noms), sélecteurs jury, bouton PV, portail étudiant `/etudiant/stages`

## Dettes connues

_Aucune dette documentée pour ce lot - voir améliorations futures ci-dessous._

### Améliorations futures

- Liste admin stages : colonne étudiant enrichie (nom au lieu de `#id`)
- PDF PV : fichier réel (générateur ReportLab) vs URL placeholder

## Tests

```bash
cd backend
python -m pytest tests/test_stages_rbac.py -q

cd frontend
npx cypress run --spec cypress/e2e/stages-soutenances.cy.ts
```

Compte : `admin@gestsco.com` / `Admin@123`
