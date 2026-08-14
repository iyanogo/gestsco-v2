"""
Repository pour la gestion des bâtiments
"""
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.batiment import Batiment
from app.repositories.base_repository import BaseRepository
from app.schemas.batiment import BatimentCreate, BatimentUpdate


class BatimentRepository(BaseRepository[Batiment, BatimentCreate, BatimentUpdate]):
    """Repository pour les opérations CRUD sur les bâtiments"""

    def __init__(self):
        super().__init__(Batiment)

    def get_by_etablissement(self, db: Session, etablissement_id: int) -> List[Batiment]:
        """Retourne tous les bâtiments d'un établissement"""
        return db.query(Batiment).filter(
            Batiment.etablissement_id == etablissement_id,
            Batiment.is_active == True
        ).order_by(Batiment.libelle).all()

    def get_by_code(self, db: Session, code: str) -> Optional[Batiment]:
        """Retourne un bâtiment par son code"""
        return db.query(Batiment).filter(Batiment.code == code).first()


batiment_repository = BatimentRepository()
