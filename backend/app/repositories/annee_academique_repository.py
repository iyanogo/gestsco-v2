"""
Repository pour la gestion des années académiques
"""

from sqlalchemy.orm import Session

from app.models.annee_academique import AnneeAcademique
from app.schemas.annee_academique import AnneeAcademiqueCreate, AnneeAcademiqueUpdate
from app.repositories.base_repository import BaseRepository


class AnneeAcademiqueRepository(BaseRepository[AnneeAcademique, AnneeAcademiqueCreate, AnneeAcademiqueUpdate]):
    """Repository pour les opérations sur les années académiques."""

    def __init__(self):
        super().__init__(AnneeAcademique)

    def get_current(self, db: Session) -> AnneeAcademique | None:
        """
        Retourne l'année académique en cours (is_current=True).
        
        Args:
            db: Session de base de données
            
        Returns:
            L'année académique en cours ou None
        """
        return db.query(self.model).filter(self.model.is_current == True).first()

    def get_active(self, db: Session) -> AnneeAcademique | None:
        """
        Retourne l'année académique active pour les inscriptions (is_active=True).
        
        Args:
            db: Session de base de données
            
        Returns:
            L'année académique active ou None
        """
        return db.query(self.model).filter(self.model.is_active == True).first()

    def set_as_current(self, db: Session, id: int) -> AnneeAcademique | None:
        """
        Définit une année académique comme année en cours.
        Désactive toutes les autres années (is_current=False).
        
        Args:
            db: Session de base de données
            id: ID de l'année à définir comme courante
            
        Returns:
            L'année académique mise à jour ou None si non trouvée
        """
        annee = self.get_by_id(db, id)
        if not annee:
            return None

        # Désactiver toutes les années
        db.query(self.model).update({self.model.is_current: False})
        
        # Activer l'année spécifiée
        annee.is_current = True
        db.commit()
        db.refresh(annee)
        return annee

    def set_as_active(self, db: Session, id: int) -> AnneeAcademique | None:
        """
        Définit une année académique comme active pour les inscriptions.
        Désactive toutes les autres années (is_active=False).
        
        Args:
            db: Session de base de données
            id: ID de l'année à activer
            
        Returns:
            L'année académique mise à jour ou None si non trouvée
        """
        annee = self.get_by_id(db, id)
        if not annee:
            return None

        # Désactiver toutes les années
        db.query(self.model).update({self.model.is_active: False})
        
        # Activer l'année spécifiée
        annee.is_active = True
        db.commit()
        db.refresh(annee)
        return annee

    def get_by_code(self, db: Session, code: str) -> AnneeAcademique | None:
        """
        Récupère une année académique par son code.
        
        Args:
            db: Session de base de données
            code: Code de l'année (ex: 2024-2025)
            
        Returns:
            L'année académique trouvée ou None
        """
        return db.query(self.model).filter(self.model.code == code).first()


# Instance singleton du repository
annee_academique_repository = AnneeAcademiqueRepository()
