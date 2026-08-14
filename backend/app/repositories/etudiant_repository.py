"""
Repository pour la gestion des étudiants
"""

from datetime import datetime
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session, joinedload

from app.models.etudiant import Etudiant
from app.models.inscription import Inscription
from app.schemas.etudiant import EtudiantCreate, EtudiantUpdate
from app.repositories.base_repository import BaseRepository
from app.utils.matricule_generator import generate_matricule


class EtudiantRepository(BaseRepository[Etudiant, EtudiantCreate, EtudiantUpdate]):
    """Repository pour les opérations CRUD sur les étudiants."""

    def __init__(self):
        super().__init__(Etudiant)

    def get_by_matricule(self, db: Session, matricule: str) -> Optional[Etudiant]:
        """
        Récupère un étudiant par son matricule.
        
        Args:
            db: Session de base de données
            matricule: Matricule de l'étudiant
            
        Returns:
            L'étudiant trouvé ou None
        """
        return db.query(Etudiant).filter(Etudiant.matricule == matricule).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Etudiant]:
        """
        Récupère un étudiant par son email.
        
        Args:
            db: Session de base de données
            email: Email de l'étudiant
            
        Returns:
            L'étudiant trouvé ou None
        """
        return db.query(Etudiant).filter(Etudiant.email == email).first()

    def get_by_ine(self, db: Session, ine: str) -> Optional[Etudiant]:
        """
        Récupère un étudiant par son INE.
        
        Args:
            db: Session de base de données
            ine: Identifiant National Étudiant
            
        Returns:
            L'étudiant trouvé ou None
        """
        return db.query(Etudiant).filter(Etudiant.ine == ine).first()

    def get_with_details(self, db: Session, id: int) -> Optional[Etudiant]:
        """
        Récupère un étudiant avec ses documents et inscriptions.
        
        Args:
            db: Session de base de données
            id: ID de l'étudiant
            
        Returns:
            L'étudiant avec ses relations chargées ou None
        """
        return (
            db.query(Etudiant)
            .options(
                joinedload(Etudiant.documents),
                joinedload(Etudiant.inscriptions)
            )
            .filter(Etudiant.id == id)
            .first()
        )

    def search_advanced(
        self,
        db: Session,
        nom: Optional[str] = None,
        prenom: Optional[str] = None,
        matricule: Optional[str] = None,
        email: Optional[str] = None,
        statut: Optional[str] = None,
        annee_academique: Optional[str] = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[Etudiant]:
        """
        Recherche avancée avec plusieurs critères.
        
        Args:
            db: Session de base de données
            nom: Nom à rechercher (ILIKE)
            prenom: Prénom à rechercher (ILIKE)
            matricule: Matricule à rechercher (ILIKE)
            email: Email à rechercher (ILIKE)
            statut: Statut exact
            annee_academique: Année académique (filtre via inscriptions)
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des étudiants correspondants
        """
        query = db.query(Etudiant)
        
        if hasattr(Etudiant, "is_active"):
            query = query.filter(Etudiant.is_active == True)
        
        if nom:
            query = query.filter(Etudiant.nom.ilike(f"%{nom}%"))
        if prenom:
            query = query.filter(Etudiant.prenom.ilike(f"%{prenom}%"))
        if matricule:
            query = query.filter(Etudiant.matricule.ilike(f"%{matricule}%"))
        if email:
            query = query.filter(Etudiant.email.ilike(f"%{email}%"))
        if statut:
            query = query.filter(Etudiant.statut == statut)
        if annee_academique:
            query = query.join(Inscription).filter(
                Inscription.annee_academique == annee_academique,
                Inscription.is_active == True
            ).distinct()
        
        return query.offset(skip).limit(limit).all()

    def search(
        self,
        db: Session,
        query_str: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[Etudiant]:
        """
        Recherche générale dans nom, prenom, matricule, email.
        
        Args:
            db: Session de base de données
            query_str: Terme de recherche
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des étudiants correspondants
        """
        search_term = f"%{query_str}%"
        query = db.query(Etudiant)
        
        if hasattr(Etudiant, "is_active"):
            query = query.filter(Etudiant.is_active == True)
        
        query = query.filter(
            or_(
                Etudiant.nom.ilike(search_term),
                Etudiant.prenom.ilike(search_term),
                Etudiant.matricule.ilike(search_term),
                Etudiant.email.ilike(search_term)
            )
        )
        
        return query.offset(skip).limit(limit).all()

    def get_by_statut(
        self,
        db: Session,
        statut: str,
        skip: int = 0,
        limit: int = 100
    ) -> list[Etudiant]:
        """
        Liste les étudiants par statut.
        
        Args:
            db: Session de base de données
            statut: Statut à filtrer (actif, suspendu, diplômé, exclu)
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des étudiants avec ce statut
        """
        query = db.query(Etudiant).filter(Etudiant.statut == statut)
        
        if hasattr(Etudiant, "is_active"):
            query = query.filter(Etudiant.is_active == True)
        
        return query.offset(skip).limit(limit).all()

    def get_statistiques(self, db: Session) -> dict:
        """
        Retourne des statistiques sur les étudiants.
        
        Args:
            db: Session de base de données
            
        Returns:
            Dictionnaire avec total, par_statut, par_sexe
        """
        base_query = db.query(Etudiant)
        if hasattr(Etudiant, "is_active"):
            base_query = base_query.filter(Etudiant.is_active == True)
        
        total = base_query.count()
        
        # Par statut
        statut_counts = (
            base_query
            .with_entities(Etudiant.statut, func.count(Etudiant.id))
            .group_by(Etudiant.statut)
            .all()
        )
        par_statut = {statut or "non_defini": count for statut, count in statut_counts}
        
        # Par sexe
        sexe_counts = (
            base_query
            .with_entities(Etudiant.sexe, func.count(Etudiant.id))
            .group_by(Etudiant.sexe)
            .all()
        )
        par_sexe = {sexe or "non_defini": count for sexe, count in sexe_counts}
        
        return {
            "total": total,
            "par_statut": par_statut,
            "par_sexe": par_sexe
        }

    def create_with_matricule(self, db: Session, obj_in: EtudiantCreate) -> Etudiant:
        """
        Crée un étudiant et génère automatiquement le matricule.
        
        Args:
            db: Session de base de données
            obj_in: Données de création de l'étudiant
            
        Returns:
            L'étudiant créé avec son matricule
        """
        obj_data = obj_in.model_dump()
        
        # Générer le matricule
        matricule = generate_matricule(db)
        obj_data["matricule"] = matricule
        
        # Définir les valeurs par défaut
        if "statut" not in obj_data or obj_data["statut"] is None:
            obj_data["statut"] = "actif"
        if "is_active" not in obj_data or obj_data["is_active"] is None:
            obj_data["is_active"] = True
        
        db_obj = Etudiant(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_photo(self, db: Session, id: int, photo_url: str) -> Optional[Etudiant]:
        """
        Met à jour la photo d'un étudiant.
        
        Args:
            db: Session de base de données
            id: ID de l'étudiant
            photo_url: URL de la nouvelle photo
            
        Returns:
            L'étudiant mis à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.photo_url = photo_url
        if hasattr(db_obj, "last_modified_date"):
            db_obj.last_modified_date = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def change_statut(self, db: Session, id: int, nouveau_statut: str) -> Optional[Etudiant]:
        """
        Change le statut d'un étudiant.
        
        Args:
            db: Session de base de données
            id: ID de l'étudiant
            nouveau_statut: Nouveau statut (actif, suspendu, diplômé, exclu)
            
        Returns:
            L'étudiant mis à jour ou None
        """
        db_obj = self.get_by_id(db, id)
        if not db_obj:
            return None
        
        db_obj.statut = nouveau_statut
        if hasattr(db_obj, "last_modified_date"):
            db_obj.last_modified_date = datetime.utcnow()
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_count_by_statut(self, db: Session, statut: Optional[str] = None) -> int:
        """
        Compte les étudiants, optionnellement par statut.
        
        Args:
            db: Session de base de données
            statut: Statut à filtrer (optionnel)
            
        Returns:
            Nombre d'étudiants
        """
        query = db.query(Etudiant)
        
        if hasattr(Etudiant, "is_active"):
            query = query.filter(Etudiant.is_active == True)
        
        if statut:
            query = query.filter(Etudiant.statut == statut)
        
        return query.count()


# Instance singleton du repository
etudiant_repository = EtudiantRepository()
