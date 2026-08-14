"""
Repository pour la gestion des modules actifs.
"""

from typing import List, Optional
from sqlalchemy.orm import Session

from app.models.module_actif import ModuleActif
from app.repositories.base_repository import BaseRepository


class ModuleActifRepository(BaseRepository[ModuleActif, None, None]):
    """Repository pour les opérations CRUD sur les modules actifs."""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = ModuleActif
    
    def get_by_context(
        self,
        module_id: int,
        universite_id: Optional[int],
        annee_id: Optional[int]
    ) -> Optional[ModuleActif]:
        """Récupère une activation par son contexte."""
        return self.db.query(ModuleActif).filter(
            ModuleActif.module_id == module_id,
            ModuleActif.universite_id == universite_id,
            ModuleActif.annee_academique_id == annee_id
        ).first()
    
    def get_actifs_universite(self, universite_id: int) -> List[ModuleActif]:
        """Récupère les modules actifs pour une université."""
        return self.db.query(ModuleActif).filter(
            ModuleActif.universite_id == universite_id,
            ModuleActif.est_actif == True
        ).all()
    
    def get_actifs_annee(self, annee_id: int) -> List[ModuleActif]:
        """Récupère les modules actifs pour une année."""
        return self.db.query(ModuleActif).filter(
            ModuleActif.annee_academique_id == annee_id,
            ModuleActif.est_actif == True
        ).all()
    
    def desactiver_tous_annee(self, annee_id: int) -> int:
        """Désactive tous les modules d'une année."""
        count = self.db.query(ModuleActif).filter(
            ModuleActif.annee_academique_id == annee_id
        ).update({"est_actif": False})
        self.db.commit()
        return count
