"""
Repository pour la gestion des documents des étudiants
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.document_etudiant import DocumentEtudiant
from app.schemas.document_etudiant import DocumentEtudiantCreate, DocumentEtudiantUpdate
from app.repositories.base_repository import BaseRepository


class DocumentEtudiantRepository(BaseRepository[DocumentEtudiant, DocumentEtudiantCreate, DocumentEtudiantUpdate]):
    """Repository pour les opérations CRUD sur les documents des étudiants."""

    def __init__(self):
        super().__init__(DocumentEtudiant)

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[DocumentEtudiant]:
        """
        Liste les documents d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des documents de l'étudiant
        """
        return (
            db.query(DocumentEtudiant)
            .filter(DocumentEtudiant.etudiant_id == etudiant_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_type(
        self,
        db: Session,
        etudiant_id: int,
        type_document: str
    ) -> list[DocumentEtudiant]:
        """
        Liste les documents d'un étudiant par type.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            type_document: Type de document (Acte de naissance, Bac, Photo, etc.)
            
        Returns:
            Liste des documents correspondants
        """
        return (
            db.query(DocumentEtudiant)
            .filter(
                DocumentEtudiant.etudiant_id == etudiant_id,
                DocumentEtudiant.type_document == type_document
            )
            .all()
        )

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[DocumentEtudiant]:
        """
        Liste les documents par statut.
        
        Args:
            db: Session de base de données
            statut: Statut du document (en_attente, valide, refuse)
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des documents avec ce statut
        """
        return (
            db.query(DocumentEtudiant)
            .filter(DocumentEtudiant.statut == statut)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def valider_document(
        self,
        db: Session,
        id: int,
        commentaire: Optional[str] = None
    ) -> Optional[DocumentEtudiant]:
        """
        Valide un document.
        
        Args:
            db: Session de base de données
            id: ID du document
            commentaire: Commentaire optionnel
            
        Returns:
            Le document validé ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "valide"
        if commentaire:
            db_obj.commentaire = commentaire
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def refuser_document(
        self,
        db: Session,
        id: int,
        commentaire: str
    ) -> Optional[DocumentEtudiant]:
        """
        Refuse un document.
        
        Args:
            db: Session de base de données
            id: ID du document
            commentaire: Raison du refus (obligatoire)
            
        Returns:
            Le document refusé ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "refuse"
        db_obj.commentaire = commentaire
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_count_by_etudiant(self, db: Session, etudiant_id: int) -> int:
        """
        Compte les documents d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            
        Returns:
            Nombre de documents
        """
        return (
            db.query(DocumentEtudiant)
            .filter(DocumentEtudiant.etudiant_id == etudiant_id)
            .count()
        )


# Instance singleton du repository
document_etudiant_repository = DocumentEtudiantRepository()
