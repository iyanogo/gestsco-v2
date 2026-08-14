"""
Repository pour la gestion des inscriptions aux matières
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.inscription_matiere import InscriptionMatiere
from app.schemas.inscription_matiere import InscriptionMatiereCreate
from app.repositories.base_repository import BaseRepository


class InscriptionMatiereRepository(BaseRepository[InscriptionMatiere, InscriptionMatiereCreate, None]):
    """Repository pour les opérations CRUD sur les inscriptions aux matières."""

    def __init__(self):
        super().__init__(InscriptionMatiere)

    def get_by_inscription(
        self,
        db: Session,
        inscription_id: int
    ) -> list[InscriptionMatiere]:
        """
        Liste les matières d'une inscription.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            
        Returns:
            Liste des inscriptions matières
        """
        query = db.query(InscriptionMatiere).filter(
            InscriptionMatiere.inscription_id == inscription_id
        )
        
        if hasattr(InscriptionMatiere, "is_active"):
            query = query.filter(InscriptionMatiere.is_active == True)
        
        return query.all()

    def get_by_semestre(
        self,
        db: Session,
        inscription_id: int,
        semestre: int
    ) -> list[InscriptionMatiere]:
        """
        Liste les matières d'une inscription pour un semestre donné.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            semestre: Numéro du semestre (1 ou 2)
            
        Returns:
            Liste des inscriptions matières du semestre
        """
        query = db.query(InscriptionMatiere).filter(
            InscriptionMatiere.inscription_id == inscription_id,
            InscriptionMatiere.semestre == semestre
        )
        
        if hasattr(InscriptionMatiere, "is_active"):
            query = query.filter(InscriptionMatiere.is_active == True)
        
        return query.all()

    def bulk_create(
        self,
        db: Session,
        inscription_id: int,
        matiere_ids: list[int],
        semestre: int
    ) -> list[InscriptionMatiere]:
        """
        Crée plusieurs inscriptions matières en une fois.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            matiere_ids: Liste des IDs des matières
            semestre: Numéro du semestre
            
        Returns:
            Liste des inscriptions matières créées
        """
        created_items = []
        
        for matiere_id in matiere_ids:
            # Vérifier si l'inscription matière existe déjà
            existing = db.query(InscriptionMatiere).filter(
                InscriptionMatiere.inscription_id == inscription_id,
                InscriptionMatiere.matiere_id == matiere_id
            ).first()
            
            if not existing:
                db_obj = InscriptionMatiere(
                    inscription_id=inscription_id,
                    matiere_id=matiere_id,
                    semestre=semestre,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                db.add(db_obj)
                created_items.append(db_obj)
        
        if created_items:
            db.commit()
            for item in created_items:
                db.refresh(item)
        
        return created_items

    def inscription_matiere_exists(
        self,
        db: Session,
        inscription_id: int,
        matiere_id: int
    ) -> bool:
        """
        Vérifie si une inscription matière existe.
        
        Args:
            db: Session de base de données
            inscription_id: ID de l'inscription
            matiere_id: ID de la matière
            
        Returns:
            True si l'inscription matière existe
        """
        query = db.query(InscriptionMatiere).filter(
            InscriptionMatiere.inscription_id == inscription_id,
            InscriptionMatiere.matiere_id == matiere_id
        )
        
        if hasattr(InscriptionMatiere, "is_active"):
            query = query.filter(InscriptionMatiere.is_active == True)
        
        return query.first() is not None


# Instance singleton du repository
inscription_matiere_repository = InscriptionMatiereRepository()
