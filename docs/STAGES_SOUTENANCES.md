# Guide des Stages et Soutenances

## Vue d'ensemble

Le module de gestion des stages permet de suivre l'ensemble du parcours de stage d'un étudiant, de la convention à la soutenance finale. Les stages sont intégrés au système d'évaluation comme des matières à part entière.

## Types de Stages

| Type | Description | Niveau typique | Durée |
|------|-------------|----------------|-------|
| `observation` | Découverte du milieu professionnel | L1-L2 | 2-4 semaines |
| `pratique` | Application des connaissances | L3 | 4-8 semaines |
| `professionnel` | Immersion professionnelle | M1-M2 | 8-16 semaines |
| `recherche` | Travail de recherche | M2-Doctorat | 4-6 mois |

## Cycle de Vie d'un Stage

```
Création → En cours → Terminé → Soutenance → Validé/Invalidé
```

### Statuts

| Statut | Description |
|--------|-------------|
| `en_cours` | Stage en cours de réalisation |
| `termine` | Stage terminé, rapport déposé |
| `valide` | Stage validé après soutenance |
| `invalide` | Stage non validé |

## Création d'un Stage

### Informations requises

#### Académiques
- Étudiant
- Matière (type stage)
- Niveau
- Année académique

#### Entreprise
- Nom de l'entreprise
- Adresse
- Téléphone
- Email

#### Encadrement
- Maître de stage (entreprise)
- Encadrant académique

#### Stage
- Type de stage
- Durée (semaines)
- Dates de début et fin
- Thème
- Objectifs

## Évaluation du Stage

### Composantes de la note

| Composante | Coefficient par défaut | Évaluateur |
|------------|----------------------|------------|
| Note entreprise | 30% | Maître de stage |
| Note rapport | 30% | Encadrant académique |
| Note soutenance | 40% | Jury |

### Calcul de la note finale
```
Note finale = (Note_entreprise × 0.3) + (Note_rapport × 0.3) + (Note_soutenance × 0.4)
```

## Soutenances

### Programmation

#### Prérequis
- Stage terminé
- Rapport déposé
- Pas de soutenance déjà programmée

#### Informations requises
- Date et heure
- Lieu / Salle
- Durée (défaut: 30 minutes)
- Composition du jury

### Composition du Jury

| Rôle | Obligatoire | Description |
|------|-------------|-------------|
| Président | Oui | Préside la soutenance |
| Rapporteur | Oui | Évalue le rapport et la présentation |
| Examinateur | Non | Membre supplémentaire |

### Déroulement

1. **Présentation** (10-15 min) : L'étudiant présente son travail
2. **Questions** (10-15 min) : Le jury pose des questions
3. **Délibération** : Le jury délibère à huis clos
4. **Proclamation** : Annonce des résultats

### Évaluation par le Jury

| Critère | Coefficient par défaut |
|---------|----------------------|
| Présentation | 30% |
| Défense | 40% |
| Note globale jury | 30% |

### Appréciations

| Note | Appréciation |
|------|--------------|
| ≥ 18/20 | Excellent |
| ≥ 16/20 | Très Bien |
| ≥ 14/20 | Bien |
| ≥ 12/20 | Assez Bien |
| ≥ 10/20 | Passable |
| < 10/20 | Insuffisant |

### Mentions

| Note | Mention |
|------|---------|
| ≥ 16/20 | Très Bien |
| ≥ 14/20 | Bien |
| ≥ 12/20 | Assez Bien |
| ≥ 10/20 | Passable |

## Procès-Verbal (PV)

Le PV de soutenance est généré automatiquement après validation et contient :
- Informations sur l'étudiant
- Informations sur le stage
- Composition du jury
- Notes attribuées
- Appréciation et mention
- Observations du jury
- Signatures

## Intégration au Système d'Évaluation

### Stage comme Matière
Le stage est traité comme une matière dans le système :
- Possède un coefficient
- Attribue des crédits ECTS
- La note est intégrée dans le calcul de la moyenne

### Impact sur la Validation
- Un stage non validé peut bloquer la validation du niveau
- Les crédits du stage sont comptabilisés dans le total

## API Endpoints

### Stages
```
GET    /api/v1/stages/                    # Liste des stages
POST   /api/v1/stages/                    # Créer un stage
GET    /api/v1/stages/{id}                # Détails d'un stage
PUT    /api/v1/stages/{id}                # Modifier un stage
DELETE /api/v1/stages/{id}                # Supprimer un stage
POST   /api/v1/stages/{id}/valider        # Valider avec notes
POST   /api/v1/stages/{id}/terminer       # Marquer comme terminé
GET    /api/v1/stages/etudiant/{id}       # Stages d'un étudiant
GET    /api/v1/stages/encadrant/{id}      # Stages encadrés
GET    /api/v1/stages/statistiques        # Statistiques
```

### Soutenances
```
GET    /api/v1/soutenances/               # Liste des soutenances
POST   /api/v1/soutenances/               # Programmer une soutenance
GET    /api/v1/soutenances/{id}           # Détails
PUT    /api/v1/soutenances/{id}           # Modifier
DELETE /api/v1/soutenances/{id}           # Annuler
POST   /api/v1/soutenances/{id}/valider   # Valider avec notes
POST   /api/v1/soutenances/{id}/generer-pv # Générer le PV
GET    /api/v1/soutenances/jury/{id}      # Soutenances d'un membre du jury
GET    /api/v1/soutenances/calendrier     # Calendrier
GET    /api/v1/soutenances/a-venir        # Soutenances à venir
```

## Workflow Complet

```
1. CRÉATION DU STAGE
   └── Admin/Scolarité crée le stage
   └── Statut: en_cours

2. SUIVI DU STAGE
   └── Étudiant réalise le stage
   └── Encadrant suit l'avancement

3. FIN DU STAGE
   └── Étudiant dépose le rapport
   └── Admin marque le stage comme terminé
   └── Statut: termine

4. ÉVALUATION PRÉLIMINAIRE
   └── Maître de stage donne sa note
   └── Encadrant évalue le rapport

5. PROGRAMMATION SOUTENANCE
   └── Admin programme la soutenance
   └── Sélection du jury
   └── Réservation de la salle

6. SOUTENANCE
   └── Présentation par l'étudiant
   └── Questions du jury
   └── Délibération

7. VALIDATION
   └── Jury saisit les notes
   └── Calcul de la note finale
   └── Détermination de la mention
   └── Statut stage: valide/invalide

8. GÉNÉRATION PV
   └── PV généré automatiquement
   └── Archivage
```

## Statistiques Disponibles

- Nombre total de stages
- Répartition par statut
- Répartition par type
- Taux de validation
- Moyenne des notes
- Nombre de soutenances programmées/terminées

## Bonnes Pratiques

1. **Planification** : Programmer les soutenances à l'avance
2. **Disponibilité** : Vérifier la disponibilité du jury et des salles
3. **Communication** : Informer l'étudiant et le jury des dates
4. **Documentation** : Conserver tous les documents (convention, rapport, PV)
5. **Délais** : Respecter les délais de dépôt de rapport
6. **Évaluation** : Utiliser des critères objectifs et transparents
