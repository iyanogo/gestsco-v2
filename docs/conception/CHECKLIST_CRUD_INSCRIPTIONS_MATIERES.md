# Checklist - Branchement CRUD Inscriptions-Matières (GestSco v2)

**Date** : 07/09/2026  
**Suite de** : [CHECKLIST_CRUD_ETUDIANTS.md](./CHECKLIST_CRUD_ETUDIANTS.md), [CHECKLIST_CRUD_REINSCRIPTIONS.md](./CHECKLIST_CRUD_REINSCRIPTIONS.md)

---

## Étape 0 - Reconnaissance

- [x] Page créée : `InscriptionsMatieresPage.tsx` (n'existait pas auparavant)
- [x] Service : fonctions dans `inscriptionService.ts` (`getMatieresByInscription`, `bulkCreateInscriptionMatieres`, `deleteInscriptionMatiere`)
- [x] Backend : `inscriptions_matieres.py` (GET par inscription, POST, POST bulk, DELETE)
- [x] Modèle : `inscription_id` + `matiere_id` + `semestre` (1 ou 2) - `Matiere.credit` + `obligatoire` ajoutés (07/09/2026)
- [x] Filtrage matières via modules liés à la filière de l'inscription
- [ ] Test manuel Swagger

---

## Étape 1 - Affichage

- [x] Liste matières filtrées par filière (via modules)
- [ ] Matières obligatoires - non modélisées en base (non implémenté)
- [x] Volume indicatif (somme TPE) avec cible LMD 30 ECTS affichée en info

---

## Étape 2 - Sélection et validation

- [x] Enregistrement via bulk create + suppressions individuelles (diff)
- [ ] Quota ECTS strict - non modélisé ; info seulement
- [x] Matières en dette pré-sélectionnées via `resultatService.getResultatsMatieres` (si API disponible)
- [x] Blocage si année non `ouverte`
- [x] Message succès après enregistrement

---

## Étape 3 - Vérification

- [ ] Flux E2E manuel
- [x] `tsc --noEmit`
- [x] Test Jest minimal
- [x] Route + menu ajoutés

---

## Étape 4 - Documentation

- [x] `00_AUDIT_COMPLET.md` §5
- [x] `05_FRONTEND_UI.md` §10
- [x] `11_PLAN_ACTION.md` §4.1
- [x] Ce fichier

---

## Périmètre

- **Admin/Scolarité uniquement** - portail étudiant non concerné pour l'instant
- Quota ECTS / obligatoires / délibérations : heuristique temporaire, signalée dans l'UI
