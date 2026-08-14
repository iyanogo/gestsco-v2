from sqlalchemy.orm import Session, joinedload

from app.models.departement import Departement
from app.schemas.departement import DepartementCreate, DepartementUpdate
from app.repositories.base_repository import BaseRepository


class DepartementRepository(BaseRepository[Departement, DepartementCreate, DepartementUpdate]):
    """Repository pour les opérations sur les départements."""

    def __init__(self):
        super().__init__(Departement)

    def get_by_etablissement(
        self,
        db: Session,
        etablissement_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Departement]:
        """
        Liste les départements d'un établissement.
        
        Args:
            db: Session de base de données
            etablissement_id: ID de l'établissement
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des départements
        """
        return (
            db.query(Departement)
            .filter(
                Departement.etablissement_id == etablissement_id,
                Departement.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_with_filieres(self, db: Session, id: int) -> Departement | None:
        """
        Récupère un département avec ses filières.
        
        Args:
            db: Session de base de données
            id: ID du département
            
        Returns:
            Le département avec ses filières ou None
        """
        return (
            db.query(Departement)
            .options(joinedload(Departement.filieres))
            .filter(Departement.id == id)
            .first()
        )

    def count_by_etablissement(self, db: Session, etablissement_id: int) -> int:
        """
        Compte les départements d'un établissement.
        
        Args:
            db: Session de base de données
            etablissement_id: ID de l'établissement
            
        Returns:
            Nombre de départements
        """
        return (
            db.query(Departement)
            .filter(
                Departement.etablissement_id == etablissement_id,
                Departement.is_active == True,
            )
            .count()
        )


departement_repository = DepartementRepository()
