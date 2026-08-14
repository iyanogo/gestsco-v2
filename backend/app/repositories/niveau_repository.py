from sqlalchemy.orm import Session

from app.models.niveau import Niveau
from app.schemas.niveau import NiveauCreate, NiveauUpdate
from app.repositories.base_repository import BaseRepository


class NiveauRepository(BaseRepository[Niveau, NiveauCreate, NiveauUpdate]):
    """Repository pour les opérations sur les niveaux."""

    def __init__(self):
        super().__init__(Niveau)

    def get_by_cycle(self, db: Session, cycle_id: int) -> list[Niveau]:
        """
        Liste les niveaux triés par code.
        Note: La table niveau n'a pas de cycle_id, retourne tous les niveaux.
        
        Args:
            db: Session de base de données
            cycle_id: ID du cycle (non utilisé)
            
        Returns:
            Liste des niveaux triés
        """
        return (
            db.query(Niveau)
            .order_by(Niveau.code)
            .all()
        )

    def get_ordered(self, db: Session) -> list[Niveau]:
        """
        Liste tous les niveaux triés par code.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des niveaux triés
        """
        return (
            db.query(Niveau)
            .order_by(Niveau.code)
            .all()
        )

    def count_by_cycle(self, db: Session, cycle_id: int) -> int:
        """
        Compte les niveaux.
        Note: La table niveau n'a pas de cycle_id, retourne le total.
        
        Args:
            db: Session de base de données
            cycle_id: ID du cycle (non utilisé)
            
        Returns:
            Nombre de niveaux
        """
        return db.query(Niveau).count()


niveau_repository = NiveauRepository()
