from sqlalchemy.orm import Session, joinedload

from app.models.etablissement import Etablissement
from app.schemas.etablissement import EtablissementCreate, EtablissementUpdate
from app.repositories.base_repository import BaseRepository


class EtablissementRepository(BaseRepository[Etablissement, EtablissementCreate, EtablissementUpdate]):
    """Repository pour les opérations sur les établissements."""

    def __init__(self):
        super().__init__(Etablissement)

    def get_by_universite(
        self,
        db: Session,
        universite_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Etablissement]:
        """
        Liste les établissements d'une université.
        
        Args:
            db: Session de base de données
            universite_id: ID de l'université
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des établissements
        """
        return (
            db.query(Etablissement)
            .filter(
                Etablissement.universite_id == universite_id,
                Etablissement.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_with_departements(self, db: Session, id: int) -> Etablissement | None:
        """
        Récupère un établissement avec ses départements.
        
        Args:
            db: Session de base de données
            id: ID de l'établissement
            
        Returns:
            L'établissement avec ses départements ou None
        """
        return (
            db.query(Etablissement)
            .options(joinedload(Etablissement.departements))
            .filter(Etablissement.id == id)
            .first()
        )

    def count_by_universite(self, db: Session, universite_id: int) -> int:
        """
        Compte les établissements d'une université.
        
        Args:
            db: Session de base de données
            universite_id: ID de l'université
            
        Returns:
            Nombre d'établissements
        """
        return (
            db.query(Etablissement)
            .filter(
                Etablissement.universite_id == universite_id,
                Etablissement.is_active == True,
            )
            .count()
        )


etablissement_repository = EtablissementRepository()
