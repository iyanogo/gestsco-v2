"""
Repository pour la gestion des modules système.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.module_systeme import ModuleSysteme
from app.repositories.base_repository import BaseRepository


class ModuleSystemeRepository(BaseRepository[ModuleSysteme, None, None]):
    """Repository pour les opérations CRUD sur les modules système."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = ModuleSysteme
    
    def get_by_code(self, code: str) -> Optional[ModuleSysteme]:
        """Récupère un module par son code."""
        return self.db.query(ModuleSysteme).filter(
            ModuleSysteme.code == code,
            ModuleSysteme.is_active == True
        ).first()
    
    def get_obligatoires(self) -> List[ModuleSysteme]:
        """Récupère tous les modules obligatoires."""
        return self.db.query(ModuleSysteme).filter(
            ModuleSysteme.est_obligatoire == True,
            ModuleSysteme.is_active == True
        ).order_by(ModuleSysteme.ordre).all()
    
    def get_all_actifs(self) -> List[ModuleSysteme]:
        """Récupère tous les modules actifs."""
        return self.db.query(ModuleSysteme).filter(
            ModuleSysteme.is_active == True
        ).order_by(ModuleSysteme.ordre).all()
    
    def get_by_permission(self, role: str) -> List[ModuleSysteme]:
        """Récupère les modules accessibles à un rôle."""
        modules = self.get_all_actifs()
        return [m for m in modules if m.verifier_permission(role)]
