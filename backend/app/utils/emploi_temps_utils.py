"""
Utilitaires pour la gestion des emplois du temps
"""
from datetime import date, time, datetime, timedelta
from typing import Optional, List
import uuid

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.seance import Seance
from app.models.reservation_salle import ReservationSalle
from app.models.presence import Presence


def verifier_disponibilite_salle(
    db: Session,
    salle_id: int,
    date_check: date,
    heure_debut: time,
    heure_fin: time,
    seance_id_exclue: Optional[int] = None
) -> bool:
    """
    Vérifie si une salle est disponible sur un créneau donné.
    
    Args:
        db: Session de base de données
        salle_id: ID de la salle à vérifier
        date_check: Date à vérifier
        heure_debut: Heure de début du créneau
        heure_fin: Heure de fin du créneau
        seance_id_exclue: ID de séance à exclure (pour les mises à jour)
    
    Returns:
        True si la salle est disponible, False sinon
    """
    # Vérifier les séances existantes
    query = db.query(Seance).filter(
        Seance.salle_id == salle_id,
        Seance.date_seance == date_check,
        Seance.statut.notin_(["annulee", "reportee"])
    )
    
    if seance_id_exclue:
        query = query.filter(Seance.id != seance_id_exclue)
    
    # Récupérer les séances du jour pour cette salle
    seances = query.all()
    
    for seance in seances:
        if seance.creneau:
            creneau_debut = seance.creneau.heure_debut
            creneau_fin = seance.creneau.heure_fin
            
            # Vérifier le chevauchement
            if not (heure_fin <= creneau_debut or heure_debut >= creneau_fin):
                return False
    
    # Vérifier les réservations approuvées
    reservations = db.query(ReservationSalle).filter(
        ReservationSalle.salle_id == salle_id,
        ReservationSalle.date_reservation == date_check,
        ReservationSalle.statut == "approuvee"
    ).all()
    
    for reservation in reservations:
        # Vérifier le chevauchement
        if not (heure_fin <= reservation.heure_debut or heure_debut >= reservation.heure_fin):
            return False
    
    return True


def verifier_disponibilite_enseignant(
    db: Session,
    enseignant_id: int,
    date_check: date,
    creneau_id: int,
    seance_id_exclue: Optional[int] = None
) -> bool:
    """
    Vérifie si un enseignant est disponible sur un créneau donné.
    
    Args:
        db: Session de base de données
        enseignant_id: ID de l'enseignant à vérifier
        date_check: Date à vérifier
        creneau_id: ID du créneau horaire
        seance_id_exclue: ID de séance à exclure (pour les mises à jour)
    
    Returns:
        True si l'enseignant est disponible, False sinon
    """
    query = db.query(Seance).filter(
        Seance.enseignant_id == enseignant_id,
        Seance.date_seance == date_check,
        Seance.creneau_id == creneau_id,
        Seance.statut.notin_(["annulee", "reportee"])
    )
    
    if seance_id_exclue:
        query = query.filter(Seance.id != seance_id_exclue)
    
    return query.count() == 0


def verifier_conflit_niveau(
    db: Session,
    niveau_id: int,
    filiere_id: Optional[int],
    date_check: date,
    creneau_id: int,
    seance_id_exclue: Optional[int] = None
) -> bool:
    """
    Vérifie s'il n'y a pas de conflit pour un niveau/filière sur un créneau.
    
    Returns:
        True si pas de conflit, False sinon
    """
    query = db.query(Seance).filter(
        Seance.niveau_id == niveau_id,
        Seance.date_seance == date_check,
        Seance.creneau_id == creneau_id,
        Seance.statut.notin_(["annulee", "reportee"])
    )
    
    if filiere_id:
        query = query.filter(
            or_(Seance.filiere_id == filiere_id, Seance.filiere_id.is_(None))
        )
    
    if seance_id_exclue:
        query = query.filter(Seance.id != seance_id_exclue)
    
    return query.count() == 0


def generer_code_seance(matiere_code: str, date_seance: date, creneau_code: str) -> str:
    """
    Génère un code unique pour une séance.
    
    Format: {MATIERE_CODE}-{YYYYMMDD}-{CRENEAU_CODE}-{UUID4_SHORT}
    
    Args:
        matiere_code: Code de la matière
        date_seance: Date de la séance
        creneau_code: Code du créneau
    
    Returns:
        Code unique de la séance
    """
    date_str = date_seance.strftime("%Y%m%d")
    unique_suffix = str(uuid.uuid4())[:6].upper()
    return f"{matiere_code}-{date_str}-{creneau_code}-{unique_suffix}"


def generer_numero_reservation() -> str:
    """
    Génère un numéro de réservation unique.
    
    Format: RES-YYYY-XXXXX
    
    Returns:
        Numéro de réservation unique
    """
    year = datetime.now().year
    unique_id = str(uuid.uuid4().int)[:5]
    return f"RES-{year}-{unique_id}"


def calculer_taux_presence_etudiant(
    db: Session,
    etudiant_id: int,
    annee_academique_id: Optional[int] = None,
    semestre: Optional[int] = None,
    matiere_id: Optional[int] = None
) -> dict:
    """
    Calcule le taux de présence d'un étudiant.
    
    Args:
        db: Session de base de données
        etudiant_id: ID de l'étudiant
        annee_academique_id: ID de l'année académique (optionnel)
        semestre: Numéro du semestre (optionnel)
        matiere_id: ID de la matière (optionnel)
    
    Returns:
        Dictionnaire avec les statistiques de présence
    """
    query = db.query(Presence).join(Seance).filter(
        Presence.etudiant_id == etudiant_id,
        Seance.statut == "terminee"
    )
    
    if annee_academique_id:
        query = query.filter(Seance.annee_academique_id == annee_academique_id)
    
    if semestre:
        query = query.filter(Seance.semestre == semestre)
    
    if matiere_id:
        query = query.filter(Seance.matiere_id == matiere_id)
    
    presences = query.all()
    
    total = len(presences)
    if total == 0:
        return {
            "total_seances": 0,
            "presences": 0,
            "absences": 0,
            "retards": 0,
            "absences_justifiees": 0,
            "taux_presence": 0.0
        }
    
    stats = {
        "total_seances": total,
        "presences": sum(1 for p in presences if p.statut == "present"),
        "absences": sum(1 for p in presences if p.statut == "absent"),
        "retards": sum(1 for p in presences if p.statut == "retard"),
        "absences_justifiees": sum(1 for p in presences if p.statut == "absent_justifie"),
    }
    
    # Présences effectives = présents + retards + absences justifiées
    presences_effectives = stats["presences"] + stats["retards"] + stats["absences_justifiees"]
    stats["taux_presence"] = round((presences_effectives / total) * 100, 2)
    
    return stats


def get_seances_semaine(
    db: Session,
    niveau_id: int,
    filiere_id: Optional[int],
    date_debut: date,
    annee_academique_id: Optional[int] = None
) -> List[Seance]:
    """
    Récupère les séances d'une semaine pour un niveau/filière.
    
    Args:
        db: Session de base de données
        niveau_id: ID du niveau
        filiere_id: ID de la filière (optionnel)
        date_debut: Date de début de la semaine (lundi)
        annee_academique_id: ID de l'année académique (optionnel)
    
    Returns:
        Liste des séances de la semaine
    """
    # Calculer la date de fin (dimanche)
    date_fin = date_debut + timedelta(days=6)
    
    query = db.query(Seance).filter(
        Seance.niveau_id == niveau_id,
        Seance.date_seance >= date_debut,
        Seance.date_seance <= date_fin,
        Seance.statut.notin_(["annulee"])
    )
    
    if filiere_id:
        query = query.filter(
            or_(Seance.filiere_id == filiere_id, Seance.filiere_id.is_(None))
        )
    
    if annee_academique_id:
        query = query.filter(Seance.annee_academique_id == annee_academique_id)
    
    return query.order_by(Seance.date_seance, Seance.creneau_id).all()


def get_seances_enseignant_semaine(
    db: Session,
    enseignant_id: int,
    date_debut: date
) -> List[Seance]:
    """
    Récupère les séances d'un enseignant pour une semaine.
    
    Args:
        db: Session de base de données
        enseignant_id: ID de l'enseignant
        date_debut: Date de début de la semaine (lundi)
    
    Returns:
        Liste des séances de la semaine
    """
    date_fin = date_debut + timedelta(days=6)
    
    return db.query(Seance).filter(
        Seance.enseignant_id == enseignant_id,
        Seance.date_seance >= date_debut,
        Seance.date_seance <= date_fin,
        Seance.statut.notin_(["annulee"])
    ).order_by(Seance.date_seance, Seance.creneau_id).all()


def get_jour_semaine(date_check: date) -> int:
    """
    Retourne le jour de la semaine (1=Lundi, 7=Dimanche).
    
    Args:
        date_check: Date à vérifier
    
    Returns:
        Numéro du jour (1-7)
    """
    return date_check.isoweekday()


def get_lundi_semaine(date_check: date) -> date:
    """
    Retourne le lundi de la semaine contenant la date donnée.
    
    Args:
        date_check: Date quelconque
    
    Returns:
        Date du lundi de cette semaine
    """
    jour = date_check.isoweekday()
    return date_check - timedelta(days=jour - 1)


def generer_seances_recurrentes(
    seance_base: dict,
    date_fin_recurrence: date,
    jours_semaine: List[int]
) -> List[dict]:
    """
    Génère une liste de séances récurrentes.
    
    Args:
        seance_base: Dictionnaire avec les données de base de la séance
        date_fin_recurrence: Date de fin de la récurrence
        jours_semaine: Liste des jours de la semaine (1=Lundi, 7=Dimanche)
    
    Returns:
        Liste de dictionnaires représentant les séances à créer
    """
    seances = []
    date_courante = seance_base["date_seance"]
    
    while date_courante <= date_fin_recurrence:
        jour = get_jour_semaine(date_courante)
        
        if jour in jours_semaine:
            seance = seance_base.copy()
            seance["date_seance"] = date_courante
            seance["jour_semaine"] = jour
            seance["est_recurrente"] = True
            seances.append(seance)
        
        date_courante += timedelta(days=1)
    
    return seances


def calculer_duree_creneau(heure_debut: time, heure_fin: time) -> int:
    """
    Calcule la durée en minutes entre deux heures.
    
    Args:
        heure_debut: Heure de début
        heure_fin: Heure de fin
    
    Returns:
        Durée en minutes
    """
    debut = datetime.combine(date.today(), heure_debut)
    fin = datetime.combine(date.today(), heure_fin)
    delta = fin - debut
    return int(delta.total_seconds() / 60)


JOURS_SEMAINE_LABELS = {
    1: "Lundi",
    2: "Mardi",
    3: "Mercredi",
    4: "Jeudi",
    5: "Vendredi",
    6: "Samedi",
    7: "Dimanche"
}


def get_jour_semaine_label(jour: int) -> str:
    """
    Retourne le libellé du jour de la semaine.
    
    Args:
        jour: Numéro du jour (1-7)
    
    Returns:
        Libellé du jour
    """
    return JOURS_SEMAINE_LABELS.get(jour, "Inconnu")
