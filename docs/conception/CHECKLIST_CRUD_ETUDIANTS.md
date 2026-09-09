# Checklist - Branchement CRUD Étudiants / Inscriptions (GestSco v2)

**Date** : 07/09/2026  
**Références** : [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5, [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10

---

## Étape 0 - Reconnaissance

- [x] Lire l'audit §5 et le frontend UI §10
- [x] Modèle de pattern : `frontend/src/pages/bootstrap/etudiants/EtudiantsListPage.tsx`
- [x] Fichiers concernés identifiés :
  - `NouvelEtudiantPage.tsx` - création étudiant + inscription + docs
  - `InscriptionsPage.tsx` - liste / valider / annuler
  - `DossiersPage.tsx` - documents administratifs (`documents-etudiant`)
  - `EtudiantDetailsPage.tsx` - fiche détail
  - Encore mock : `ReinscriptionsPage.tsx`, `InscriptionGroupePage.tsx`
- [x] Services : `etudiantService.ts`, `inscriptionService.ts`, `documentEtudiantService.ts`
- [x] Endpoints backend confirmés : `etudiants.py`, `inscriptions.py`, `documents_etudiant.py`
- [ ] Test manuel Swagger - à faire par l'équipe si backend non démarré localement

---

## Étape 1 - Création d'étudiant

- [x] Formulaire localisé (`NouvelEtudiantPage.tsx`)
- [x] Appel `POST /api/v1/etudiants` via `createEtudiant`
- [x] Inscription associée via `createInscription`
- [x] Métadonnées documents (max 2 Mo, types contrôlés)
- [x] Gestion erreurs (`handleApiError` + parsing 422)
- [x] État chargement + redirection vers fiche étudiant

---

## Étape 2 - Inscriptions

- [x] `InscriptionsPage.tsx` - `GET /api/v1/inscriptions`
- [x] Validation / annulation (`validerInscription`, `annulerInscription`)
- [x] `inscriptions-matieres` - branché (voir [CHECKLIST_CRUD_INSCRIPTIONS_MATIERES.md](./CHECKLIST_CRUD_INSCRIPTIONS_MATIERES.md))
- [x] `ReinscriptionsPage`, `InscriptionGroupePage` - branchés API (voir [CHECKLIST_CRUD_REINSCRIPTIONS.md](./CHECKLIST_CRUD_REINSCRIPTIONS.md))

---

## Étape 3 - Dossiers étudiant

- [x] Clarification : **documents administratifs** (`documents_etudiant`), pas `dossiers_candidature`
- [x] Liste + ajout/suppression métadonnées via API
- [x] Validation taille/type côté front (upload binaire non exposé backend)

---

## Étape 4 - Vérification non-régression

- [x] Liste + suppression étudiants inchangées (`EtudiantListPage`)
- [ ] Flux E2E manuel : créer → inscrire → consulter dossier
- [x] TypeScript : corrections appliquées (input file, types Filiere/Niveau)
- [ ] Tests Jest supplémentaires pour nouvelles pages (MSW)

---

## Étape 5 - Documentation

- [x] Matrice `00_AUDIT_COMPLET.md` §5 mise à jour
- [x] `05_FRONTEND_UI.md` §10 mise à jour
- [x] `11_PLAN_ACTION.md` §4.1 - étudiants coché

---

## Points de vigilance

- Auth : endpoints protégés via `deps.py` / scolarité - cohérent avec login Bootstrap demo
- Pas de migration Alembic : aucun changement modèle SQLAlchemy
- RBAC : navigation filtrée ; actions CRUD par bouton non restreintes individuellement
- Upload : métadonnées seulement tant que le backend n'expose pas de stockage fichier
