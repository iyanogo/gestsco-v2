"""
Repository pour la gestion des paiements
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.paiement import Paiement
from app.schemas.paiement import PaiementCreate, PaiementUpdate
from app.repositories.base_repository import BaseRepository
from app.utils.numero_transaction_generator import generate_numero_transaction


class PaiementRepository(BaseRepository[Paiement, PaiementCreate, PaiementUpdate]):
    """Repository pour les opérations sur les paiements."""

    def __init__(self):
        super().__init__(Paiement)

    def get_by_dossier(self, db: Session, dossier_id: int) -> list[Paiement]:
        """
        Liste les paiements d'un dossier de candidature.
        
        Args:
            db: Session de base de données
            dossier_id: ID du dossier
            
        Returns:
            Liste des paiements du dossier
        """
        return db.query(self.model).filter(self.model.dossier_id == dossier_id).all()

    def get_by_inscrit(self, db: Session, inscrit_id: int) -> list[Paiement]:
        """
        Liste les paiements d'une inscription.
        
        Args:
            db: Session de base de données
            inscrit_id: ID de l'inscription
            
        Returns:
            Liste des paiements de l'inscription
        """
        return db.query(self.model).filter(self.model.inscrit_id == inscrit_id).all()

    def get_by_numero_transaction(self, db: Session, numero: str) -> Paiement | None:
        """
        Récupère un paiement par son numéro de transaction.
        
        Args:
            db: Session de base de données
            numero: Numéro de transaction
            
        Returns:
            Le paiement trouvé ou None
        """
        return db.query(self.model).filter(self.model.numero_transaction == numero).first()

    def get_by_statut(
        self, db: Session, statut: str, skip: int = 0, limit: int = 100
    ) -> list[Paiement]:
        """
        Liste les paiements par statut.
        
        Args:
            db: Session de base de données
            statut: Statut des paiements
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des paiements avec le statut spécifié
        """
        return db.query(self.model).filter(
            self.model.statut_paiement == statut
        ).offset(skip).limit(limit).all()

    def create_with_numero(self, db: Session, obj_in: PaiementCreate) -> Paiement:
        """
        Crée un paiement avec génération automatique du numéro de transaction.
        
        Args:
            db: Session de base de données
            obj_in: Données du paiement à créer
            
        Returns:
            Le paiement créé
        """
        # Générer le numéro de transaction
        numero_transaction = generate_numero_transaction(db)
        
        # Créer le paiement
        obj_data = obj_in.model_dump()
        obj_data["numero_transaction"] = numero_transaction
        obj_data["statut_paiement"] = "en_attente"
        
        db_obj = self.model(**obj_data)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def valider_paiement(
        self, db: Session, id: int, user_id: int, numero_recu: str = None
    ) -> Paiement | None:
        """
        Valide un paiement.
        
        Args:
            db: Session de base de données
            id: ID du paiement
            user_id: ID de l'utilisateur validateur
            numero_recu: Numéro du reçu (optionnel)
            
        Returns:
            Le paiement mis à jour ou None
        """
        paiement = self.get_by_id(db, id)
        if not paiement:
            return None

        paiement.statut_paiement = "valide"
        paiement.valide_par = user_id
        paiement.date_validation = datetime.utcnow()
        paiement.numero_recu = numero_recu
        paiement.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(paiement)
        return paiement

    def refuser_paiement(self, db: Session, id: int, commentaire: str) -> Paiement | None:
        """
        Refuse un paiement.
        
        Args:
            db: Session de base de données
            id: ID du paiement
            commentaire: Motif du refus
            
        Returns:
            Le paiement mis à jour ou None
        """
        paiement = self.get_by_id(db, id)
        if not paiement:
            return None

        paiement.statut_paiement = "refuse"
        paiement.commentaire = commentaire
        paiement.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(paiement)
        return paiement

    def get_montant_total_by_dossier(self, db: Session, dossier_id: int) -> float:
        """
        Calcule le montant total des paiements validés pour un dossier.
        
        Args:
            db: Session de base de données
            dossier_id: ID du dossier
            
        Returns:
            Montant total des paiements validés
        """
        result = db.query(func.sum(self.model.montant)).filter(
            self.model.dossier_id == dossier_id,
            self.model.statut_paiement == "valide"
        ).scalar()
        return result or 0.0

    def get_en_attente(self, db: Session, skip: int = 0, limit: int = 100) -> list[Paiement]:
        """
        Liste les paiements en attente de validation.
        
        Args:
            db: Session de base de données
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des paiements en attente
        """
        return db.query(self.model).filter(
            self.model.statut_paiement == "en_attente"
        ).offset(skip).limit(limit).all()


# Instance singleton du repository
paiement_repository = PaiementRepository()
