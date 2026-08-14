"""
Repository pour la gestion des stages.
"""

from typing import List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.stage import Stage
from app.repositories.base_repository import BaseRepository


class StageRepository(BaseRepository[Stage, None, None]):
    """Repository pour les opérations CRUD sur les stages."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Stage
    
    def get_by_code(self, code: str) -> Optional[Stage]:
        """Récupère un stage par son code."""
        return self.db.query(Stage).filter(Stage.code == code).first()
    
    def get_by_etudiant(self, etudiant_id: int) -> List[Stage]:
        """Récupère tous les stages d'un étudiant."""
        return self.db.query(Stage).filter(
            Stage.etudiant_id == etudiant_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_by_encadrant(self, encadrant_id: int) -> List[Stage]:
        """Récupère tous les stages encadrés par un enseignant."""
        return self.db.query(Stage).filter(
            Stage.encadrant_academique_id == encadrant_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_by_annee(self, annee_id: int) -> List[Stage]:
        """Récupère tous les stages d'une année académique."""
        return self.db.query(Stage).filter(
            Stage.annee_academique_id == annee_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_by_niveau(self, niveau_id: int, annee_id: int) -> List[Stage]:
        """Récupère tous les stages d'un niveau pour une année."""
        return self.db.query(Stage).filter(
            Stage.niveau_id == niveau_id,
            Stage.annee_academique_id == annee_id
        ).order_by(Stage.date_debut.desc()).all()
    
    def get_by_statut(self, statut: str, annee_id: Optional[int] = None) -> List[Stage]:
        """Récupère les stages par statut."""
        query = self.db.query(Stage).filter(Stage.statut == statut)
        if annee_id:
            query = query.filter(Stage.annee_academique_id == annee_id)
        return query.order_by(Stage.date_debut.desc()).all()
    
    def get_en_cours(self, annee_id: Optional[int] = None) -> List[Stage]:
        """Récupère les stages en cours."""
        return self.get_by_statut("en_cours", annee_id)
    
    def get_termines_sans_soutenance(self, annee_id: int) -> List[Stage]:
        """Récupère les stages terminés sans soutenance programmée."""
        return self.db.query(Stage).filter(
            Stage.annee_academique_id == annee_id,
            Stage.statut == "termine",
            Stage.soutenance == None
        ).all()
    
    def count_by_type(self, annee_id: int) -> dict:
        """Compte les stages par type pour une année."""
        results = self.db.query(
            Stage.type_stage,
            func.count(Stage.id)
        ).filter(
            Stage.annee_academique_id == annee_id
        ).group_by(Stage.type_stage).all()
        
        return {r[0]: r[1] for r in results}
    
    def count_by_statut(self, annee_id: int) -> dict:
        """Compte les stages par statut pour une année."""
        results = self.db.query(
            Stage.statut,
            func.count(Stage.id)
        ).filter(
            Stage.annee_academique_id == annee_id
        ).group_by(Stage.statut).all()
        
        return {r[0]: r[1] for r in results}
