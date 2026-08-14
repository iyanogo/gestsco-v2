"""
Repository pour la gestion des salles
"""
from datetime import date, time
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.salle import Salle
from app.models.seance import Seance
from app.models.reservation_salle import ReservationSalle
from app.repositories.base_repository import BaseRepository
from app.schemas.salle import SalleCreate, SalleUpdate, SalleWithDisponibilite
from app.utils.emploi_temps_utils import verifier_disponibilite_salle


class SalleRepository(BaseRepository[Salle, SalleCreate, SalleUpdate]):
    """Repository pour les opérations CRUD sur les salles"""

    def __init__(self):
        super().__init__(Salle)

    def get_by_batiment(self, db: Session, batiment_id: int) -> List[Salle]:
        """Retourne toutes les salles d'un bâtiment"""
        return db.query(Salle).filter(
            Salle.batiment_id == batiment_id,
            Salle.is_active == True
        ).order_by(Salle.libelle).all()

    def get_by_type(self, db: Session, type_salle: str) -> List[Salle]:
        """Retourne toutes les salles d'un type donné"""
        return db.query(Salle).filter(
            Salle.type_salle == type_salle,
            Salle.is_active == True
        ).order_by(Salle.libelle).all()

    def get_by_capacite_min(self, db: Session, capacite_min: int) -> List[Salle]:
        """Retourne les salles avec capacité >= capacite_min"""
        return db.query(Salle).filter(
            Salle.capacite >= capacite_min,
            Salle.is_active == True
        ).order_by(Salle.capacite).all()

    def get_disponibles(
        self,
        db: Session,
        date_check: date,
        heure_debut: time,
        heure_fin: time,
        capacite_min: Optional[int] = None,
        type_salle: Optional[str] = None
    ) -> List[Salle]:
        """Retourne les salles disponibles sur le créneau"""
        query = db.query(Salle).filter(Salle.is_active == True)
        
        if capacite_min:
            query = query.filter(Salle.capacite >= capacite_min)
        
        if type_salle:
            query = query.filter(Salle.type_salle == type_salle)
        
        salles = query.all()
        
        # Filtrer les salles disponibles
        salles_disponibles = []
        for salle in salles:
            if verifier_disponibilite_salle(db, salle.id, date_check, heure_debut, heure_fin):
                salles_disponibles.append(salle)
        
        return salles_disponibles

    def get_with_disponibilite(
        self,
        db: Session,
        date_check: date,
        creneau_id: int
    ) -> List[dict]:
        """Retourne toutes les salles avec leur statut de disponibilité"""
        from app.models.creneau_horaire import CreneauHoraire
        
        # Récupérer le créneau
        creneau = db.query(CreneauHoraire).filter(CreneauHoraire.id == creneau_id).first()
        if not creneau:
            return []
        
        salles = db.query(Salle).filter(Salle.is_active == True).all()
        
        result = []
        for salle in salles:
            est_disponible = verifier_disponibilite_salle(
                db, salle.id, date_check, creneau.heure_debut, creneau.heure_fin
            )
            
            # Trouver la prochaine séance si non disponible
            prochaine_seance = None
            if not est_disponible:
                seance = db.query(Seance).filter(
                    Seance.salle_id == salle.id,
                    Seance.date_seance == date_check,
                    Seance.creneau_id == creneau_id,
                    Seance.statut.notin_(["annulee", "reportee"])
                ).first()
                if seance:
                    prochaine_seance = seance.date_seance
            
            result.append({
                "id": salle.id,
                "code": salle.code,
                "libelle": salle.libelle,
                "batiment_id": salle.batiment_id,
                "type_salle": salle.type_salle,
                "etage": salle.etage,
                "capacite": salle.capacite,
                "superficie": salle.superficie,
                "equipements": salle.equipements,
                "description": salle.description,
                "is_accessible_pmr": salle.is_accessible_pmr,
                "is_active": salle.is_active,
                "created_at": salle.created_at,
                "updated_at": salle.updated_at,
                "est_disponible": est_disponible,
                "prochaine_seance": prochaine_seance
            })
        
        return result

    def get_by_code(self, db: Session, code: str) -> Optional[Salle]:
        """Retourne une salle par son code"""
        return db.query(Salle).filter(Salle.code == code).first()


salle_repository = SalleRepository()
