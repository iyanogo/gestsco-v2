"""
Repository pour la gestion des dossiers de candidature
"""

from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_

from app.models.dossier_candidature import DossierCandidature
from app.models.piece_jointe import PieceJointe
from app.models.type_piece_requise import TypePieceRequise
from app.schemas.dossier_candidature import DossierCandidatureCreate, DossierCandidatureUpdate
from app.repositories.base_repository import BaseRepository
from app.utils.numero_dossier_generator import generate_numero_dossier


class DossierCandidatureRepository(BaseRepository[DossierCandidature, DossierCandidatureCreate, DossierCandidatureUpdate]):
    """Repository pour les opérations sur les dossiers de candidature."""

    def __init__(self):
        super().__init__(DossierCandidature)

    def get_by_numero(self, db: Session, numero: str) -> DossierCandidature | None:
        """
        Récupère un dossier par son numéro.
        
        Args:
            db: Session de base de données
            numero: Numéro du dossier
            
        Returns:
            Le dossier trouvé ou None
        """
        return db.query(self.model).filter(self.model.numero_dossier == numero).first()

    def get_by_campagne(
        self, db: Session, campagne_id: int, skip: int = 0, limit: int = 100
    ) -> list[DossierCandidature]:
        """
        Liste les dossiers d'une campagne.
        
        Args:
            db: Session de base de données
            campagne_id: ID de la campagne
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des dossiers de la campagne
        """
        return db.query(self.model).filter(
            self.model.campagne_id == campagne_id
        ).offset(skip).limit(limit).all()

    def get_by_email(self, db: Session, email: str) -> list[DossierCandidature]:
        """
        Liste les dossiers d'un candidat par email.
        
        Args:
            db: Session de base de données
            email: Email du candidat
            
        Returns:
            Liste des dossiers du candidat
        """
        return db.query(self.model).filter(self.model.candidat_email == email).all()

    def get_by_statut(
        self, db: Session, statut: str, campagne_id: int = None
    ) -> list[DossierCandidature]:
        """
        Liste les dossiers par statut.
        
        Args:
            db: Session de base de données
            statut: Statut des dossiers
            campagne_id: ID de la campagne (optionnel)
            
        Returns:
            Liste des dossiers avec le statut spécifié
        """
        query = db.query(self.model).filter(self.model.statut_dossier == statut)
        if campagne_id:
            query = query.filter(self.model.campagne_id == campagne_id)
        return query.all()

    def get_with_details(self, db: Session, id: int) -> DossierCandidature | None:
        """
        Récupère un dossier avec ses pièces jointes et paiements.
        
        Args:
            db: Session de base de données
            id: ID du dossier
            
        Returns:
            Le dossier avec ses détails ou None
        """
        return db.query(self.model).options(
            joinedload(self.model.pieces_jointes),
            joinedload(self.model.paiements),
            joinedload(self.model.campagne),
            joinedload(self.model.filiere_1),
            joinedload(self.model.filiere_2),
            joinedload(self.model.filiere_3)
        ).filter(self.model.id == id).first()

    def create_with_numero(self, db: Session, obj_in: DossierCandidatureCreate) -> DossierCandidature:
        """
        Crée un dossier avec génération automatique du numéro.
        
        Args:
            db: Session de base de données
            obj_in: Données du dossier à créer
            
        Returns:
            Le dossier créé
        """
        # Générer le numéro de dossier
        numero_dossier = generate_numero_dossier(db, obj_in.campagne_id)
        
        # Créer le dossier
        obj_data = obj_in.model_dump()
        obj_data["numero_dossier"] = numero_dossier
        obj_data["statut_dossier"] = "en_cours"
        
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def soumettre_dossier(self, db: Session, id: int) -> DossierCandidature | None:
        """
        Soumet un dossier (change statut en "complet").
        Vérifie que toutes les pièces requises sont fournies.
        
        Args:
            db: Session de base de données
            id: ID du dossier
            
        Returns:
            Le dossier mis à jour ou None
        """
        dossier = self.get_with_details(db, id)
        if not dossier:
            return None

        # Vérifier que toutes les pièces requises sont fournies
        types_requis = db.query(TypePieceRequise).filter(
            TypePieceRequise.campagne_id == dossier.campagne_id,
            TypePieceRequise.is_required == True
        ).all()

        types_fournis = {pj.type_piece for pj in dossier.pieces_jointes}
        
        for type_requis in types_requis:
            if type_requis.type_piece not in types_fournis:
                raise ValueError(f"Pièce requise manquante: {type_requis.libelle}")

        dossier.statut_dossier = "complet"
        dossier.date_soumission = datetime.utcnow()
        dossier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(dossier)
        return dossier

    def valider_dossier(
        self, db: Session, id: int, commentaire: str = None
    ) -> DossierCandidature | None:
        """
        Valide un dossier (change statut en "valide").
        
        Args:
            db: Session de base de données
            id: ID du dossier
            commentaire: Commentaire de validation
            
        Returns:
            Le dossier mis à jour ou None
        """
        dossier = self.get_by_id(db, id)
        if not dossier:
            return None

        dossier.statut_dossier = "valide"
        dossier.date_validation = datetime.utcnow()
        dossier.commentaire_validation = commentaire
        dossier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(dossier)
        return dossier

    def refuser_dossier(
        self, db: Session, id: int, commentaire: str
    ) -> DossierCandidature | None:
        """
        Refuse un dossier (change statut en "refuse").
        
        Args:
            db: Session de base de données
            id: ID du dossier
            commentaire: Motif du refus
            
        Returns:
            Le dossier mis à jour ou None
        """
        dossier = self.get_by_id(db, id)
        if not dossier:
            return None

        dossier.statut_dossier = "refuse"
        dossier.date_validation = datetime.utcnow()
        dossier.commentaire_validation = commentaire
        dossier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(dossier)
        return dossier

    def admettre_candidat(
        self, db: Session, id: int, filiere_id: int
    ) -> DossierCandidature | None:
        """
        Admet un candidat (change statut en "admis" et définit la filière).
        
        Args:
            db: Session de base de données
            id: ID du dossier
            filiere_id: ID de la filière d'admission
            
        Returns:
            Le dossier mis à jour ou None
        """
        dossier = self.get_by_id(db, id)
        if not dossier:
            return None

        dossier.statut_dossier = "admis"
        dossier.filiere_admise = filiere_id
        dossier.date_validation = datetime.utcnow()
        dossier.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(dossier)
        return dossier

    def search_advanced(
        self,
        db: Session,
        nom: str = None,
        email: str = None,
        campagne_id: int = None,
        statut: str = None,
        skip: int = 0,
        limit: int = 100
    ) -> list[DossierCandidature]:
        """
        Recherche avancée de dossiers.
        
        Args:
            db: Session de base de données
            nom: Nom du candidat (recherche partielle)
            email: Email du candidat (recherche partielle)
            campagne_id: ID de la campagne
            statut: Statut du dossier
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des dossiers correspondants
        """
        query = db.query(self.model)

        if nom:
            search_term = f"%{nom}%"
            query = query.filter(
                or_(
                    self.model.candidat_nom.ilike(search_term),
                    self.model.candidat_prenom.ilike(search_term)
                )
            )

        if email:
            query = query.filter(self.model.candidat_email.ilike(f"%{email}%"))

        if campagne_id:
            query = query.filter(self.model.campagne_id == campagne_id)

        if statut:
            query = query.filter(self.model.statut_dossier == statut)

        return query.offset(skip).limit(limit).all()

    def count_by_campagne(self, db: Session, campagne_id: int, statut: str = None) -> int:
        """
        Compte les dossiers d'une campagne.
        
        Args:
            db: Session de base de données
            campagne_id: ID de la campagne
            statut: Statut des dossiers (optionnel)
            
        Returns:
            Nombre de dossiers
        """
        query = db.query(self.model).filter(self.model.campagne_id == campagne_id)
        if statut:
            query = query.filter(self.model.statut_dossier == statut)
        return query.count()


# Instance singleton du repository
dossier_candidature_repository = DossierCandidatureRepository()
