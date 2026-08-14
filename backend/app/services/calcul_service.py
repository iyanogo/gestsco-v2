from typing import List, Dict, Any, Optional
from decimal import Decimal
from sqlalchemy.orm import Session

from app.repositories.parametre_repository import parametre_repository
from app.repositories.bareme_notation_repository import bareme_notation_repository
from app.repositories.regle_calcul_repository import regle_calcul_repository


def calculer_moyenne(db: Session, notes: List[float], coefficients: List[float], cycle_id: Optional[int] = None) -> float:
    """Calcule la moyenne pondérée en utilisant les règles configurées"""
    if not notes or not coefficients or len(notes) != len(coefficients):
        return 0.0
    
    # Chercher une règle de calcul spécifique
    regles = regle_calcul_repository.get_by_type(db, "moyenne_matiere", cycle_id)
    
    if regles:
        # Utiliser la première règle trouvée
        regle = regles[0]
        donnees = {"notes": notes, "coefficients": coefficients}
        result = regle_calcul_repository.executer_regle(db, regle.id, donnees)
        if result is not None and not isinstance(result, dict):
            return float(result)
    
    # Calcul par défaut : moyenne pondérée
    total = sum(n * c for n, c in zip(notes, coefficients))
    total_coef = sum(coefficients)
    
    if total_coef == 0:
        return 0.0
    
    precision = parametre_repository.get_valeur(db, "precision_notes", 2)
    return round(total / total_coef, precision)


def determiner_mention(db: Session, moyenne: float, cycle_id: Optional[int] = None) -> str:
    """Détermine la mention pour une moyenne donnée"""
    # Chercher le barème applicable
    bareme = None
    if cycle_id:
        bareme = bareme_notation_repository.get_by_cycle(db, cycle_id)
    if not bareme:
        bareme = bareme_notation_repository.get_defaut(db)
    
    if not bareme:
        # Mentions par défaut si pas de barème configuré
        if moyenne >= 16:
            return "Très Bien"
        elif moyenne >= 14:
            return "Bien"
        elif moyenne >= 12:
            return "Assez Bien"
        elif moyenne >= 10:
            return "Passable"
        else:
            return "Insuffisant"
    
    # Utiliser le barème configuré
    mention = bareme_notation_repository.determiner_mention(db, bareme.id, moyenne)
    if mention:
        return mention.libelle
    
    return "Non défini"


def valider_credits(db: Session, resultats: Dict[str, Any], cycle_id: Optional[int] = None) -> bool:
    """Valide si les crédits sont acquis selon les règles configurées"""
    note = resultats.get("note", 0)
    note_passage = parametre_repository.get_valeur(db, "note_passage", 10)
    
    # Chercher une règle de validation spécifique
    regles = regle_calcul_repository.get_by_type(db, "validation_credits", cycle_id)
    
    if regles:
        regle = regles[0]
        result = regle_calcul_repository.executer_regle(db, regle.id, resultats)
        if result is not None:
            return bool(result)
    
    # Validation par défaut
    return note >= note_passage


def appliquer_compensation(db: Session, resultats: Dict[str, Any], cycle_id: Optional[int] = None) -> Dict[str, Any]:
    """Applique les règles de compensation"""
    compensation_autorisee = parametre_repository.get_valeur(db, "compensation_autorisee", True)
    
    if not compensation_autorisee:
        return resultats
    
    seuil_compensation = parametre_repository.get_valeur(db, "seuil_compensation", 8)
    note_eliminatoire = parametre_repository.get_valeur(db, "note_eliminatoire", 5)
    
    # Chercher une règle de compensation spécifique
    regles = regle_calcul_repository.get_by_type(db, "compensation", cycle_id)
    
    if regles:
        regle = regles[0]
        result = regle_calcul_repository.executer_regle(db, regle.id, resultats)
        if result is not None and isinstance(result, dict):
            return result
    
    # Compensation par défaut
    moyenne = resultats.get("moyenne", 0)
    notes = resultats.get("notes", [])
    
    # Vérifier s'il y a des notes éliminatoires
    has_eliminatoire = any(n < note_eliminatoire for n in notes)
    
    if has_eliminatoire:
        resultats["compensation_possible"] = False
        resultats["raison"] = f"Note inférieure à {note_eliminatoire}"
    elif moyenne >= seuil_compensation:
        resultats["compensation_possible"] = True
        resultats["compensee"] = True
    else:
        resultats["compensation_possible"] = False
        resultats["raison"] = f"Moyenne inférieure au seuil de {seuil_compensation}"
    
    return resultats


def calculer_credits_acquis(db: Session, notes_matieres: List[Dict[str, Any]], cycle_id: Optional[int] = None) -> int:
    """Calcule le total des crédits acquis"""
    note_passage = parametre_repository.get_valeur(db, "note_passage", 10)
    total_credits = 0
    
    for matiere in notes_matieres:
        note = matiere.get("note", 0)
        credits = matiere.get("credits", 0)
        
        if note >= note_passage:
            total_credits += credits
    
    return total_credits


def verifier_passage_annee(db: Session, resultats_annee: Dict[str, Any], cycle_id: Optional[int] = None) -> Dict[str, Any]:
    """Vérifie si l'étudiant peut passer à l'année suivante"""
    credits_obtenus = resultats_annee.get("credits_obtenus", 0)
    credits_requis = parametre_repository.get_valeur(db, "credits_par_annee", 60)
    moyenne_annuelle = resultats_annee.get("moyenne_annuelle", 0)
    note_passage = parametre_repository.get_valeur(db, "note_passage", 10)
    
    # Chercher une règle de délibération spécifique
    regles = regle_calcul_repository.get_by_type(db, "deliberation", cycle_id)
    
    if regles:
        regle = regles[0]
        result = regle_calcul_repository.executer_regle(db, regle.id, resultats_annee)
        if result is not None and isinstance(result, dict):
            return result
    
    # Règles par défaut
    decision = {
        "credits_obtenus": credits_obtenus,
        "credits_requis": credits_requis,
        "moyenne_annuelle": moyenne_annuelle,
        "passage_autorise": False,
        "decision": "Ajourné",
        "observations": []
    }
    
    if credits_obtenus >= credits_requis and moyenne_annuelle >= note_passage:
        decision["passage_autorise"] = True
        decision["decision"] = "Admis"
    elif credits_obtenus >= credits_requis * 0.8 and moyenne_annuelle >= note_passage:
        decision["passage_autorise"] = True
        decision["decision"] = "Admis avec dette"
        decision["observations"].append(f"Crédits manquants: {credits_requis - credits_obtenus}")
    else:
        decision["observations"].append(f"Crédits insuffisants: {credits_obtenus}/{credits_requis}")
        if moyenne_annuelle < note_passage:
            decision["observations"].append(f"Moyenne insuffisante: {moyenne_annuelle}")
    
    return decision
