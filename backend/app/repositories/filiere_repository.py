from sqlalchemy.orm import Session

from app.models.filiere import Filiere
from app.schemas.filiere import FiliereCreate, FiliereUpdate
from app.repositories.base_repository import BaseRepository


class FiliereRepository(BaseRepository[Filiere, FiliereCreate, FiliereUpdate]):
    """Repository pour les opérations sur les filières."""

    def __init__(self):
        super().__init__(Filiere)

    def get_by_departement(
        self,
        db: Session,
        departement_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Filiere]:
        """
        Liste les filières d'un département.
        
        Args:
            db: Session de base de données
            departement_id: ID du département
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des filières
        """
        return (
            db.query(Filiere)
            .filter(
                Filiere.departement_id == departement_id,
                Filiere.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_cycle(
        self,
        db: Session,
        cycle_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Filiere]:
        """
        Liste les filières d'un cycle.
        
        Args:
            db: Session de base de données
            cycle_id: ID du cycle
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des filières
        """
        return (
            db.query(Filiere)
            .filter(
                Filiere.cycle_id == cycle_id,
                Filiere.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_departement_and_cycle(
        self,
        db: Session,
        departement_id: int,
        cycle_id: int,
    ) -> list[Filiere]:
        """
        Liste les filières d'un département pour un cycle donné.
        
        Args:
            db: Session de base de données
            departement_id: ID du département
            cycle_id: ID du cycle
            
        Returns:
            Liste des filières
        """
        return (
            db.query(Filiere)
            .filter(
                Filiere.departement_id == departement_id,
                Filiere.cycle_id == cycle_id,
                Filiere.is_active == True,
            )
            .all()
        )

    def count_by_departement(self, db: Session, departement_id: int) -> int:
        """
        Compte les filières d'un département.
        
        Args:
            db: Session de base de données
            departement_id: ID du département
            
        Returns:
            Nombre de filières
        """
        return (
            db.query(Filiere)
            .filter(
                Filiere.departement_id == departement_id,
                Filiere.is_active == True,
            )
            .count()
        )


filiere_repository = FiliereRepository()
