# Guide de Gestion des Années Académiques

## Vue d'ensemble

Le système de gestion des années académiques permet de gérer le cycle de vie complet d'une année académique, de sa création à son archivage, en passant par l'ouverture, la gestion des semestres et la clôture.

## Statuts d'une Année Académique

Une année académique peut avoir les statuts suivants :

| Statut | Description | Actions possibles |
|--------|-------------|-------------------|
| `brouillon` | Année créée mais pas encore ouverte | Ouvrir |
| `ouverte` | Année ouverte, inscriptions possibles | Clôturer S1 |
| `en_cours` | Année en cours, semestre 2 actif | Clôturer S2, Clôturer année |
| `cloturee` | Année clôturée, délibérations terminées | Archiver |
| `archivee` | Année archivée | Aucune |

## Processus d'Ouverture

### Prérequis
- Aucune autre année ne doit être ouverte ou en cours
- L'année doit être en statut `brouillon`

### Étapes
1. **Sélection de l'année** : Choisir l'année à ouvrir
2. **Configuration de la reconduction** : Décider si le référentiel doit être reconduit
3. **Sélection des éléments** : Si reconduction, choisir les éléments à copier
4. **Confirmation** : Valider l'ouverture

### Éléments reconduisibles
- **Filières** : Structure des filières d'enseignement
- **Modules** : Modules d'enseignement
- **Matières** : Matières et leurs coefficients
- **Salles** : Configuration des salles
- **Créneaux horaires** : Plages horaires
- **Frais de scolarité** : Montants des frais
- **Types de frais** : Catégories de frais
- **Configurations** : Paramètres de délibération

### Actions automatiques lors de l'ouverture
1. Création de la période comptable
2. Activation des modules obligatoires
3. Copie du référentiel (si demandé)
4. Passage au semestre 1

## Processus de Reconduction du Référentiel

La reconduction permet de copier les données de l'année précédente vers la nouvelle année.

### Fonctionnement
```
Année N-1 (source) → Année N (cible)
```

### Rapport de reconduction
Après la reconduction, un rapport détaille :
- Nombre de filières copiées
- Nombre de modules copiés
- Nombre de matières copiées
- Erreurs éventuelles

## Gestion des Semestres

### Structure LMD
- **Semestre 1** : Premier semestre de l'année
- **Semestre 2** : Second semestre de l'année

### Clôture du Semestre 1
1. Vérification des notes saisies
2. Lancement des délibérations
3. Calcul des résultats semestriels
4. Passage au semestre 2

### Clôture du Semestre 2
1. Vérification des notes saisies
2. Lancement des délibérations
3. Calcul des résultats semestriels
4. Préparation de la clôture annuelle

## Processus de Clôture

### Prérequis
- Les deux semestres doivent être clôturés
- Toutes les délibérations doivent être validées
- Le semestre actif doit être le semestre 2

### Actions automatiques
1. Calcul des résultats annuels
2. Application des compensations (si configuré)
3. Génération des bulletins annuels
4. Clôture de la période comptable
5. Génération du rapport financier

## Gestion des Modules

### Modules Obligatoires
Les modules suivants ne peuvent pas être désactivés :
- REFERENTIEL
- ETUDIANTS
- INSCRIPTIONS
- EVALUATIONS

### Modules Optionnels
- EMPLOI_TEMPS
- FINANCES
- STAGES
- BIBLIOTHEQUE
- COMMUNICATION

### Dépendances
Certains modules dépendent d'autres modules :
```
ETUDIANTS → REFERENTIEL
INSCRIPTIONS → REFERENTIEL, ETUDIANTS
EVALUATIONS → REFERENTIEL, ETUDIANTS, INSCRIPTIONS
FINANCES → ETUDIANTS, INSCRIPTIONS
STAGES → ETUDIANTS, EVALUATIONS
```

## Configuration des Délibérations

### Paramètres disponibles
- **Périodicité** : Semestrielle ou annuelle
- **Compensation** : Activation de la compensation entre semestres
- **Note éliminatoire** : Seuil en dessous duquel l'étudiant est éliminé
- **Matières en dette** : Nombre maximum autorisé
- **Moyenne de validation** : Seuil pour valider (défaut: 10/20)
- **Passage conditionnel** : Seuil pour passage avec conditions
- **Crédits minimum** : Nombre de crédits requis
- **Taux de présence** : Pourcentage minimum requis
- **Rattrapage** : Autorisation des sessions de rattrapage
- **Sessions maximum** : Nombre de sessions autorisées

### Configuration par niveau
Il est possible de définir des configurations spécifiques par niveau, qui priment sur la configuration globale.

## Rapports

### Rapport d'année
Le rapport d'année inclut :
- Statistiques étudiants
- Statistiques inscriptions
- Statistiques financières (facturé, payé, restant)
- Taux de réussite
- Nombre de délibérations

### Export
Les rapports peuvent être exportés en PDF.

## API Endpoints

### Gestion des années
```
POST /api/v1/annees-academiques/{id}/ouvrir
POST /api/v1/annees-academiques/{id}/cloturer-semestre
POST /api/v1/annees-academiques/{id}/cloturer
POST /api/v1/annees-academiques/{id}/archiver
GET  /api/v1/annees-academiques/{id}/rapport
GET  /api/v1/annees-academiques/{id}/statut
POST /api/v1/annees-academiques/reconduire
```

### Gestion des modules
```
GET  /api/v1/modules-systeme/
POST /api/v1/modules-systeme/{code}/activer
POST /api/v1/modules-systeme/{code}/desactiver
GET  /api/v1/modules-systeme/actifs
GET  /api/v1/modules-systeme/{code}/verifier-acces
```

## Bonnes Pratiques

1. **Planification** : Préparer l'année suivante avant la clôture de l'année en cours
2. **Vérification** : Toujours vérifier les données avant l'ouverture
3. **Sauvegarde** : Effectuer une sauvegarde avant les opérations critiques
4. **Communication** : Informer les utilisateurs des changements d'année
5. **Test** : Tester la reconduction sur un environnement de test si possible
