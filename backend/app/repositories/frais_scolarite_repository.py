"""
Repository pour la gestion des frais de scolarité
"""

from datetime import date
from sqlalchemy.orm import Session

from app.models.frais_scolarite import FraisScolarite
from app.schemas.frais_scolarite import FraisScolariteCreate, FraisScolariteUpdate
from app.repositories.base_repository import BaseRepository


class FraisScolariteRepository(BaseRepository[FraisScolarite, FraisScolariteCreate, FraisScolariteUpdate]):
    """Repository pour les opérations sur les frais de scolarité."""

    def __init__(self):
        super().__init__(FraisScolarite)

    def get_by_niveau_filiere(
        self, db: Session, niveau_id: int, filiere_id: int, annee_id: int
    ) -> list[FraisScolarite]:
        """
        Liste les frais de scolarité pour un niveau et une filière.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            filiere_id: ID de la filière
            annee_id: ID de l'année académique
            
        Returns:
            Liste des frais de scolarité
        """
        return db.query(self.model).filter(
            self.model.niveau_id == niveau_id,
            self.model.filiere_id == filiere_id,
            self.model.annee_academique_id == annee_id,
            self.model.is_active == True
        ).all()

    def get_by_annee(self, db: Session, annee_id: int) -> list[FraisScolarite]:
        """
        Liste les frais de scolarité pour une année académique.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique
            
        Returns:
            Liste des frais de scolarité
        """
        return db.query(self.model).filter(
            self.model.annee_academique_id == annee_id,
            self.model.is_active == True
        ).all()

    def get_by_cycle(self, db: Session, cycle_id: int, annee_id: int) -> list[FraisScolarite]:
        """
        Liste les frais de scolarité pour un cycle.
        
        Args:
            db: Session de base de données
            cycle_id: ID du cycle
            annee_id: ID de l'année académique
            
        Returns:
            Liste des frais de scolarité
        """
        return db.query(self.model).filter(
            self.model.cycle_id == cycle_id,
            self.model.annee_academique_id == annee_id,
            self.model.is_active == True
        ).all()

    def get_valides(self, db: Session, date_reference: date = None) -> list[FraisScolarite]:
        """
        Liste les frais de scolarité valides à une date donnée.
        
        Args:
            db: Session de base de données
            date_reference: Date de référence (par défaut aujourd'hui)
            
        Returns:
            Liste des frais de scolarité valides
        """
        if date_reference is None:
            date_reference = date.today()
        
        return db.query(self.model).filter(
            self.model.date_debut_validite <= date_reference,
            self.model.date_fin_validite >= date_reference,
            self.model.is_active == True
        ).all()

    def get_by_niveau(self, db: Session, niveau_id: int, annee_id: int) -> list[FraisScolarite]:
        """
        Liste les frais de scolarité pour un niveau.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            annee_id: ID de l'année académique
            
        Returns:
            Liste des frais de scolarité
        """
        return db.query(self.model).filter(
            self.model.niveau_id == niveau_id,
            self.model.annee_academique_id == annee_id,
            self.model.is_active == True
        ).all()


# Instance singleton du repository
frais_scolarite_repository = FraisScolariteRepository()
