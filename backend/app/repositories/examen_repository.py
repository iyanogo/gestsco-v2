"""
Repository pour la gestion des examens
"""

from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

from app.models.examen import Examen
from app.schemas.examen import ExamenCreate, ExamenUpdate
from app.repositories.base_repository import BaseRepository


class ExamenRepository(BaseRepository[Examen, ExamenCreate, ExamenUpdate]):
    """Repository pour les opérations CRUD sur les examens."""

    def __init__(self):
        super().__init__(Examen)

    def get_by_session(
        self,
        db: Session,
        session_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[Examen]:
        """
        Liste les examens d'une session.
        
        Args:
            db: Session de base de données
            session_id: ID de la session d'examen
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des examens de la session
        """
        return db.query(Examen).filter(
            Examen.session_id == session_id
        ).offset(skip).limit(limit).all()

    def get_by_matiere(
        self,
        db: Session,
        matiere_id: int,
        session_id: Optional[int] = None
    ) -> list[Examen]:
        """
        Liste les examens d'une matière.
        
        Args:
            db: Session de base de données
            matiere_id: ID de la matière
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des examens de la matière
        """
        query = db.query(Examen).filter(Examen.matiere_id == matiere_id)
        
        if session_id:
            query = query.filter(Examen.session_id == session_id)
        
        return query.order_by(Examen.date_examen.desc()).all()

    def get_by_niveau(
        self,
        db: Session,
        niveau_id: int,
        session_id: Optional[int] = None
    ) -> list[Examen]:
        """
        Liste les examens d'un niveau.
        
        Args:
            db: Session de base de données
            niveau_id: ID du niveau
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des examens du niveau
        """
        query = db.query(Examen).filter(Examen.niveau_id == niveau_id)
        
        if session_id:
            query = query.filter(Examen.session_id == session_id)
        
        return query.order_by(Examen.date_examen).all()

    def get_by_enseignant(
        self,
        db: Session,
        enseignant_id: int,
        session_id: Optional[int] = None
    ) -> list[Examen]:
        """
        Liste les examens d'un enseignant.
        
        Args:
            db: Session de base de données
            enseignant_id: ID de l'enseignant
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des examens de l'enseignant
        """
        query = db.query(Examen).filter(Examen.enseignant_id == enseignant_id)
        
        if session_id:
            query = query.filter(Examen.session_id == session_id)
        
        return query.order_by(Examen.date_examen.desc()).all()

    def get_by_type(
        self,
        db: Session,
        type_evaluation: str,
        session_id: Optional[int] = None
    ) -> list[Examen]:
        """
        Liste les examens par type d'évaluation.
        
        Args:
            db: Session de base de données
            type_evaluation: Type d'évaluation (cc, tp, examen, projet)
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des examens du type spécifié
        """
        query = db.query(Examen).filter(Examen.type_evaluation == type_evaluation)
        
        if session_id:
            query = query.filter(Examen.session_id == session_id)
        
        return query.order_by(Examen.date_examen).all()

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        session_id: Optional[int] = None
    ) -> list[Examen]:
        """
        Liste les examens par statut.
        
        Args:
            db: Session de base de données
            statut: Statut de l'examen
            session_id: ID de la session (optionnel)
            
        Returns:
            Liste des examens avec ce statut
        """
        query = db.query(Examen).filter(Examen.statut == statut)
        
        if session_id:
            query = query.filter(Examen.session_id == session_id)
        
        return query.all()

    def terminer_examen(self, db: Session, id: int) -> Optional[Examen]:
        """
        Marque un examen comme terminé.
        
        Args:
            db: Session de base de données
            id: ID de l'examen
            
        Returns:
            L'examen mis à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "termine"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def marquer_notes_saisies(self, db: Session, id: int) -> Optional[Examen]:
        """
        Marque les notes d'un examen comme saisies.
        
        Args:
            db: Session de base de données
            id: ID de l'examen
            
        Returns:
            L'examen mis à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "notes_saisies"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def valider_examen(self, db: Session, id: int) -> Optional[Examen]:
        """
        Valide un examen.
        
        Args:
            db: Session de base de données
            id: ID de l'examen
            
        Returns:
            L'examen mis à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = "valide"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj


# Instance singleton du repository
examen_repository = ExamenRepository()
