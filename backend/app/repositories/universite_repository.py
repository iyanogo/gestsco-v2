from sqlalchemy.orm import Session, joinedload

from app.models.universite import Universite
from app.schemas.universite import UniversiteCreate, UniversiteUpdate
from app.repositories.base_repository import BaseRepository


class UniversiteRepository(BaseRepository[Universite, UniversiteCreate, UniversiteUpdate]):
    """Repository pour les opérations sur les universités."""

    def __init__(self):
        super().__init__(Universite)

    def get_with_etablissements(self, db: Session, id: int) -> Universite | None:
        """
        Récupère une université avec ses établissements.
        
        Args:
            db: Session de base de données
            id: ID de l'université
            
        Returns:
            L'université avec ses établissements ou None
        """
        return (
            db.query(Universite)
            .options(joinedload(Universite.etablissements))
            .filter(Universite.id == id)
            .first()
        )


universite_repository = UniversiteRepository()
