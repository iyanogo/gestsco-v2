"""
Repository pour la gestion des sessions d'examen
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.session_examen import SessionExamen
from app.schemas.session_examen import SessionExamenCreate, SessionExamenUpdate
from app.repositories.base_repository import BaseRepository


class SessionExamenRepository(BaseRepository[SessionExamen, SessionExamenCreate, SessionExamenUpdate]):
    """Repository pour les opérations CRUD sur les sessions d'examen."""

    def __init__(self):
        super().__init__(SessionExamen)

    def get_by_annee(
        self,
        db: Session,
        annee_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[SessionExamen]:
        """
        Liste les sessions d'une année académique.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des sessions de l'année
        """
        query = db.query(SessionExamen).filter(
            SessionExamen.annee_academique_id == annee_id
        )
        
        if hasattr(SessionExamen, "is_active"):
            query = query.filter(SessionExamen.is_active == True)
        
        return query.order_by(SessionExamen.semestre, SessionExamen.date_debut).offset(skip).limit(limit).all()

    def get_by_semestre(
        self,
        db: Session,
        annee_id: int,
        semestre: int
    ) -> list[SessionExamen]:
        """
        Liste les sessions d'un semestre spécifique.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique
            semestre: Numéro du semestre (1 ou 2)
            
        Returns:
            Liste des sessions du semestre
        """
        query = db.query(SessionExamen).filter(
            SessionExamen.annee_academique_id == annee_id,
            SessionExamen.semestre == semestre
        )
        
        if hasattr(SessionExamen, "is_active"):
            query = query.filter(SessionExamen.is_active == True)
        
        return query.order_by(SessionExamen.date_debut).all()

    def get_active(self, db: Session) -> Optional[SessionExamen]:
        """
        Récupère la session active.
        
        Args:
            db: Session de base de données
            
        Returns:
            La session active ou None
        """
        return db.query(SessionExamen).filter(
            SessionExamen.is_active == True,
            SessionExamen.statut == "en_cours"
        ).first()

    def get_en_cours(self, db: Session) -> list[SessionExamen]:
        """
        Liste les sessions en cours.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des sessions en cours
        """
        query = db.query(SessionExamen).filter(
            SessionExamen.statut == "en_cours"
        )
        
        if hasattr(SessionExamen, "is_active"):
            query = query.filter(SessionExamen.is_active == True)
        
        return query.order_by(SessionExamen.date_debut).all()

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[SessionExamen]:
        """
        Liste les sessions par statut.
        
        Args:
            db: Session de base de données
            statut: Statut recherché
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des sessions avec ce statut
        """
        query = db.query(SessionExamen).filter(
            SessionExamen.statut == statut
        )
        
        if hasattr(SessionExamen, "is_active"):
            query = query.filter(SessionExamen.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    def ouvrir_session(self, db: Session, id: int) -> Optional[SessionExamen]:
        """
        Ouvre une session (change statut en 'en_cours').
        
        Args:
            db: Session de base de données
            id: ID de la session
            
        Returns:
            La session mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "en_cours"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def cloturer_session(self, db: Session, id: int) -> Optional[SessionExamen]:
        """
        Clôture une session (change statut en 'cloturee').
        
        Args:
            db: Session de base de données
            id: ID de la session
            
        Returns:
            La session mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "cloturee"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def valider_session(self, db: Session, id: int) -> Optional[SessionExamen]:
        """
        Valide une session (change statut en 'validee').
        
        Args:
            db: Session de base de données
            id: ID de la session
            
        Returns:
            La session mise à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "validee"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instance singleton du repository
session_examen_repository = SessionExamenRepository()
