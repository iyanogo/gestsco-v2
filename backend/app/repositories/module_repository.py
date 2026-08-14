from sqlalchemy.orm import Session, joinedload

from app.models.module import Module
from app.schemas.module import ModuleCreate, ModuleUpdate
from app.repositories.base_repository import BaseRepository


class ModuleRepository(BaseRepository[Module, ModuleCreate, ModuleUpdate]):
    """Repository pour les opérations sur les modules."""

    def __init__(self):
        super().__init__(Module)

    def get_with_matieres(self, db: Session, id: int) -> Module | None:
        """
        Récupère un module avec ses matières.
        
        Args:
            db: Session de base de données
            id: ID du module
            
        Returns:
            Le module avec ses matières ou None
        """
        return (
            db.query(Module)
            .options(joinedload(Module.matieres))
            .filter(Module.id == id)
            .first()
        )

    def get_by_type(
        self,
        db: Session,
        type_module: str,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Module]:
        """
        Liste les modules par type (Obligatoire, Optionnel).
        
        Args:
            db: Session de base de données
            type_module: Type de module
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des modules
        """
        return (
            db.query(Module)
            .filter(
                Module.type_module == type_module,
                Module.is_active == True,
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_type(self, db: Session, type_module: str) -> int:
        """
        Compte les modules par type.
        
        Args:
            db: Session de base de données
            type_module: Type de module
            
        Returns:
            Nombre de modules
        """
        return (
            db.query(Module)
            .filter(
                Module.type_module == type_module,
                Module.is_active == True,
            )
            .count()
        )


module_repository = ModuleRepository()
