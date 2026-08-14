"""
Repository pour la gestion des périodes comptables.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session

from app.models.periode_comptable import PeriodeComptable
from app.repositories.base_repository import BaseRepository


class PeriodeComptableRepository(BaseRepository[PeriodeComptable, None, None]):
    """Repository pour les opérations CRUD sur les périodes comptables."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = PeriodeComptable
    
    def get_by_code(self, code: str) -> Optional[PeriodeComptable]:
        """Récupère une période par son code."""
        return self.db.query(PeriodeComptable).filter(
            PeriodeComptable.code == code
        ).first()
    
    def get_by_annee(self, annee_id: int) -> List[PeriodeComptable]:
        """Récupère toutes les périodes d'une année."""
        return self.db.query(PeriodeComptable).filter(
            PeriodeComptable.annee_academique_id == annee_id
        ).order_by(PeriodeComptable.date_debut).all()
    
    def get_courante(self) -> Optional[PeriodeComptable]:
        """Récupère la période comptable courante."""
        return self.db.query(PeriodeComptable).filter(
            PeriodeComptable.est_periode_courante == True,
            PeriodeComptable.statut == "ouverte"
        ).first()
    
    def get_ouvertes(self) -> List[PeriodeComptable]:
        """Récupère toutes les périodes ouvertes."""
        return self.db.query(PeriodeComptable).filter(
            PeriodeComptable.statut == "ouverte"
        ).all()
    
    def get_par_date(self, d: date) -> Optional[PeriodeComptable]:
        """Récupère la période contenant une date donnée."""
        return self.db.query(PeriodeComptable).filter(
            PeriodeComptable.date_debut <= d,
            PeriodeComptable.date_fin >= d,
            PeriodeComptable.statut == "ouverte"
        ).first()
