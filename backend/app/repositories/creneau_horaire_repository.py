"""
Repository pour la gestion des créneaux horaires
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.creneau_horaire import CreneauHoraire
from app.repositories.base_repository import BaseRepository
from app.schemas.creneau_horaire import CreneauHoraireCreate, CreneauHoraireUpdate


class CreneauHoraireRepository(BaseRepository[CreneauHoraire, CreneauHoraireCreate, CreneauHoraireUpdate]):
    """Repository pour les opérations CRUD sur les créneaux horaires"""

    def __init__(self):
        super().__init__(CreneauHoraire)

    def get_by_periode(self, db: Session, periode: str) -> List[CreneauHoraire]:
        """Retourne les créneaux d'une période donnée"""
        return db.query(CreneauHoraire).filter(
            CreneauHoraire.periode == periode,
            CreneauHoraire.is_active == True
        ).order_by(CreneauHoraire.ordre).all()

    def get_ordered(self, db: Session) -> List[CreneauHoraire]:
        """Retourne les créneaux triés par ordre"""
        return db.query(CreneauHoraire).filter(
            CreneauHoraire.is_active == True
        ).order_by(CreneauHoraire.ordre).all()

    def get_by_code(self, db: Session, code: str) -> Optional[CreneauHoraire]:
        """Retourne un créneau par son code"""
        return db.query(CreneauHoraire).filter(CreneauHoraire.code == code).first()


creneau_horaire_repository = CreneauHoraireRepository()
