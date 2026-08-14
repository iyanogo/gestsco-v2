"""
Repository pour la gestion des semestres LMD.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.semestre import Semestre


class SemestreRepository:
    """Repository pour les opérations CRUD sur les semestres."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = Semestre
    
    def get_by_code(self, code: str) -> Optional[Semestre]:
        """Récupère un semestre par son code."""
        return self.db.query(Semestre).filter(
            Semestre.code == code,
            Semestre.is_active == True
        ).first()
    
    def get_by_cycle(self, cycle_id: int) -> List[Semestre]:
        """Récupère tous les semestres d'un cycle."""
        return self.db.query(Semestre).filter(
            Semestre.cycle_id == cycle_id,
            Semestre.is_active == True
        ).order_by(Semestre.numero_semestre).all()
    
    def get_semestres_lmd(self) -> dict:
        """
        Récupère la structure complète LMD.
        
        Returns:
            Dictionnaire avec la structure LMD par cycle
        """
        semestres = self.db.query(Semestre).filter(
            Semestre.is_active == True
        ).order_by(Semestre.numero_semestre).all()
        
        structure = {
            "licence": [],
            "master": [],
            "doctorat": []
        }
        
        for sem in semestres:
            if sem.numero_semestre <= 6:
                structure["licence"].append(sem)
            elif sem.numero_semestre <= 10:
                structure["master"].append(sem)
            else:
                structure["doctorat"].append(sem)
        
        return structure
    
    def get_by_numero(self, numero: int) -> Optional[Semestre]:
        """Récupère un semestre par son numéro global."""
        return self.db.query(Semestre).filter(
            Semestre.numero_semestre == numero,
            Semestre.is_active == True
        ).first()
    
    def get_semestres_annee(self, annee_dans_cycle: int, cycle_id: int) -> List[Semestre]:
        """Récupère les semestres d'une année dans un cycle."""
        return self.db.query(Semestre).filter(
            Semestre.cycle_id == cycle_id,
            Semestre.annee_dans_cycle == annee_dans_cycle,
            Semestre.is_active == True
        ).order_by(Semestre.semestre_dans_annee).all()
