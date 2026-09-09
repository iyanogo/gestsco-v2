from datetime import datetime
from typing import Generic, Type, TypeVar, Any, Optional

from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Repository générique pour les opérations CRUD de base."""

    def __init__(self, model: Type[ModelType]):
        """
        Initialise le repository avec le modèle SQLAlchemy.
        
        Args:
            model: Classe du modèle SQLAlchemy
        """
        self.model = model

    def get_by_id(self, db: Session, id: int) -> ModelType | None:
        """
        Récupère une entité par son ID.
        
        Args:
            db: Session de base de données
            id: ID de l'entité
            
        Returns:
            L'entité trouvée ou None
        """
        return db.query(self.model).filter(self.model.id == id).first()

    def get_by_code(self, db: Session, code: str) -> ModelType | None:
        """
        Récupère une entité par son code.
        
        Args:
            db: Session de base de données
            code: Code de l'entité
            
        Returns:
            L'entité trouvée ou None
        """
        return db.query(self.model).filter(self.model.code == code).first()

    def get_all(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 100,
        include_inactive: bool = False,
    ) -> list[ModelType]:
        """
        Récupère toutes les entités avec pagination.
        
        Args:
            db: Session de base de données
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            include_inactive: Inclure les entités inactives
            
        Returns:
            Liste des entités
        """
        query = db.query(self.model)
        if not include_inactive and hasattr(self.model, "is_active"):
            query = query.filter(self.model.is_active == True)
        return query.offset(skip).limit(limit).all()

    def get_count(self, db: Session, include_inactive: bool = False) -> int:
        """
        Compte le nombre total d'entités.
        
        Args:
            db: Session de base de données
            include_inactive: Inclure les entités inactives
            
        Returns:
            Nombre total d'entités
        """
        query = db.query(self.model)
        if not include_inactive and hasattr(self.model, "is_active"):
            query = query.filter(self.model.is_active == True)
        return query.count()

    def create(self, db: Session, obj_in: CreateSchemaType) -> ModelType:
        """
        Crée une nouvelle entité.
        
        Args:
            db: Session de base de données
            obj_in: Schéma de création avec les données
            
        Returns:
            L'entité créée
        """
        obj_data = obj_in.model_dump()
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(
        self, db: Session, id: int, obj_in: UpdateSchemaType
    ) -> ModelType | None:
        """
        Met à jour une entité existante.
        
        Args:
            db: Session de base de données
            id: ID de l'entité à mettre à jour
            obj_in: Schéma de mise à jour avec les données
            
        Returns:
            L'entité mise à jour ou None si non trouvée
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None

        update_data = obj_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if value is not None:
                setattr(db_obj, field, value)

        if hasattr(db_obj, "updated_at"):
            db_obj.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def delete(self, db: Session, id: int) -> bool:
        """
        Suppression d'une entité. Logique si is_active existe, physique sinon.
        
        Args:
            db: Session de base de données
            id: ID de l'entité à supprimer
            
        Returns:
            True si succès, False si non trouvée
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return False

        if hasattr(db_obj, "is_active"):
            db_obj.is_active = False
            if hasattr(db_obj, "updated_at"):
                db_obj.updated_at = datetime.utcnow()
            db.commit()
            return True
        else:
            # Suppression physique si pas de champ is_active
            db.delete(db_obj)
            db.commit()
            return True

    def hard_delete(self, db: Session, id: int) -> bool:
        """
        Suppression physique d'une entité de la base de données.
        
        Args:
            db: Session de base de données
            id: ID de l'entité à supprimer
            
        Returns:
            True si succès, False si non trouvée
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return False

        db.delete(db_obj)
        db.commit()
        return True

    def search(
        self, db: Session, query: str, skip: int = 0, limit: int = 100
    ) -> list[ModelType]:
        """
        Recherche dans code et libelle avec ILIKE.
        
        Args:
            db: Session de base de données
            query: Terme de recherche
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments à retourner
            
        Returns:
            Liste des entités correspondantes
        """
        search_term = f"%{query}%"
        db_query = db.query(self.model)

        if hasattr(self.model, "is_active"):
            db_query = db_query.filter(self.model.is_active == True)

        # Recherche dans code et nom/libelle (colonnes SQL uniquement)
        search_filters = []
        if hasattr(self.model, "code"):
            search_filters.append(self.model.code.ilike(search_term))
        mapper = getattr(self.model, "__mapper__", None)
        if mapper and "nom" in mapper.columns:
            search_filters.append(self.model.nom.ilike(search_term))
        if mapper and "libelle" in mapper.columns:
            search_filters.append(self.model.libelle.ilike(search_term))
        
        if search_filters:
            db_query = db_query.filter(or_(*search_filters))

        return db_query.offset(skip).limit(limit).all()

    def exists(self, db: Session, id: int) -> bool:
        """
        Vérifie si une entité existe.
        
        Args:
            db: Session de base de données
            id: ID de l'entité
            
        Returns:
            True si l'entité existe, False sinon
        """
        return db.query(self.model).filter(self.model.id == id).first() is not None

    def code_exists(self, db: Session, code: str, exclude_id: int | None = None) -> bool:
        """
        Vérifie si un code existe déjà.
        
        Args:
            db: Session de base de données
            code: Code à vérifier
            exclude_id: ID à exclure de la vérification (pour les mises à jour)
            
        Returns:
            True si le code existe, False sinon
        """
        query = db.query(self.model).filter(self.model.code == code)
        if exclude_id:
            query = query.filter(self.model.id != exclude_id)
        return query.first() is not None
