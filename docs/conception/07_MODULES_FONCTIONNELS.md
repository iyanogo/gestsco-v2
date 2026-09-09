# 07 - Modules Fonctionnels

**Mise à jour** : 07/09/2026 - §10 et §11 synchronisés avec l'état réel post-corrections P0

## 1. Organisation pédagogique (Référentiel)

**Objectif** : Structurer l'offre de formation LMD.

### Fonctionnalités

- CRUD universités, établissements, départements
- Gestion cycles (L/M/D), filières, niveaux
- Modules (UE) et matières (EC) avec coefficients
- Années scolaires et années académiques

### API

`/universites`, `/etablissements`, `/departements`, `/cycles`, `/filieres`, `/niveaux`, `/modules`, `/matieres`

### UI

- Bootstrap : `/admin/referentiel/*`
- Legacy : `/universites`, `/filieres`, etc.

---

## 2. Gestion des étudiants

**Objectif** : Dossier étudiant complet.

### Fonctionnalités

- Création fiche étudiant (matricule auto)
- Upload photo et documents
- Consultation inscriptions et parcours
- Recherche, filtres par filière/niveau

### API

`/etudiants`, `/documents-etudiant`

### UI

- `/admin/etudiants/*`, `/etudiants` (legacy)

---

## 3. Inscriptions

**Objectif** : Inscrire les étudiants administrativement et pédagogiquement.

### Sous-modules

| Sous-module | Description |
|-------------|-------------|
| Inscriptions admin | Inscription individuelle/groupe |
| Campagnes | Périodes d'inscription configurables |
| Inscription publique | Portail candidat en ligne |
| Inscription matières | Choix EC par semestre |
| Paiements inscription | Frais dossier |

### API

`/inscriptions`, `/campagnes-inscription`, `/inscription-publique`, `/inscription-groupe`, `/inscriptions-matieres`, `/paiements`

### UI

- Admin : `/admin/etudiants/inscriptions`, `/campagnes`
- Public : `/inscription`, `/suivi-dossier`

---

## 4. Évaluations & résultats

**Objectif** : Gérer le cycle complet des notes et délibérations.

### Workflow

```
Session examen → Examens → Saisie notes → Calcul résultats
  → Délibération → Validation → Bulletins PDF
```

### Fonctionnalités

- Sessions (normale, rattrapage)
- Saisie notes par enseignant
- Calcul moyennes (règles configurables)
- Conseils de délibération
- Génération bulletins semestre/année

### API

`/sessions-examen`, `/examens`, `/notes`, `/resultats`, `/deliberations`, `/bulletins`

### UI

- `/admin/evaluations/*`, `/sessions` (legacy)

---

## 5. Emploi du temps & présences

**Objectif** : Planifier cours et suivre assiduité.

### Fonctionnalités

- Bâtiments et salles
- Créneaux horaires
- Grilles emploi du temps
- Réservation salles
- Feuilles de présence
- Export Excel/PDF EDT

### API

`/batiments`, `/salles`, `/creneaux-horaires`, `/seances`, `/emplois-temps`, `/presences`, `/reservations-salles`

---

## 6. Finances scolarité

**Objectif** : Facturation et suivi des paiements.

### Fonctionnalités

- Types de frais et barèmes par niveau
- Génération factures
- Enregistrement paiements
- Compte étudiant (solde, mouvements)
- Remises et échéanciers
- Reçus PDF

### API

`/types-frais`, `/frais-scolarite`, `/factures`, `/paiements-factures`, `/comptes-etudiants`, `/remises`, `/echeanciers`

### UI

- `/admin/finances/*`, `/paiements-admin` (legacy)

---

## 7. Gestion années académiques LMD

**Objectif** : Piloter le cycle annuel.

### Processus

1. Création année (brouillon)
2. Ouverture + reconduction référentiel
3. Gestion semestres S1/S2
4. Clôture semestres → délibérations
5. Clôture année → archivage

Documentation détaillée : `docs/GESTION_ANNEES.md`

### API

`/annees-academiques`, `/semestres`, `/modules-systeme`

---

## 8. Stages & soutenances

**Objectif** : Suivre stages professionnels et soutenances.

### Fonctionnalités

- Fiche stage (entreprise, tuteur, dates)
- Évaluation stage
- Planification soutenances
- Jury et résultats

Documentation : `docs/STAGES_SOUTENANCES.md`

### API

`/stages`, `/soutenances`

**RBAC backend** : toutes les routes exigent `get_current_admin_scolarite_user` (admin, scolarité, superadmin - **sans comptable**), aligné sur le menu frontend. Les endpoints `/stages/encadrant/{id}` et `/soutenances/jury/{id}` restent admin-only jusqu'à implémentation d'un accès enseignant filtré (portail enseignant placeholder). Un futur portail étudiant pourra consulter son propre stage via filtre propriétaire, pas un accès liste global.

---

## 9. Paramétrage & administration

### Paramétrage établissement

- Paramètres système (clé/valeur)
- Configuration établissement (logo, infos)
- Barèmes notation et mentions
- Templates documents (HTML → PDF)
- Règles de calcul
- Modèles email/SMS
- Configurations par pays

### Administration

> **Statut 09/09/2026** : Phase 1 ✅ (RBAC + utilisateurs). Phase 2 🔶 partielle - logs, sauvegardes (sans restauration), audit consultable et hooks sur modules métier principaux. Détail : [CHECKLIST_ADMINISTRATION.md](./CHECKLIST_ADMINISTRATION.md).

| Page | Route | API | Statut |
|------|-------|-----|--------|
| Logs système | `/admin/administration/logs` | ✅ | Branché |
| Sauvegardes | `/admin/administration/backup` | ✅ | Création + téléchargement ; restauration ❌ |
| Audit trail | `/admin/administration/audit` | ✅ | Branché ; hooks partiels |
| Matrice permissions | `/admin/administration/permissions` | ✅ lecture | Résumé comptes + matrice read-only ; **édition ❌** |

**Phase 1 (hors menu Administration)** :
- Gestion utilisateurs → `/admin/utilisateurs` (API `/users`, superuser)
- Modules système → `/admin/gestion-modules` (API `/modules-systeme`)

#### PermissionsPage ≠ RBAC actif

| Mécanisme | Fichiers | Statut | Rôle |
|-----------|----------|--------|------|
| **RBAC navigation & routes** | `rbac.ts`, `usePermissions.ts`, `menuConfig.ts`, `ProtectedRoute` | ✅ Phase 1 | Filtre menu et accès routes par rôle |
| **RBAC backend** | `deps.py`, `permissions.py`, guards FastAPI | ✅ Phase 1 | Garde-fous par endpoint |
| **Comptes utilisateurs** | `UtilisateursListPage`, API `/users` | ✅ Phase 1 | `role`, `is_superuser`, `is_active` |
| **Matrice permissions UI** | `PermissionsPage`, API `/administration/permissions/*` | 🔶 Phase 2 | Consultation ✅ ; édition persistée ❌ |

### API

`/parametres`, `/configurations`, `/baremes`, `/templates`, `/regles-calcul`, `/modeles-communication`, `/pays`, `/users`, `/modules-systeme`

---

## 10. Portails par rôle

⚠️ Ce tableau distingue désormais **accès protégé** (authentification/routage) de **branchement API réel**, ce que ne faisait pas la version du 18/08/2026.

| Portail | Route | Accès protégé | Contenu réel |
|---------|-------|----------------|---------------|
| Admin / Scolarité | `/admin/*` | ✅ `ProtectedRoute` + RBAC nav | 🔶 Partiel - référentiel/années LMD/stages branchés API ; évaluations, inscriptions, EDT, paramétrage encore mockés (~25 pages, voir [00_AUDIT_COMPLET.md](./00_AUDIT_COMPLET.md) §5) |
| Enseignant | `/enseignant/*` | ✅ `ProtectedRoute` + RBAC nav | ✅ Dashboard, EDT, stages, saisie notes, **feuille d'appel**, **résultats matières** (lecture seule, scope séances) |
| Étudiant | `/etudiant/*` | ✅ `ProtectedRoute` + RBAC nav | 🔶 Partiel - dashboard, résultats, EDT, présences, finances branchés API ; bulletins/documents encore placeholders |
| Candidat | `/inscription` | - (public, par design) | ✅ Fonctionnel |

**Rappel** : avant le 07/09/2026, les routes `/admin/*`, `/enseignant/*` et `/etudiant/*` n'étaient protégées par aucune authentification réelle (login Bootstrap en mode démo). Ce point est corrigé - voir [05_FRONTEND_UI.md](./05_FRONTEND_UI.md) §3.

---

## 11. Matrice droits d'accès

### Navigation (menus, accès aux routes) - ✅ implémenté

Le RBAC frontend (`rbac.ts`, `usePermissions`) filtre désormais le menu et l'accès aux routes selon le rôle connecté (admin, scolarité, enseignant, étudiant).

### Actions fines par page (boutons CRUD) - ✅ implémenté (08/09/2026)

Matrice centralisée dans `frontend/src/utils/rbacActions.ts` - consommée via `usePermissions().canPerform(module, action)` et le composant `PermissionGate`.

| Action | Admin | Scolarité | Enseignant | Étudiant | Comptable |
|--------|-------|-----------|------------|----------|-----------|
| Référentiel CRUD | ✅ | ❌ | ❌ | ❌ | ❌ |
| Étudiants CRUD | ✅ | ✅ | ❌ | ❌ | ❌ |
| Saisie notes | ✅ | ✅ | ✅ (portail, scope API) | ❌ | ❌ |
| Consultation résultats matières | ✅ | ✅ | ✅ (lecture seule, ses matières) | 👁️ soi | ❌ |
| Délibérations | ✅ | ✅ | ❌ | ❌ | ❌ |
| Finances | ✅ | ✅ | ❌ | 👁️ soi | ✅ |
| Stages / Soutenances | ✅ | ✅ | ❌ | ❌ | ❌ |
| Paramétrage | ✅ | ❌ | ❌ | ❌ | ❌ |
| EDT (séances) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Créneaux horaires | superadmin | 👁️ | ❌ | ❌ | ❌ |

👁️ = lecture seule côté UI - **le backend reste la seule garantie de sécurité** ; le masquage frontend améliore la cohérence UX. Voir [CHECKLIST_RBAC_ACTIONS_FINES.md](./CHECKLIST_RBAC_ACTIONS_FINES.md).

**Phase 2 (hors scope)** : édition dynamique de la matrice via `PermissionsPage` (placeholder, pas d'API).
