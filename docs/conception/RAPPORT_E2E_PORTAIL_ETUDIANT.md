# Rapport E2E - Portail Étudiant (GestSco v2)

**Date** : 07/09/2026  
**Compte test** : `e2e-manual@example.com` / `E2E-Portail-2026!`  
**Étudiant** : `E2E-MANUAL-001` (id=2), lié à User id=5 via `etudiant.user_id`

---

## Étape 1 - Compte User + backfill

| Action | Résultat |
|--------|----------|
| Étudiant choisi | `E2E-MANUAL-001` - données du chantier Évaluations (`e2e_manual_test_resultats.py`) |
| User créé | id=5, rôle `etudiant`, email `e2e-manual@example.com` |
| Backfill `--apply` | 1 lien créé : `etudiant_id=2 → user_id=5` |
| SQL confirmé | `user_id=5` sur matricule `E2E-MANUAL-001` |

**Script reproductible** :

```bash
cd backend
python scripts/e2e_portail_etudiant_verify.py setup   # User + backfill + correctifs données
python scripts/e2e_portail_etudiant_verify.py inspect # Données de référence
python scripts/e2e_portail_etudiant_verify.py api      # Parcours API post-login
```

**Correctifs données appliqués par le script setup** (legacy uniquement) :
- Migration `E2E-MANUAL-2025` → `2025-2026` si base créée avant correction du seed
- Les comptes `@test.local` sont désormais acceptés par l'API (voir bugs corrigés ci-dessous)

---

## Étape 2 - Parcours réel (navigateur Cypress + backend à jour)

**Prérequis impératif** : redémarrer le backend avec le code courant (`uvicorn app.main:app --reload`).  
Un serveur obsolète sur `:8000` (sans routes `/mes-*`) provoquait l'erreur UI *« Impossible de charger votre espace étudiant »* alors que les tests pytest passaient.

### Données de référence (base dev)

| Zone | Valeurs attendues |
|------|-------------------|
| Inscription | 2025-2026, filière_id=2, niveau_id=2, statut `en_cours` |
| Semestre 1 | moyenne **9.46**, décision `admis_avec_dette`, crédits 0/13 |
| Semestre 2 | moyenne **11.00**, décision `ajourne`, crédits 0/50 |
| Annuel | moyenne **10.23**, décision `ajourne` |
| Présences | 0 séance → taux **0.0 %** |
| Factures | 1 facture `PDF_PREVIEW_FAC-2026-00001`, 185 000 XOF, statut `partiellement_payee` |
| Compte étudiant | **404** - aucun enregistrement `comptes_etudiants` pour cet étudiant |

### Résultats par écran (backend redémarré)

| Écran | Statut | Valeurs réellement affichées |
|-------|--------|------------------------------|
| Login → `/etudiant/dashboard` | ✅ | Redirection OK, nom « Etudiant TestE2E », matricule **E2E-MANUAL-001** |
| Dashboard | ✅ | Année **2025-2026**, absences **0**, moyenne résumée **9.5/20** (arrondi UI) |
| Mes résultats | ✅ | S1 **9.46**, S2 **11.00**, annuel **10.23**, décisions `admis_avec_dette` / `ajourne` |
| Mon EDT | ✅ | Grille chargée sans erreur (filtre niveau/filière depuis inscription) |
| Ma présence | ✅ | Taux **0.0 %**, 0 séance |
| Mes factures | ✅ | 1 ligne, n° **PDF_PREVIEW_FAC-2026-00001** |
| Mon compte | ⚠️ | Message d'erreur attendu - pas de compte en base (404 API) |
| Mes paiements | ✅ | Liste vide (cohérent avec 0 paiement en base) |

**Cypress** (`cypress/e2e/portail-etudiant.cy.ts`) : **6/6** après correctifs assertions + backend à jour.

---

## Étape 3 - Vérification négative (navigateur)

| Test | Résultat |
|------|----------|
| `GET /api/v1/resultats/semestres/etudiant/3` avec token étudiant A | **403** - « Accès refusé aux données d'un autre étudiant » |
| Serveur obsolète (sans garde owner) | **200** - fuite confirmée avant redémarrage |

---

## Bugs / écarts identifiés

### 1. Email `@test.local` → login HTTP 500 - **CORRIGÉ**

**Cause** : `AuthService.login()` valide le User via `UserSchema` (Pydantic `EmailStr`) ; `.local` était rejeté par `email-validator`.  
**Correction** : validateur `EmailEtablissement` (`app/schemas/validators.py`) - format basique + domaines internes (`.local`, `.test`) autorisés pour les établissements.  
**Tests** : `test_auth.py` (login/register `@test.local`), `test_schema_validators.py`.

### 2. Année académique hors format `YYYY-YYYY` - **CORRIGÉ**

**Cause** : seed E2E utilisait `E2E-MANUAL-2025` (ORM sans validation Pydantic) ; schéma `Inscription` exige `\d{4}-\d{4}`.  
**Symptôme** : `/mes-inscription/current` → 500 ResponseValidationError.  
**Corrections** :
- Seed `e2e_manual_test_resultats.py` : code `2025-2026` dès la création
- Validation entrée déjà en place (`AnneeAcademiqueCreate`, `InscriptionCreate`)
- Réponse API : `503` explicite si données legacy invalides (`serialize_inscription`)
- Script migration : `scripts/normalize_annee_academique_legacy.py`  
**Tests** : `test_schema_validators.py`, `test_portal_access.py` (503 sur legacy).

### Dette données test - codes `E2E-COMP-*` (sans impact portail)

**Constat** (base dev, 08/09/2026) : le jeu de données **E2E-COMP** (chantier complémentaire / délibération) utilise des codes année hors format `YYYY-YYYY` :
- `annees_academiques` id=3 → `E2E-COMP-2025`, id=4 → `E2E-COMP-2026`
- `inscriptions` id=3 (étudiant `E2E-COMP-001`) → `E2E-COMP-2025`

**Décision** : **ne pas corriger** - dette de test isolée, sans impact sur le portail étudiant ni enseignant :
- Le compte E2E portail (`E2E-MANUAL-001`) est conforme (`2025-2026`)
- Le script `normalize_annee_academique_legacy.py` ne mappe que `E2E-MANUAL-2025` ; les `E2E-COMP-*` sont volontairement en **SKIP** (pas de mapping)
- Ces enregistrements ne sont consommés que par les scripts/tests du chantier COMP, pas par Cypress portail

**Si un jour le portail COMP est branché** : étendre `LEGACY_REPLACEMENTS` ou recréer le seed COMP avec des codes `YYYY-YYYY`.

### 3. Backend non redémarré (bloquant E2E navigateur)

**Symptôme** : routes `/mes-profil`, `/mes-resultats` absentes (404/422) ; garde owner inactive.  
**Mitigation** : toujours redémarrer uvicorn après merge des lots portail.

### 4. Page résultats - matière affichée par `matiere_id` (UX)

La table « Résultats par matière » affiche l'ID numérique (ex. `3`) et non le code `E2E-MANUAL-MAT-11`. Les **moyennes et décisions** sont correctes ; amélioration UI possible (libellé matière).

### 5. Mon compte - 404 (données manquantes, pas un bug portail)

Aucun `CompteEtudiant` créé pour E2E-MANUAL-001. La page affiche une erreur ; comportement attendu tant qu'aucun compte n'est seedé.

---

## Procédure de non-régression réutilisable (sous-lot C enseignant)

1. `python scripts/e2e_portail_etudiant_verify.py setup`
2. Redémarrer backend : `uvicorn app.main:app --reload --port 8000`
3. Frontend : `npm run dev` (port 3000)
4. `python scripts/e2e_portail_etudiant_verify.py api`
5. `npx cypress run --spec cypress/e2e/portail-etudiant.cy.ts`
6. Connexion manuelle : http://localhost:3000/login → compte ci-dessus

---

## Conclusion

Le portail étudiant **fonctionne de bout en bout** avec un compte réel lié, **à condition** :
- d'avoir une inscription au format année `YYYY-YYYY` (ou exécuter `normalize_annee_academique_legacy.py` sur les bases legacy) ;
- de faire tourner le **backend à jour** (routes `/mes-*` + RBAC owner).

Les emails `@test.local` / domaines internes sont acceptés pour les comptes User et étudiants.

Dette restante : seed d'un `CompteEtudiant` pour tester « Mon compte » et le relevé PDF ; affichage libellé matière dans « Mes résultats ».
