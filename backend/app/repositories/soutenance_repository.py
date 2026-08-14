"""
Repository pour la gestion des soutenances.
"""

from typing import List, Optional
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.soutenance import Soutenance
from app.models.stage import Stage
from app.repositories.base_repository import BaseRepository


class SoutenanceRepository(BaseRepository[Soutenance, None, None]):
    """Repository pour les opérations CRUD sur les soutenances."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Soutenance
    
    def get_by_stage(self, stage_id: int) -> Optional[Soutenance]:
        """Récupère la soutenance d'un stage."""
        return self.db.query(Soutenance).filter(
            Soutenance.stage_id == stage_id
        ).first()
    
    def get_by_jury(self, user_id: int) -> List[Soutenance]:
        """Récupère les soutenances où l'utilisateur est membre du jury."""
        return self.db.query(Soutenance).filter(
            (Soutenance.president_jury_id == user_id) |
            (Soutenance.rapporteur_id == user_id) |
            (Soutenance.examinateur_id == user_id)
        ).order_by(Soutenance.date_soutenance.desc()).all()
    
    def get_by_date_range(
        self,
        date_debut: date,
        date_fin: date
    ) -> List[Soutenance]:
        """Récupère les soutenances dans une plage de dates."""
        return self.db.query(Soutenance).filter(
            func.date(Soutenance.date_soutenance) >= date_debut,
            func.date(Soutenance.date_soutenance) <= date_fin
        ).order_by(Soutenance.date_soutenance).all()
    
    def get_by_salle(self, salle_id: int, d: date) -> List[Soutenance]:
        """Récupère les soutenances dans une salle pour une date."""
        return self.db.query(Soutenance).filter(
            Soutenance.salle_id == salle_id,
            func.date(Soutenance.date_soutenance) == d
        ).order_by(Soutenance.date_soutenance).all()
    
    def get_programmees(self) -> List[Soutenance]:
        """Récupère les soutenances programmées."""
        return self.db.query(Soutenance).filter(
            Soutenance.statut == "programmee"
        ).order_by(Soutenance.date_soutenance).all()
    
    def get_a_venir(self, jours: int = 7) -> List[Soutenance]:
        """Récupère les soutenances à venir dans les X prochains jours."""
        from datetime import timedelta
        date_limite = datetime.utcnow() + timedelta(days=jours)
        
        return self.db.query(Soutenance).filter(
            Soutenance.statut == "programmee",
            Soutenance.date_soutenance >= datetime.utcnow(),
            Soutenance.date_soutenance <= date_limite
        ).order_by(Soutenance.date_soutenance).all()
    
    def get_by_niveau(self, niveau_id: int) -> List[Soutenance]:
        """Récupère les soutenances d'un niveau."""
        return self.db.query(Soutenance).join(Stage).filter(
            Stage.niveau_id == niveau_id
        ).order_by(Soutenance.date_soutenance.desc()).all()
    
    def count_by_statut(self) -> dict:
        """Compte les soutenances par statut."""
        results = self.db.query(
            Soutenance.statut,
            func.count(Soutenance.id)
        ).group_by(Soutenance.statut).all()
        
        return {r[0]: r[1] for r in results}
