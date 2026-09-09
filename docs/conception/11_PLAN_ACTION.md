# 11 - Plan d'Action & Roadmap

**Mise à jour** : 07/09/2026 - P0 largement traités, ouverture P1/P2

## 1. Priorisation

| Priorité | Délai | Thème | État global |
|----------|-------|-------|-------------|
| **P0** | Immédiat | Sécurité, tests cassés | ✅ Largement fait |
| **P1** | 2-4 semaines | Qualité, migrations, deps | 🔶 Ouvert |
| **P2** | 1-3 mois | Migration UI, portails | 🔶 Ouvert (nouveau focus : branchement API) |
| **P3** | 3-6 mois | Production, CI/CD, Docker | ❌ Non démarré |

---

## 2. P0 - Bloquants (immédiat)

### 2.1 Authentification Bootstrap ✅ FAIT

**Problème initial** : LoginPage démo + routes admin ouvertes.

**Actions réalisées** :
- [x] `LoginPage` Bootstrap refactorée → appelle `authService.login()`
- [x] `BootstrapRoutes` enveloppées dans `ProtectedRoute`
- [x] Redirection `/login` si token invalide sur routes protégées
- [x] RBAC frontend ajouté (`rbac.ts`, `usePermissions`, menu filtré par rôle)

**Restant** :
- [ ] Tests e2e Cypress dédiés au flux auth Bootstrap (spec existe mais non vérifiée en CI)

### 2.2 Corriger suite tests backend ✅ FAIT

**Problème initial** : 31/48 tests en échec/erreur.

**Actions réalisées** :
- [x] `tests/conftest.py` créé avec import complet des modèles
- [x] Suite visée 48/48 (à reconfirmer par exécution CI dès qu'elle existera)

**Restant** :
- [ ] Vérifier la non-régression en continu (pas de CI actuellement pour l'automatiser)

### 2.3 Secret & credentials production ❌ TOUJOURS OUVERT

**Actions** :
- [ ] Documenter génération SECRET_KEY
- [ ] Script post-init : forcer changement mot de passe admin
- [ ] Vérifier `.env` dans `.gitignore`

**Effort** : 0.5 jour

---

## 3. P1 - Qualité (2-4 semaines) - toujours ouvert

### 3.1 Migrations Alembic

- [x] `alembic/env.py` importe déjà les modèles
- [x] Chaîne linéaire : `39f7aaba0292` (initial_schema, no-op) → `001_matiere_credit` → `002_etudiant_user_id` (FK `etudiant.user_id`)
- [x] **Workflow upgrade + downgrade validé** (07/09/2026, base dev locale `gestscov2`) pour `001_matiere_credit`
- [x] **Backfill post-migration 002** : `scripts/backfill_etudiant_user_id.py` (dry-run par défaut, `--apply` pour lier par email) - voir README backend et `CHECKLIST_BACKFILL_ETUDIANT_USER_ID.md`
- [x] Documenter workflow migration + backfill dans README backend
- [ ] Retirer dépendance à `create_all()` en production

### 3.2 Dépendances manquantes

- [x] Ajouter `reportlab` à requirements.txt (PDF programmatique : factures, reçus, EDT, bulletins) - 07/09/2026
- [x] Ajouter `weasyprint` + `xhtml2pdf` (HTML→PDF templates ; fallback dev Windows) - 07/09/2026
- [ ] Ajouter ESLint + config frontend
- [ ] Retirer ou ajouter `babel-jest`

### 3.3 Unifier auth backend

- [ ] Migrer endpoints `dependencies.py` → `deps.py`
- [ ] Supprimer doublon `AuthService` vs inline JWT
- [ ] Un seul point de vérité pour `get_current_user`

### 3.4 Résoudre conflit routes

- [ ] Fusionner `annees_academiques.py` et `annees_academiques_gestion.py`
- [ ] Ou séparer préfixes (`/annees-academiques` vs `/gestion-annees`)

### 3.5 CI/CD

- [ ] GitHub Actions : pytest + jest + build
- [ ] Badge status dans README racine

---

## 4. P2 - Fonctionnel (1-3 mois)

⚠️ **Recentrage suite à l'audit du 07/09/2026** : le principal écart n'est plus la structure Bootstrap (déjà en place) mais le **branchement API réel** des pages. Nouvelle sous-priorisation ci-dessous.

### 4.1 Brancher le CRUD réel des pages encore mockées (nouveau, priorité haute)

Pages actuellement en mock/setTimeout/données en dur, par ordre d'impact métier :

- [x] **Étudiants** : création, inscriptions, dossiers, réinscriptions (décision délibération), import groupe - branché 07/09/2026
- [x] **Inscriptions-matières** - `InscriptionsMatieresPage` branchée API (07/09/2026)
- [ ] **Campagnes d'inscription** - reste mock
- [ ] **Évaluations** : notes, examens, sessions, délibérations, résultats
  - [x] Saisie notes (`SaisieNotesPage`) - 07/09/2026
  - [x] Résultats (`ResultatsPage`) - `/resultats/calculer/*` - 07/09/2026
  - [x] Délibérations (`DeliberationsPage`) - `DeliberationService` + config - 07/09/2026
  - [ ] Sessions, examens (voir [CHECKLIST_CRUD_EVALUATIONS.md](./CHECKLIST_CRUD_EVALUATIONS.md))
- [x] **Emploi du temps** - chantier CRUD complet (sous-lots A→D livrés 07/09/2026)
  - [x] Sous-lot A - bâtiments, salles, créneaux horaires
  - [x] Sous-lot B - séances / grille EDT
  - [x] Sous-lot C - réservations salles
  - [x] Sous-lot D - présences + `taux_presence_min` dans calcul résultats
- [x] **Présences** - sous-lot D EDT (07/09/2026)
- [x] **Templates documents** - CRUD HTML + preview + export PDF (07/09/2026)
- [x] **Documents générés** - pas d'API (bandeau Phase 2)
- [x] **Administration** : logs, backup, permissions, audit - bandeaux Phase 2, maquettes retirées (07/09/2026)
- [x] **Paramétrage Bootstrap, gestion utilisateurs/enseignants**
  - [x] Sous-lot A - paramètres généraux + années scolaires (07/09/2026)
  - [x] Sous-lot B - utilisateurs, modules système, RBAC backend superuser (07/09/2026)
  - [x] Sous-lot C - templates, barèmes, pays, règles, modèles communication (07/09/2026)
  - [x] Sous-lot D - administration placeholder + distinction PermissionsPage / rbac.ts (07/09/2026)

### 4.2 Ajouter Stages/Soutenances au menu (quick win - livré)

- [x] Entrées dans `menuConfig.ts` - rubrique « Stages » (Stages + Soutenances) - 07/09/2026
- [x] RBAC : visible admin/scolarité/superadmin ; comptable exclu (aligné `canAccessPath`)
- [x] RBAC backend : `get_current_admin_scolarite_user` sur `/stages` et `/soutenances` - 07/09/2026

### 4.3 Finaliser migration Bootstrap

- [x] Portail enseignant fonctionnel (notes, EDT, stages, **présences**, **résultats lecture**) - chantier Portails **clos** 08/09/2026
- [x] Portail étudiant - sous-lots A+B : dashboard, résultats, EDT, présences, finances (lecture seule)
- [ ] Retirer pages MUI legacy
- [ ] Retirer dépendances MUI (~138 fichiers)

### 4.4 RBAC frontend - actions fines

- [x] Menu + routes protégées par rôle - fait
- [x] Matrice permissions par action (`rbacActions.ts`, `canPerform`, `PermissionGate`) - 08/09/2026
- [ ] Extension progressive aux composants restants (inscriptions, réservations, MUI legacy)
- [ ] Guard routes enseignant/étudiant sur les futures pages réelles

### 4.5 Étendre couverture tests

- [ ] Tests API : inscriptions, notes, factures
- [ ] Tests services frontend critiques
- [ ] Cypress en CI

### 4.6 Performance frontend

- [ ] Code-splitting routes (`React.lazy`)
- [ ] Réduire bundle < 1 Mo
- [ ] Migrer Sass `@import` → `@use`

---

## 5. P3 - Industrialisation (3-6 mois) - non démarré

### 5.1 Containerisation

- [ ] Dockerfile backend + frontend
- [ ] docker-compose dev + prod
- [ ] Documentation déploiement Docker

### 5.2 Observabilité

- [ ] Structured logging (JSON)
- [ ] Métriques Prometheus / health détaillé
- [ ] Alerting uptime

### 5.3 Fonctionnalités avancées

- [ ] Refresh token JWT
- [ ] Notifications email/SMS (intégration réelle)
- [ ] Export massif / import référentiel
- [ ] Multi-établissement (si requis)

---

## 6. Roadmap visuelle (mise à jour)

```
2026 Q3 (fait)      Q3-Q4 (en cours)         2027 Q1
│                    │                        │
├─ P0 Sécurité ✅    ├─ Branchement API réel  ├─ Docker
├─ P0 Tests ✅        │  (étudiants/inscript.) ├─ Monitoring
├─ RBAC nav ✅        ├─ P1 Alembic           ├─ Notifications
│                    ├─ P1 CI/CD              │
│                    ├─ Menu Stages (quick)   │
│                    ├─ RBAC actions fines    │
│                    │                        │
└─ MVP stable ✅      └─ Beta prod             └─ Production
```

---

## 7. Definition of Done - Production

Le projet sera considéré **prêt production** quand :

- [x] Auth unifiée et routes protégées *(fait côté frontend - restant : unifier deps.py/dependencies.py côté backend)*
- [ ] 100% tests backend passent *(visé, à reconfirmer en continu)*
- [ ] Couverture backend ≥ 60%
- [ ] Couverture frontend ≥ 70%
- [ ] Migrations Alembic opérationnelles
- [ ] CI/CD vert sur main
- [ ] Audit sécurité passé (SECRET_KEY, mot de passe admin)
- [ ] ≥ 90% des pages Bootstrap branchées sur l'API réelle (nouveau critère)
- [ ] Documentation ops complète
- [ ] Backup/restore testé
- [ ] Déploiement staging validé par métier

---

## 8. Suivi

| Document | Mise à jour |
|----------|-------------|
| Audit | 07/09/2026 - après corrections P0 |
| Plan d'action | 07/09/2026 |
| Frontend UI | 07/09/2026 |
| Conception | À chaque module majeur |

**Prochaine revue recommandée** : après le branchement CRUD étudiants/inscriptions (impact métier maximal) ou fin septembre 2026, selon ce qui arrive en premier.
