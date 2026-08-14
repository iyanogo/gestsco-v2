"""
Service pour le calcul des résultats académiques
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.repositories import (
    resultat_matiere_repository,
    resultat_semestre_repository,
    resultat_annuel_repository,
    session_examen_repository,
)
from app.utils.calcul_notes import calculer_moyenne_ponderee


def calculer_tous_resultats_session(db: Session, session_id: int) -> dict:
    """
    Calcule tous les résultats d'une session d'examen.
    
    Cette fonction orchestre le calcul complet :
    1. Calcul des résultats par matière
    2. Calcul des résultats semestriels
    
    Args:
        db: Session de base de données
        session_id: ID de la session d'examen
        
    Returns:
        Dictionnaire avec les statistiques du calcul
    """
    # Récupérer la session
    session = session_examen_repository.get_by_id(db, session_id)
    if not session:
        raise ValueError(f"Session {session_id} non trouvée")
    
    stats = {
        "session_id": session_id,
        "session_code": session.code,
        "semestre": session.semestre,
        "resultats_matieres": 0,
        "resultats_semestres": 0,
        "erreurs": []
    }
    
    # 1. Calculer les résultats matières
    try:
        count_matieres = resultat_matiere_repository.calculer_resultats_session(db, session_id)
        stats["resultats_matieres"] = count_matieres
    except Exception as e:
        stats["erreurs"].append(f"Erreur calcul matières: {str(e)}")
    
    # 2. Calculer les résultats semestriels
    try:
        count_semestres = resultat_semestre_repository.calculer_resultats_session_semestre(
            db, session_id, session.semestre
        )
        stats["resultats_semestres"] = count_semestres
    except Exception as e:
        stats["erreurs"].append(f"Erreur calcul semestres: {str(e)}")
    
    return stats


def calculer_tous_resultats_annee(
    db: Session,
    niveau_id: int,
    annee_id: int,
    filiere_id: Optional[int] = None
) -> dict:
    """
    Calcule tous les résultats annuels pour un niveau.
    
    Args:
        db: Session de base de données
        niveau_id: ID du niveau
        annee_id: ID de l'année académique
        filiere_id: ID de la filière (optionnel)
        
    Returns:
        Dictionnaire avec les statistiques du calcul
    """
    stats = {
        "niveau_id": niveau_id,
        "annee_id": annee_id,
        "filiere_id": filiere_id,
        "resultats_annuels": 0,
        "erreurs": []
    }
    
    try:
        count = resultat_annuel_repository.calculer_resultats_niveau(db, niveau_id, annee_id)
        stats["resultats_annuels"] = count
    except Exception as e:
        stats["erreurs"].append(f"Erreur calcul annuels: {str(e)}")
    
    return stats


def calculer_classement_complet(
    db: Session,
    niveau_id: int,
    filiere_id: int,
    session_id: int,
    semestre: int
) -> list[dict]:
    """
    Calcule le classement complet avec rangs pour un semestre.
    
    Args:
        db: Session de base de données
        niveau_id: ID du niveau
        filiere_id: ID de la filière
        session_id: ID de la session
        semestre: Numéro du semestre
        
    Returns:
        Liste des résultats avec rangs
    """
    # Récupérer le classement
    resultats = resultat_semestre_repository.get_classement(
        db, niveau_id, filiere_id, session_id, semestre
    )
    
    # Calculer et enregistrer les rangs
    resultat_semestre_repository.calculer_rangs(
        db, niveau_id, filiere_id, session_id, semestre
    )
    
    # Formater le classement
    classement = []
    effectif = len(resultats)
    
    for rang, resultat in enumerate(resultats, 1):
        classement.append({
            "rang": rang,
            "effectif": effectif,
            "etudiant_id": resultat.etudiant_id,
            "inscription_id": resultat.inscription_id,
            "moyenne_generale": resultat.moyenne_generale,
            "total_credits_inscrits": resultat.total_credits_inscrits,
            "total_credits_obtenus": resultat.total_credits_obtenus,
            "total_credits_capitalises": resultat.total_credits_capitalises,
            "nombre_matieres": resultat.nombre_matieres,
            "nombre_matieres_validees": resultat.nombre_matieres_validees,
            "mention": resultat.mention,
            "decision": resultat.decision,
        })
    
    return classement


def calculer_classement_annuel_complet(
    db: Session,
    niveau_id: int,
    filiere_id: int,
    annee_id: int
) -> list[dict]:
    """
    Calcule le classement annuel complet avec rangs.
    
    Args:
        db: Session de base de données
        niveau_id: ID du niveau
        filiere_id: ID de la filière
        annee_id: ID de l'année académique
        
    Returns:
        Liste des résultats avec rangs
    """
    # Récupérer le classement
    resultats = resultat_annuel_repository.get_classement_annuel(
        db, niveau_id, filiere_id, annee_id
    )
    
    # Calculer et enregistrer les rangs
    resultat_annuel_repository.calculer_rangs_annuels(
        db, niveau_id, filiere_id, annee_id
    )
    
    # Formater le classement
    classement = []
    effectif = len(resultats)
    
    for rang, resultat in enumerate(resultats, 1):
        classement.append({
            "rang": rang,
            "effectif": effectif,
            "etudiant_id": resultat.etudiant_id,
            "inscription_id": resultat.inscription_id,
            "moyenne_annuelle": resultat.moyenne_annuelle,
            "moyenne_semestre1": resultat.moyenne_semestre1,
            "moyenne_semestre2": resultat.moyenne_semestre2,
            "total_credits_inscrits": resultat.total_credits_inscrits,
            "total_credits_obtenus": resultat.total_credits_obtenus,
            "total_credits_capitalises": resultat.total_credits_capitalises,
            "mention": resultat.mention,
            "decision": resultat.decision,
            "passage_niveau_superieur": resultat.passage_niveau_superieur,
        })
    
    return classement


def calculer_statistiques_promotion(
    db: Session,
    niveau_id: int,
    filiere_id: int,
    session_id: int,
    semestre: int
) -> dict:
    """
    Calcule les statistiques globales d'une promotion pour un semestre.
    
    Args:
        db: Session de base de données
        niveau_id: ID du niveau
        filiere_id: ID de la filière
        session_id: ID de la session
        semestre: Numéro du semestre
        
    Returns:
        Dictionnaire avec les statistiques
    """
    resultats = resultat_semestre_repository.get_classement(
        db, niveau_id, filiere_id, session_id, semestre
    )
    
    if not resultats:
        return {
            "effectif": 0,
            "moyenne_promotion": None,
            "min": None,
            "max": None,
            "admis": 0,
            "ajournes": 0,
            "taux_reussite": None
        }
    
    moyennes = [r.moyenne_generale for r in resultats if r.moyenne_generale is not None]
    admis = len([r for r in resultats if r.decision in ("admis", "admis_avec_dette")])
    ajournes = len([r for r in resultats if r.decision == "ajourne"])
    
    return {
        "effectif": len(resultats),
        "moyenne_promotion": round(sum(moyennes) / len(moyennes), 2) if moyennes else None,
        "min": min(moyennes) if moyennes else None,
        "max": max(moyennes) if moyennes else None,
        "admis": admis,
        "ajournes": ajournes,
        "taux_reussite": round((admis / len(resultats)) * 100, 2) if resultats else None
    }
