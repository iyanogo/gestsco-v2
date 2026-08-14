# Système LMD CAMES

## Introduction

Le système LMD (Licence-Master-Doctorat) est le système d'enseignement supérieur adopté par le CAMES (Conseil Africain et Malgache pour l'Enseignement Supérieur). Il structure les études supérieures en trois cycles avec une organisation semestrielle et un système de crédits ECTS.

## Structure des Cycles

### Licence (L) - 3 ans
- **Durée** : 6 semestres (S1 à S6)
- **Crédits** : 180 ECTS (30 par semestre)
- **Organisation** :
  - L1 (1ère année) : S1 + S2 = 60 crédits
  - L2 (2ème année) : S3 + S4 = 60 crédits
  - L3 (3ème année) : S5 + S6 = 60 crédits

### Master (M) - 2 ans
- **Durée** : 4 semestres (S7 à S10)
- **Crédits** : 120 ECTS (30 par semestre)
- **Organisation** :
  - M1 (1ère année) : S7 + S8 = 60 crédits
  - M2 (2ème année) : S9 + S10 = 60 crédits

### Doctorat (D) - 3 ans minimum
- **Durée** : 6 semestres (S11 à S16)
- **Crédits** : 180 ECTS (30 par semestre)
- **Organisation** :
  - D1 (1ère année) : S11 + S12 = 60 crédits
  - D2 (2ème année) : S13 + S14 = 60 crédits
  - D3 (3ème année) : S15 + S16 = 60 crédits

## Tableau Récapitulatif

| Cycle | Années | Semestres | Crédits/Sem | Total Crédits |
|-------|--------|-----------|-------------|---------------|
| Licence | 3 | S1-S6 | 30 | 180 |
| Master | 2 | S7-S10 | 30 | 120 |
| Doctorat | 3 | S11-S16 | 30 | 180 |
| **Total** | **8** | **16** | - | **480** |

## Système de Crédits ECTS

### Définition
Un crédit ECTS représente environ 25-30 heures de travail étudiant, incluant :
- Cours magistraux
- Travaux dirigés
- Travaux pratiques
- Travail personnel
- Stages

### Attribution
- Chaque Unité d'Enseignement (UE) a un nombre de crédits défini
- Les crédits sont acquis si l'UE est validée (note ≥ 10/20)
- Les crédits sont capitalisables et transférables

## Règles de Validation

### Validation d'un Semestre
Un semestre est validé si :
1. La moyenne générale du semestre ≥ 10/20
2. Aucune note éliminatoire (si configuré)
3. Le taux de présence est suffisant (si configuré)

### Compensation des Semestres
La compensation permet de valider une année même si un semestre n'atteint pas 10/20 :
- Condition : Moyenne des deux semestres ≥ 10/20
- Les deux semestres doivent être du même niveau (S1+S2, S3+S4, etc.)

**Exemple :**
```
S1 : 9/20
S2 : 11/20
Moyenne annuelle : (9 + 11) / 2 = 10/20 → Année validée par compensation
```

### Passage Conditionnel
Un étudiant peut passer au niveau supérieur avec des dettes si :
- Sa moyenne est ≥ moyenne de passage conditionnel (ex: 8/20)
- Le nombre de matières en dette ≤ maximum autorisé (ex: 2)
- Les crédits acquis ≥ minimum requis

## Mentions

| Moyenne | Mention |
|---------|---------|
| ≥ 16/20 | Très Bien |
| ≥ 14/20 | Bien |
| ≥ 12/20 | Assez Bien |
| ≥ 10/20 | Passable |
| < 10/20 | Insuffisant |

## Délibérations

### Périodicité
- **Semestrielle** : Délibération à la fin de chaque semestre
- **Annuelle** : Délibération uniquement en fin d'année

### Décisions possibles
- **Admis** : Validation complète
- **Admis conditionnel** : Passage avec dettes
- **Ajourné** : Redoublement ou rattrapage
- **Exclu** : Exclusion définitive (cas graves)

## Sessions d'Examen

### Session Normale
- Première session d'évaluation
- Se déroule à la fin du semestre

### Session de Rattrapage
- Deuxième chance pour les étudiants ajournés
- Seules les matières non validées sont repassées
- La meilleure note est conservée

## Stages

### Types de stages selon le niveau
- **L3** : Stage d'observation ou pratique (4-8 semaines)
- **M1** : Stage professionnel (8-12 semaines)
- **M2** : Stage de fin d'études (4-6 mois)
- **Doctorat** : Stage de recherche

### Évaluation des stages
- Note entreprise (maître de stage)
- Note rapport (encadrant académique)
- Note soutenance (jury)

## Implémentation dans GestSco

### Modèle Semestre
```python
class Semestre:
    code: str           # S1, S2, ..., S16
    libelle: str        # Semestre 1, Semestre 2, ...
    cycle_id: int       # Référence au cycle (L, M, D)
    numero_semestre: int # 1 à 16
    annee_dans_cycle: int # 1, 2, 3
    semestre_dans_annee: int # 1 ou 2
    credits_requis: int # 30 par défaut
```

### Configuration des Délibérations
```python
class ConfigurationDeliberation:
    periodicite: str              # semestrielle, annuelle
    compensation_semestres: bool  # True/False
    note_eliminatoire: float      # Ex: 5/20
    moyenne_validation: float     # 10/20
    moyenne_passage_conditionnel: float # 8/20
    credits_min_passage: int      # Crédits minimum
    taux_presence_min: float      # 75%
```

## Références

- CAMES : [www.lecames.org](http://www.lecames.org)
- Système LMD : Déclaration de Bologne (1999)
- ECTS : European Credit Transfer System
