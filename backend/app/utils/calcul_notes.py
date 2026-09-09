"""
Utilitaires pour le calcul des notes selon le système LMD/CAMES.

Ce module contient les fonctions de calcul pour :
- Moyennes pondérées
- Mentions
- Décisions (admis, ajourné, etc.)
- Crédits ECTS
"""

from typing import TYPE_CHECKING, Optional, Tuple, List

if TYPE_CHECKING:
    from app.utils.deliberation_rules import DeliberationConfigSnapshot


def calculer_moyenne_ponderee(
    notes: List[Tuple[float, float]],
) -> Optional[float]:
    """
    Calcule la moyenne pondérée d'une liste de notes avec leurs coefficients.
    
    Args:
        notes: Liste de tuples (note, coefficient)
        
    Returns:
        La moyenne pondérée ou None si aucune note valide
    """
    if not notes:
        return None
    
    total_notes = 0.0
    total_coefs = 0.0
    
    for note, coef in notes:
        if note is not None and coef > 0:
            total_notes += note * coef
            total_coefs += coef
    
    if total_coefs == 0:
        return None
    
    return round(total_notes / total_coefs, 2)


def calculer_moyenne_matiere(
    note_cc: Optional[float],
    note_tp: Optional[float],
    note_examen: Optional[float],
    coef_cc: float = 0.3,
    coef_tp: float = 0.2,
    coef_examen: float = 0.5,
) -> Optional[float]:
    """
    Calcule la moyenne d'une matière à partir des différentes notes.
    
    Par défaut, les coefficients sont :
    - Contrôle Continu : 30%
    - Travaux Pratiques : 20%
    - Examen Final : 50%
    
    Args:
        note_cc: Note du contrôle continu (sur 20)
        note_tp: Note des travaux pratiques (sur 20)
        note_examen: Note de l'examen final (sur 20)
        coef_cc: Coefficient du CC (défaut 0.3)
        coef_tp: Coefficient du TP (défaut 0.2)
        coef_examen: Coefficient de l'examen (défaut 0.5)
        
    Returns:
        La moyenne de la matière ou None si aucune note
    """
    notes = []
    
    if note_cc is not None:
        notes.append((note_cc, coef_cc))
    if note_tp is not None:
        notes.append((note_tp, coef_tp))
    if note_examen is not None:
        notes.append((note_examen, coef_examen))
    
    return calculer_moyenne_ponderee(notes)


def calculer_mention(
    moyenne: Optional[float],
    seuil_validation: float = 10.0,
) -> Optional[str]:
    """
    Détermine la mention selon la moyenne obtenue.
    
    Barème CAMES :
    - < seuil_validation : Pas de mention (échec)
    - 10-11.99 : Passable
    - 12-13.99 : Assez Bien
    - 14-15.99 : Bien
    - 16-17.99 : Très Bien
    - >= 18 : Excellent
    
    Args:
        moyenne: La moyenne de l'étudiant
        seuil_validation: Seuil minimal pour obtenir une mention (aligné config LMD)
        
    Returns:
        La mention ou None si moyenne < seuil_validation
    """
    if moyenne is None or moyenne < seuil_validation:
        return None
    
    if moyenne >= 18:
        return "excellent"
    elif moyenne >= 16:
        return "tres_bien"
    elif moyenne >= 14:
        return "bien"
    elif moyenne >= 12:
        return "assez_bien"
    else:
        return "passable"


def _note_eliminatoire_appliquee(
    config: Optional["DeliberationConfigSnapshot"],
    notes_composantes: Optional[List[float]],
) -> bool:
    if config is None or config.note_eliminatoire is None or not notes_composantes:
        return False
    return any(n < config.note_eliminatoire for n in notes_composantes)


def _taux_presence_insuffisant(
    config: Optional["DeliberationConfigSnapshot"],
    taux_presence: Optional[float],
) -> bool:
    """True si le seuil configuré n'est pas atteint (données de présence requises)."""
    if config is None or config.taux_presence_min is None or taux_presence is None:
        return False
    return taux_presence < config.taux_presence_min


def determiner_decision_matiere(
    moyenne: Optional[float],
    credit: float,
    seuil_validation: float = 10.0,
    config: Optional["DeliberationConfigSnapshot"] = None,
    notes_composantes: Optional[List[float]] = None,
    taux_presence: Optional[float] = None,
) -> Tuple[str, float]:
    """
    Détermine la décision et les crédits obtenus pour une matière.
    
    Args:
        moyenne: La moyenne de la matière
        credit: Le nombre de crédits de la matière
        seuil_validation: Le seuil de validation (défaut 10/20 si pas de config)
        config: Snapshot ConfigurationDeliberation (prioritaire sur seuil_validation)
        notes_composantes: Notes CC/TP/examen sur 20 (pour note_eliminatoire)
        taux_presence: Taux de présence sur la matière (%) - si sous taux_presence_min → ajourné
        
    Returns:
        Tuple (décision, crédits_obtenus)
        - "admis" si moyenne >= seuil, crédits complets
        - "ajourne" si moyenne < seuil ou note éliminatoire, 0 crédit
    """
    if config is not None:
        seuil_validation = config.moyenne_validation

    if moyenne is None:
        return ("en_cours", 0.0)

    if _note_eliminatoire_appliquee(config, notes_composantes):
        return ("ajourne", 0.0)

    if _taux_presence_insuffisant(config, taux_presence):
        return ("ajourne", 0.0)
    
    if moyenne >= seuil_validation:
        return ("admis", credit)
    else:
        return ("ajourne", 0.0)


def calculer_credits_obtenus(
    resultats_matieres: List[dict],
) -> float:
    """
    Calcule le total des crédits obtenus à partir des résultats de matières.
    
    Args:
        resultats_matieres: Liste de dictionnaires avec 'credit_obtenu'
        
    Returns:
        Le total des crédits obtenus
    """
    return sum(
        r.get("credit_obtenu", 0.0) 
        for r in resultats_matieres 
        if r.get("credit_obtenu") is not None
    )


def calculer_credits_capitalises(
    resultats_matieres: List[dict],
) -> float:
    """
    Calcule le total des crédits capitalisés (matières validées définitivement).
    
    Args:
        resultats_matieres: Liste de dictionnaires avec 'credit_obtenu' et 'statut'
        
    Returns:
        Le total des crédits capitalisés
    """
    return sum(
        r.get("credit_obtenu", 0.0) 
        for r in resultats_matieres 
        if r.get("statut") == "valide" and r.get("credit_obtenu") is not None
    )


def determiner_decision_semestre(
    moyenne: Optional[float],
    credits_obtenus: float,
    credits_inscrits: float,
    seuil_moyenne: float = 10.0,
    seuil_credits: float = 0.7,
) -> str:
    """
    Détermine la décision pour un semestre.
    
    Règles :
    - Admis : moyenne >= 10 ET >= 70% des crédits
    - Admis avec dette : moyenne >= 10 mais < 70% des crédits
    - Ajourné : moyenne < 10
    
    Args:
        moyenne: La moyenne du semestre
        credits_obtenus: Crédits obtenus
        credits_inscrits: Crédits inscrits
        seuil_moyenne: Seuil de validation (défaut 10)
        seuil_credits: Pourcentage minimum de crédits (défaut 70%)
        
    Returns:
        La décision ("admis", "admis_avec_dette", "ajourne")
    """
    if moyenne is None:
        return "en_cours"
    
    if credits_inscrits == 0:
        return "en_cours"
    
    taux_credits = credits_obtenus / credits_inscrits
    
    if moyenne >= seuil_moyenne:
        if taux_credits >= seuil_credits:
            return "admis"
        else:
            return "admis_avec_dette"
    else:
        return "ajourne"


def determiner_decision_annuelle(
    moyenne_annuelle: Optional[float],
    credits_obtenus: float,
    credits_inscrits: float,
    nombre_redoublements: int = 0,
    max_redoublements: int = 2,
    seuil_moyenne: float = 10.0,
    seuil_credits: float = 0.7,
) -> Tuple[str, bool]:
    """
    Détermine la décision annuelle et le passage au niveau supérieur.
    
    Args:
        moyenne_annuelle: La moyenne annuelle
        credits_obtenus: Crédits obtenus sur l'année
        credits_inscrits: Crédits inscrits sur l'année
        nombre_redoublements: Nombre de redoublements déjà effectués
        max_redoublements: Nombre maximum de redoublements autorisés
        seuil_moyenne: Seuil de validation (défaut 10)
        seuil_credits: Pourcentage minimum de crédits (défaut 70%)
        
    Returns:
        Tuple (décision, passage_niveau_superieur)
    """
    if moyenne_annuelle is None:
        return ("en_cours", False)
    
    if credits_inscrits == 0:
        return ("en_cours", False)
    
    taux_credits = credits_obtenus / credits_inscrits
    
    if moyenne_annuelle >= seuil_moyenne and taux_credits >= seuil_credits:
        return ("admis", True)
    elif moyenne_annuelle >= seuil_moyenne:
        return ("admis_avec_dette", True)
    elif nombre_redoublements >= max_redoublements:
        return ("exclus", False)
    else:
        return ("redouble", False)


def calculer_rang(
    moyenne: float,
    moyennes_classe: List[float],
) -> Tuple[int, int]:
    """
    Calcule le rang d'un étudiant dans sa classe.
    
    Args:
        moyenne: La moyenne de l'étudiant
        moyennes_classe: Liste de toutes les moyennes de la classe
        
    Returns:
        Tuple (rang, effectif)
    """
    if not moyennes_classe:
        return (1, 1)
    
    # Trier les moyennes en ordre décroissant
    moyennes_triees = sorted(moyennes_classe, reverse=True)
    effectif = len(moyennes_triees)
    
    # Trouver le rang (1-indexed)
    rang = 1
    for m in moyennes_triees:
        if m > moyenne:
            rang += 1
        else:
            break
    
    return (rang, effectif)


def convertir_note_sur_20(
    note: float,
    note_sur: float,
) -> float:
    """
    Convertit une note sur un barème quelconque en note sur 20.
    
    Args:
        note: La note obtenue
        note_sur: Le barème de la note
        
    Returns:
        La note ramenée sur 20
    """
    if note_sur == 0:
        return 0.0
    return round((note / note_sur) * 20, 2)


def calculer_taux_reussite(
    nombre_admis: int,
    nombre_total: int,
) -> Optional[float]:
    """
    Calcule le taux de réussite.
    
    Args:
        nombre_admis: Nombre d'étudiants admis
        nombre_total: Nombre total d'étudiants
        
    Returns:
        Le taux de réussite en pourcentage ou None si pas d'étudiants
    """
    if nombre_total == 0:
        return None
    return round((nombre_admis / nombre_total) * 100, 2)
