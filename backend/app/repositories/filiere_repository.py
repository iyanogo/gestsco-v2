from sqlalchemy.orm import Session

from app.models.filiere import Filiere
from app.schemas.filiere import FiliereCreate, FiliereUpdate
from app.repositories.base_repository import BaseRepository


class FiliereRepository(BaseRepository[Filiere, FiliereCreate, FiliereUpdate]):
    """Repository pour les opérations sur les filières."""

    def __init__(self):
        super().__init__(Filiere)

    def get_by_etablissement(
        self,
        db: Session,
        etablissement_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Filiere]:
        """Liste les filières d'un établissement."""
        return (
            db.query(Filiere)
            .filter(Filiere.etablissement_id == etablissement_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_etablissement(self, db: Session, etablissement_id: int) -> int:
        """Compte les filières d'un établissement."""
        return (
            db.query(Filiere)
            .filter(Filiere.etablissement_id == etablissement_id)
            .count()
        )


filiere_repository = FiliereRepository()
