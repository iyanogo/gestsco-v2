from sqlalchemy.orm import Session

from app.models.matiere import Matiere
from app.schemas.matiere import MatiereCreate, MatiereUpdate
from app.repositories.base_repository import BaseRepository


class MatiereRepository(BaseRepository[Matiere, MatiereCreate, MatiereUpdate]):
    """Repository pour les opérations sur les matières."""

    def __init__(self):
        super().__init__(Matiere)

    def get_by_module(
        self,
        db: Session,
        module_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Matiere]:
        """
        Liste les matières d'un module.
        
        Args:
            db: Session de base de données
            module_id: ID du module
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des matières
        """
        return (
            db.query(Matiere)
            .filter(
                Matiere.module_id == module_id,
                Matiere.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_volume_horaire_total(self, db: Session, id: int) -> int:
        """
        Calcule le volume horaire total (CM + TD + TP) d'une matière.
        
        Args:
            db: Session de base de données
            id: ID de la matière
            
        Returns:
            Volume horaire total ou 0 si non trouvée
        """
        matiere = self.get_by_id(db, id)
        if not matiere:
            return 0
        return (
            (matiere.volume_horaire_cm or 0)
            + (matiere.volume_horaire_td or 0)
            + (matiere.volume_horaire_tp or 0)
        )

    def count_by_module(self, db: Session, module_id: int) -> int:
        """
        Compte les matières d'un module.
        
        Args:
            db: Session de base de données
            module_id: ID du module
            
        Returns:
            Nombre de matières
        """
        return (
            db.query(Matiere)
            .filter(
                Matiere.module_id == module_id,
                Matiere.is_active == True,
            )
            .count()
        )

    def get_total_credits_by_module(self, db: Session, module_id: int) -> int:
        """
        Calcule le total des crédits des matières d'un module.
        
        Args:
            db: Session de base de données
            module_id: ID du module
            
        Returns:
            Total des crédits
        """
        matieres = self.get_by_module(db, module_id)
        return sum(m.credits or 0 for m in matieres)


matiere_repository = MatiereRepository()
