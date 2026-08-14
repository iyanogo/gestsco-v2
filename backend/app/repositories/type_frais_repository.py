"""
Repository pour la gestion des types de frais
"""

from sqlalchemy.orm import Session

from app.models.type_frais import TypeFrais
from app.schemas.type_frais import TypeFraisCreate, TypeFraisUpdate
from app.repositories.base_repository import BaseRepository


class TypeFraisRepository(BaseRepository[TypeFrais, TypeFraisCreate, TypeFraisUpdate]):
    """Repository pour les opérations sur les types de frais."""

    def __init__(self):
        super().__init__(TypeFrais)

    def get_by_categorie(self, db: Session, categorie: str) -> list[TypeFrais]:
        """
        Liste les types de frais par catégorie.
        
        Args:
            db: Session de base de données
            categorie: Catégorie des frais (inscription, scolarite, examen, etc.)
            
        Returns:
            Liste des types de frais de la catégorie
        """
        return db.query(self.model).filter(
            self.model.categorie == categorie,
            self.model.is_active == True
        ).all()

    def get_obligatoires(self, db: Session) -> list[TypeFrais]:
        """
        Liste les types de frais obligatoires.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des types de frais obligatoires
        """
        return db.query(self.model).filter(
            self.model.est_obligatoire == True,
            self.model.is_active == True
        ).all()

    def get_recurrents(self, db: Session) -> list[TypeFrais]:
        """
        Liste les types de frais récurrents.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des types de frais récurrents
        """
        return db.query(self.model).filter(
            self.model.est_recurrent == True,
            self.model.is_active == True
        ).all()


# Instance singleton du repository
type_frais_repository = TypeFraisRepository()
