"""
Repository pour la gestion des inscriptions
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.inscription import Inscription
from app.schemas.inscription import InscriptionCreate, InscriptionUpdate
from app.repositories.base_repository import BaseRepository


class InscriptionRepository(BaseRepository[Inscription, InscriptionCreate, InscriptionUpdate]):
    """Repository pour les opérations CRUD sur les inscriptions."""

    def __init__(self):
        super().__init__(Inscription)

    def get_by_etudiant(
        self,
        db: Session,
        etudiant_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> list[Inscription]:
        """
        Liste les inscriptions d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des inscriptions de l'étudiant
        """
        query = db.query(Inscription).filter(Inscription.etudiant_id == etudiant_id)
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.order_by(Inscription.annee_academique.desc()).offset(skip).limit(limit).all()

    def get_by_annee_academique(
        self,
        db: Session,
        annee: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[Inscription]:
        """
        Liste les inscriptions d'une année académique.
        
        Args:
            db: Session de base de données
            annee: Année académique (ex: 2024-2025)
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des inscriptions de l'année
        """
        query = db.query(Inscription).filter(Inscription.annee_academique == annee)
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    def get_by_filiere(
        self,
        db: Session,
        filiere_id: int,
        annee: Optional[str] = None
    ) -> list[Inscription]:
        """
        Liste les inscriptions d'une filière.
        
        Args:
            db: Session de base de données
            filiere_id: ID de la filière
            annee: Année académique (optionnel)
            
        Returns:
            Liste des inscriptions de la filière
        """
        query = db.query(Inscription).filter(Inscription.filiere_id == filiere_id)
        
        if annee:
            query = query.filter(Inscription.annee_academique == annee)
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.all()

    def get_current_inscription(
        self,
        db: Session,
        etudiant_id: int
    ) -> Optional[Inscription]:
        """
        Récupère l'inscription active de l'étudiant pour l'année en cours.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            
        Returns:
            L'inscription active ou None
        """
        query = (
            db.query(Inscription)
            .filter(
                Inscription.etudiant_id == etudiant_id,
                Inscription.statut_inscription == "en_cours"
            )
        )
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.order_by(Inscription.annee_academique.desc()).first()

    def get_with_matieres(self, db: Session, id: int) -> Optional[Inscription]:
        """
        Récupère une inscription avec les matières inscrites.
        
        Args:
            db: Session de base de données
            id: ID de l'inscription
            
        Returns:
            L'inscription avec ses matières ou None
        """
        return (
            db.query(Inscription)
            .options(joinedload(Inscription.inscriptions_matieres))
            .filter(Inscription.id == id)
            .first()
        )

    def valider_inscription(self, db: Session, id: int) -> Optional[Inscription]:
        """
        Valide une inscription.
        
        Args:
            db: Session de base de données
            id: ID de l'inscription
            
        Returns:
            L'inscription validée ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut_inscription = "validee"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def annuler_inscription(
        self,
        db: Session,
        id: int,
        raison: Optional[str] = None
    ) -> Optional[Inscription]:
        """
        Annule une inscription.
        
        Args:
            db: Session de base de données
            id: ID de l'inscription
            raison: Raison de l'annulation (optionnel)
            
        Returns:
            L'inscription annulée ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut_inscription = "annulee"
        db_obj.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_statistiques_annee(self, db: Session, annee: str) -> dict:
        """
        Statistiques des inscriptions pour une année.
        
        Args:
            db: Session de base de données
            annee: Année académique
            
        Returns:
            Dictionnaire avec total, par_filiere, par_niveau
        """
        base_query = db.query(Inscription).filter(Inscription.annee_academique == annee)
        
        if hasattr(Inscription, "is_active"):
            base_query = base_query.filter(Inscription.is_active == True)
        
        total = base_query.count()
        
        # Par filière
        filiere_counts = (
            base_query
            .with_entities(Inscription.filiere_id, func.count(Inscription.id))
            .group_by(Inscription.filiere_id)
            .all()
        )
        par_filiere = {str(filiere_id): count for filiere_id, count in filiere_counts}
        
        # Par niveau
        niveau_counts = (
            base_query
            .with_entities(Inscription.niveau_id, func.count(Inscription.id))
            .group_by(Inscription.niveau_id)
            .all()
        )
        par_niveau = {str(niveau_id): count for niveau_id, count in niveau_counts}
        
        # Par statut
        statut_counts = (
            base_query
            .with_entities(Inscription.statut_inscription, func.count(Inscription.id))
            .group_by(Inscription.statut_inscription)
            .all()
        )
        par_statut = {statut: count for statut, count in statut_counts}
        
        return {
            "total": total,
            "par_filiere": par_filiere,
            "par_niveau": par_niveau,
            "par_statut": par_statut
        }

    def inscription_exists(
        self,
        db: Session,
        etudiant_id: int,
        annee_academique: str,
        niveau_id: int,
        exclude_id: Optional[int] = None
    ) -> bool:
        """
        Vérifie si une inscription existe déjà pour cet étudiant/année/niveau.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            annee_academique: Année académique
            niveau_id: ID du niveau
            exclude_id: ID à exclure (pour les mises à jour)
            
        Returns:
            True si l'inscription existe
        """
        query = db.query(Inscription).filter(
            Inscription.etudiant_id == etudiant_id,
            Inscription.annee_academique == annee_academique,
            Inscription.niveau_id == niveau_id
        )
        
        if exclude_id:
            query = query.filter(Inscription.id != exclude_id)
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.first() is not None

    def get_count_by_annee(
        self,
        db: Session,
        annee: Optional[str] = None,
        filiere_id: Optional[int] = None
    ) -> int:
        """
        Compte les inscriptions.
        
        Args:
            db: Session de base de données
            annee: Année académique (optionnel)
            filiere_id: ID de la filière (optionnel)
            
        Returns:
            Nombre d'inscriptions
        """
        query = db.query(Inscription)
        
        if annee:
            query = query.filter(Inscription.annee_academique == annee)
        if filiere_id:
            query = query.filter(Inscription.filiere_id == filiere_id)
        
        if hasattr(Inscription, "is_active"):
            query = query.filter(Inscription.is_active == True)
        
        return query.count()


# Instance singleton du repository
inscription_repository = InscriptionRepository()
