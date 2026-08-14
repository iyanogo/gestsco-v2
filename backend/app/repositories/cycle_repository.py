from sqlalchemy.orm import Session, joinedload

from app.models.cycle import Cycle
from app.schemas.cycle import CycleCreate, CycleUpdate
from app.repositories.base_repository import BaseRepository


class CycleRepository(BaseRepository[Cycle, CycleCreate, CycleUpdate]):
    """Repository pour les opérations sur les cycles."""

    def __init__(self):
        super().__init__(Cycle)

    def get_ordered(self, db: Session) -> list[Cycle]:
        """
        Liste les cycles triés par code.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des cycles triés
        """
        return (
            db.query(Cycle)
            .order_by(Cycle.code)
            .all()
        )

    def get_with_niveaux(self, db: Session, id: int) -> Cycle | None:
        """
        Récupère un cycle avec ses niveaux.
        
        Args:
            db: Session de base de données
            id: ID du cycle
            
        Returns:
            Le cycle avec ses niveaux ou None
        """
        return (
            db.query(Cycle)
            .options(joinedload(Cycle.niveaux))
            .filter(Cycle.id == id)
            .first()
        )


cycle_repository = CycleRepository()
