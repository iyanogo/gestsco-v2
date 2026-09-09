# Checklist - Branchement CRUD Réinscriptions / Inscription Groupe (GestSco v2)

**Date** : 07/09/2026  
**Suite de** : [CHECKLIST_CRUD_ETUDIANTS.md](./CHECKLIST_CRUD_ETUDIANTS.md)

---

## Étape 0 - Reconnaissance

- [x] Pattern validé : `InscriptionsPage.tsx`, `NouvelEtudiantPage.tsx`
- [x] Fichiers : `ReinscriptionsPage.tsx`, `InscriptionGroupePage.tsx`
- [x] Service : `inscriptionGroupeService.ts` (existant)
- [x] Backend : `inscription_groupe.py` (`POST /upload`, `GET /template`)
- [x] Réinscription : pas d'endpoint dédié → `POST /inscriptions` avec `type_inscription: redoublement|nouvelle`
- [ ] Test manuel Swagger

---

## Étape 1 - Réinscriptions

- [x] Liste élégibles : étudiants avec inscription année précédente, sans inscription année active
- [x] Action réinscription via `createInscription`
- [x] Blocage si année non `ouverte`
- [x] Gestion erreurs (doublon, année fermée)
- [x] Refresh après action
- [x] Passage de niveau via `ResultatAnnuel` validé (`decision`, `passage_niveau_superieur`, `is_valide`) - repli heuristique si absent

---

## Étape 2 - Inscription groupe

- [x] Upload Excel sur `/inscription-groupe/upload`
- [x] Rapport backend (total, success, errors, created_students)
- [x] Validation format (.xlsx/.xls) et taille (10 Mo front)
- [x] Indicateur chargement pendant import
- [x] Téléchargement modèle CSV

---

## Étape 3 - Vérification

- [x] Pages étudiants précédentes non modifiées
- [ ] Flux E2E manuel
- [x] `tsc --noEmit`
- [x] Test Jest minimal `ReinscriptionsPage`

---

## Étape 4 - Documentation

- [x] `00_AUDIT_COMPLET.md` §5
- [x] `05_FRONTEND_UI.md` §10
- [x] `11_PLAN_ACTION.md` §4.1
- [x] Ce fichier créé

---

## Points de vigilance

- Validation année académique backend : vérifier côté API (front bloque si statut ≠ ouverte)
- RBAC : endpoints protégés scolarité ; navigation filtrée
- Upload groupe : validation type côté backend (.xlsx/.xls) ; taille à renforcer backend si besoin
