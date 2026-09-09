# Checklist - Branchement CRUD Emploi du temps (GestSco v2)

**Date reconnaissance** : 07/09/2026  
**Références** : [07_MODULES_FONCTIONNELS.md](./07_MODULES_FONCTIONNELS.md) §5, [STAGES_SOUTENANCES.md](../STAGES_SOUTENANCES.md) (pattern RBAC)

---

## Point de décision (Étape 0)

### Le backend est-il prêt ?

**Oui, largement** - 7 modules API montés sous `/api/v1`, repositories/services complets, validation conflits salle/enseignant/niveau. Le chantier est surtout **branchement UI Bootstrap** + quelques durcissements RBAC/tests.

| Module API | Monté | CRUD | Conflits / règles | RBAC écriture |
|------------|-------|------|-------------------|---------------|
| `/batiments` | ✅ | ✅ | Unicité `code` | `get_current_scolarite_user` |
| `/salles` | ✅ | ✅ + disponibilité/occupation | Via `verifier_disponibilite_salle` | scolarité |
| `/creneaux-horaires` | ✅ | ✅ | Unicité `code`, durée auto | **`get_current_superuser` uniquement** |
| `/seances` | ✅ | ✅ + récurrente, confirmer/annuler/reporter | **`create_with_verification`** + `UniqueConstraint(date, creneau, salle)` | scolarité |
| `/emplois-temps` | ✅ | ✅ + valider/publier/archiver | Lié niveau/filière/semestre/année | scolarité |
| `/reservations-salles` | ✅ | ✅ + approuver/refuser | **`create_with_verification`** croise séances + réservations approuvées | création : tout user auth ; approbation : scolarité |
| `/presences` | ✅ | ✅ + bulk, stats, taux | `UniqueConstraint(seance, etudiant)` | scolarité **ou** enseignant titulaire (`assert_teacher_can_manage_seance_presence`) |

### Lacunes / écarts identifiés

1. ~~**Frontend Bootstrap = 100 % mock**~~ - **corrigé** (sous-lots A-D) : pages Bootstrap + composants MUI branchés API
2. ~~**Schéma UI Bootstrap ≠ API**~~ - **corrigé** sous-lot A (`libelle`, `type_salle`, `batiment_id`)
3. ~~**Pas de page Bootstrap** pour bâtiments ni créneaux horaires~~ - **corrigé** (`BatimentsListPage`, `CreneauxListPage`, menu + routes)
4. **`PUT /seances/{id}`** - corrigé sous-lot B (`update_with_verification`).
5. **`PUT /reservations-salles/{id}`** - corrigé sous-lot C (même pattern + revalidation à l'approbation).
6. **Export PDF** : endpoint présent, dépend de `reportlab` - **absent de `requirements.txt`** ; Excel via `openpyxl` ✅.
7. **`taux_presence_min`** - appliqué dans `calcul_notes.determiner_decision_matiere` (sous-lot D) si données de présence disponibles.
8. **Tests automatisés EDT** : couverture partielle (`test_emploi_temps_rbac`, `test_seances_update_conflicts`, `test_reservations_cross_conflicts`).
9. **RBAC backend** : lectures ouvertes à tout utilisateur authentifié ; à aligner progressivement (écriture admin/scolarité, lecture portails plus tard).

### Modèle de données (relations clés)

```
Batiment ──< Salle ──< Seance >── CreneauHoraire
                         │              │
                    Matiere, Niveau, Filiere, Enseignant (User)
                    annee_academique_id, semestre

EmploiTemps (niveau, filiere?, semestre, annee) - pas de FK directe vers Seance ;
  agrégation par filtres (niveau + année + semestre + plage dates)

ReservationSalle (ponctuelle, heure_debut/fin libres) - croise Seance via verifier_disponibilite_salle

Presence (seance_id, etudiant_id, statut) - feuille d'appel par séance
```

### Année académique

- **Seance** : `annee_academique_id` + `semestre` obligatoires.
- **EmploiTemps** : `annee_academique_id` + `semestre` + `date_debut`/`date_fin` ; statuts `brouillon → valide → publie → archive`.
- Le front devra réutiliser le pattern **année active** (`anneeAcademiqueService`) comme inscriptions/évaluations.

### Conflits de réservation (backend - ne pas recréer côté front)

| Mécanisme | Détail |
|-----------|--------|
| Contrainte DB | `UniqueConstraint(date_seance, creneau_id, salle_id)` sur `seances` |
| Validation création | `seance_repository.create_with_verification` : salle, enseignant, niveau/filière |
| Endpoint pré-check | `GET /seances/conflits?date=&creneau_id=&salle_id=&enseignant_id=` |
| Réservations | `verifier_disponibilite_salle` croise séances actives **et** réservations `approuvee` |
| Front existant | `SeanceForm` + `ConflitsDialog` appellent déjà `verifierConflits` |

⚠️ Chevauchement horaire **partiel** (réservation 09h-11h vs séance créneau 08h-10h) géré par comparaison d'heures dans `emploi_temps_utils.py`.

---

## Découpage proposé (sous-lots)

### Sous-lot A - Référentiel bâtiments / salles / créneaux *(livré 07/09/2026)*

**Objectif** : données réelles pour alimenter le reste.

- [x] Brancher `SallesListPage.tsx` (Bootstrap) sur `salleService` + `batimentService`
- [x] Aligner champs formulaire (`libelle`, `type_salle`, `batiment_id`, `capacite`, `equipements`)
- [x] CRUD bâtiments : `BatimentsListPage.tsx`
- [x] CRUD créneaux : `CreneauxListPage.tsx` (écriture superuser, lecture admin/scolarité)
- [x] Menu + routes `/admin/emploi-temps/batiments`, `/creneaux` ; référentiel salles → même page API
- [x] Tests RBAC : `tests/test_emploi_temps_rbac.py`
- [x] Docs §5 audit

**Réutilisation** : s'inspirer de `ReferentielCrudPage` ou wrapper `components/emploiTemps/SallesList` + `SalleForm` (MUI) en transition.

---

### Sous-lot B - Séances et grille EDT *(livré 07/09/2026)*

**Objectif** : planning hebdo réel par niveau/filière/semestre.

- [x] Brancher `EmploiTempsPage.tsx` (Bootstrap) : filtres niveau/filière/semestre/année active
- [x] Lecture : `GET /seances/semaine` + filtre client semestre/année ; export via `/emplois-temps/actif`
- [x] Création/édition : composant MUI `SeanceForm` (wrapper `EmploiTempsPlanning`)
- [x] `verifierConflits` avant submit (déjà dans `SeanceForm`)
- [x] Fix backend : `update_with_verification` sur `PUT /seances/{id}` (+ skip si type seul)
- [x] Actions confirmer / annuler / reporter branchées
- [x] Export Excel : bouton via `emploiTempsService.exportExcel` ; export PDF ✅ (`reportlab`)
- [x] Tests : `tests/test_seances_update_conflicts.py` (3 tests, dont PUT 400 conflit)
- [x] Workflow emploi du temps brouillon → valider → publier - UI `EmploiTempsPlanning` + API (08/09/2026)
- [x] RBAC écriture scolarité ; **RBAC enseignant** présences (titulaire) + réservations (demande propre) - 08/09/2026

---

### Sous-lot C - Réservations de salles *(livré 07/09/2026)*

**Objectif** : demandes ponctuelles + workflow approbation.

- [x] Brancher `ReservationsPage.tsx` (Bootstrap) via `ReservationsManagement` + composants MUI
- [x] Liste : mes réservations / toutes / en attente (`GET /en-attente`, filtre statut)
- [x] Création : `ReservationForm` + pré-check `/salles/disponibles`
- [x] Approbation/refus : scolarité via `PATCH /approuver` et `/refuser`
- [x] Fix symétrique sous-lot B : `update_with_verification` sur `PUT /reservations-salles/{id}`
- [x] Revalidation disponibilité à l'approbation (séance créée entre-temps → refus)
- [x] Tests croisés : `tests/test_reservations_cross_conflicts.py` (5 tests)
- [x] RBAC demande enseignant : création + `mes-reservations` ; liste filtrée au demandeur ; tests `test_teacher_edt_rbac.py`

---

### Sous-lot D - Présences *(livré 07/09/2026)*

**Objectif** : feuille d'appel par séance + stats + lien calcul résultats.

- [x] `get_feuille_appel_seance` : étudiants inscrits à la matière (via `InscriptionMatiere` + niveau/filière/année)
- [x] `PresencesManagement` (Bootstrap appel + statistiques) + `SaisiePresencesTable` / bulk
- [x] Stats : `/etudiant/{id}/taux`, `/absents-frequents`, historique
- [x] Modification a posteriori via bulk (upsert) ou `PUT /presences/{id}`
- [x] `taux_presence_min` appliqué dans `determiner_decision_matiere` + `calculer_resultat_matiere`
- [x] Tests : `test_presences_feuille_appel.py` (4) + `test_calcul_notes_config.py` (3 tests taux)
- [x] RBAC émargement enseignant titulaire - backend + portail + tests `test_teacher_portal_complements.py`, `test_presences_rbac.py`

**Formule taux** : `(présents + retards + absences justifiées) / séances émargées` par matière (backend uniquement).

---

## Étape 0 - Reconnaissance

- [x] Endpoints listés et vérifiés dans le code (`api.py` + 7 fichiers endpoints)
- [x] Pages Bootstrap : `presences/*` branchées API (`PresencesManagement`)
- [x] Services frontend : **7 services complets** (`batiment`, `salle`, `creneau`, `seance`, `emploiTemps`, `reservation`, `presence`)
- [x] Modèle SQLAlchemy : relations Seance ↔ Matiere/Enseignant/Salle/Créneau/Niveau/Filière/Année
- [x] Conflits : contrainte unique + validation repository + utils croisés séances/réservations
- [x] Lien année académique : confirmé sur Seance et EmploiTemps
- [x] Découpage sous-lots A→D proposé

---

## Vérification non-régression (chaque sous-lot)

- [x] Modules précédents OK (sous-lot D)
- [x] `tsc --noEmit`
- [x] `pytest` au vert (19+ tests EDT : RBAC, conflits, workflow, enseignant)
- [x] Cypress `emploi-temps.cy.ts` - **8/8**
- [x] Test manuel conflit salle/créneau - `scripts/e2e_manual_test_edt_conflits.py`
- [x] Test manuel présences (feuille + bulk + taux) - `scripts/e2e_manual_test_presences.py`

## Documentation (chaque sous-lot livré)

- [x] [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5
- [x] [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §10
- [x] [11_PLAN_ACTION.md](./11_PLAN_ACTION.md) §4.1

---

## Points de vigilance transverses

- **RBAC** : durcir à la livraison de chaque sous-lot (pattern `get_current_admin_scolarite_user` pour écriture admin ; lecture portails enseignant/étudiant = filtre propriétaire plus tard).
- **reportlab** : export PDF EDT ✅ (07/09/2026 - voir [CHECKLIST_PDF_REPORTLAB.md](./CHECKLIST_PDF_REPORTLAB.md)).
- **taux_presence_min** : calcul backend uniquement après sous-lot D.
- **Dual-stack UI** : composants MUI `emploiTemps/*` déjà branchés API - privilégier réutilisation ou port Bootstrap progressif pour limiter la dette.
