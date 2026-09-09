# Checklist - Backfill etudiant.user_id (GestSco v2)

**Date** : 07/09/2026  
**Statut** : script livré - dry-run validé sur base dev

**Contexte** : la migration `002_add_etudiant_user_id.py` ajoute la FK mais ne lie aucun compte existant. Tant que ce backfill n'est pas fait, le portail étudiant branché au sous-lot A est invisible pour tout compte réel/existant.

**Objectif** : script de rattachement `User.email == Etudiant.email`, sûr et rejouable, avec rapport clair des cas ambigus ou non résolus.

---

## Étape 0 - Reconnaissance

- [x] Confirmer que `etudiant.email` et `users.email` sont comparables via normalisation (lowercase, trim) - `normalize_email()` dans `app/utils/etudiant_user_link.py`
- [x] Cas problématiques identifiés et gérés dans le script :
  - User sans Etudiant correspondant → ignoré (normal pour admin/scolarité/enseignant)
  - Etudiant sans User → rapport `no_user_found`
  - Email en double côté Etudiant → rapport `duplicate_etudiant_email`
  - Etudiant avec `user_id` déjà renseigné → ignoré (`already_linked`, jamais écrasé)
  - Plusieurs User pour le même email → rapport `ambiguous_user`
  - User déjà lié à un autre Etudiant → rapport `user_already_taken`

## Étape 1 - Script de backfill

- [x] `backend/scripts/backfill_etudiant_user_id.py` (+ logique `app/utils/etudiant_user_link.py`)
- [x] Logique : Etudiant sans `user_id` → User email normalisé → lien si non ambigu
- [x] `--dry-run` par défaut ; `--apply` pour écriture réelle ; `--limit N` optionnel
- [x] Rapport : liens créés/prévus, sans compte, ambigus, déjà liés
- [x] Vérification préalable : colonne `user_id` présente (sinon message `alembic upgrade head`)

## Étape 2 - Exécution

- [x] Dry-run sur base dev (`gestscov2`) - **0 lien prévu**, 2 étudiants E2E sans compte User (`e2e-manual@test.local`, `e2e-comp@test.local`)
- [x] `--apply` exécuté pour `E2E-MANUAL-001` → User id=5 (`e2e-manual@example.com`)
- [x] Vérification SQL post-apply (`user_id=5` sur matricule `E2E-MANUAL-001`)

## Étape 3 - Vérification fonctionnelle

- [x] Test manuel portail - Cypress 6/6 + rapport [RAPPORT_E2E_PORTAIL_ETUDIANT.md](./RAPPORT_E2E_PORTAIL_ETUDIANT.md)
- [x] `pytest` : `test_backfill_etudiant_user_id.py` + `test_portal_access.py` au vert

## Documentation

- [x] README backend - section post-migration backfill
- [x] `docs/conception/11_PLAN_ACTION.md` - référence migration 002 + backfill
- [x] `CHECKLIST_PORTAILS_ENSEIGNANT_ETUDIANT.md` - note ops
- [x] Procédure cas non résolus documentée dans le rapport script + README

---

## Point de vigilance

- **Ce script devra être réexécuté** (ou intégré à l'onboarding) à chaque création d'étudiant + compte User **après coup**, tant qu'aucune liaison automatique n'existe à la création du compte.
- Le repli runtime `resolve_etudiant_id()` (matching email sans FK) reste actif mais **le backfill FK est la source de vérité** pour la prod.

## Commandes

```bash
cd backend
alembic upgrade head
python scripts/backfill_etudiant_user_id.py          # dry-run
python scripts/backfill_etudiant_user_id.py --apply  # écriture
```
