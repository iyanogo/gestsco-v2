"""
Repository pour la gestion des remises
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.remise import Remise
from app.models.remise_etudiant import RemiseEtudiant
from app.models.facture import Facture
from app.schemas.remise import RemiseCreate, RemiseUpdate
from app.repositories.base_repository import BaseRepository


class RemiseRepository(BaseRepository[Remise, RemiseCreate, RemiseUpdate]):
    """Repository pour les opérations sur les remises."""

    def __init__(self):
        super().__init__(Remise)

    def get_by_code(self, db: Session, code: str) -> Remise | None:
        """
        Récupère une remise par son code.
        
        Args:
            db: Session de base de données
            code: Code de la remise
            
        Returns:
            La remise trouvée ou None
        """
        return db.query(self.model).filter(self.model.code == code).first()

    def get_valides(self, db: Session, date_reference: date = None) -> list[Remise]:
        """
        Liste les remises valides à une date donnée.
        
        Args:
            db: Session de base de données
            date_reference: Date de référence (par défaut aujourd'hui)
            
        Returns:
            Liste des remises valides
        """
        if date_reference is None:
            date_reference = date.today()
        
        return db.query(self.model).filter(
            self.model.date_debut <= date_reference,
            self.model.date_fin >= date_reference,
            self.model.is_active == True
        ).all()

    def get_disponibles(self, db: Session) -> list[Remise]:
        """
        Liste les remises disponibles (valides et non épuisées).
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des remises disponibles
        """
        today = date.today()
        
        return db.query(self.model).filter(
            self.model.date_debut <= today,
            self.model.date_fin >= today,
            self.model.is_active == True,
            or_(
                self.model.nombre_utilisations_max == None,
                self.model.nombre_utilisations < self.model.nombre_utilisations_max
            )
        ).all()

    def appliquer_remise(
        self, db: Session, remise_id: int, etudiant_id: int,
        facture_id: int, annee_id: int, user_id: int
    ) -> RemiseEtudiant | None:
        """
        Applique une remise à un étudiant.
        
        Args:
            db: Session de base de données
            remise_id: ID de la remise
            etudiant_id: ID de l'étudiant
            facture_id: ID de la facture
            annee_id: ID de l'année académique
            user_id: ID de l'utilisateur
            
        Returns:
            L'attribution de remise créée ou None
        """
        remise = self.get_by_id(db, remise_id)
        if not remise:
            return None
        
        # Vérifier si la remise est disponible
        today = date.today()
        if not remise.is_active:
            return None
        if remise.date_debut > today or remise.date_fin < today:
            return None
        if (remise.nombre_utilisations_max and 
            remise.nombre_utilisations >= remise.nombre_utilisations_max):
            return None
        
        # Récupérer la facture
        facture = db.query(Facture).filter(Facture.id == facture_id).first()
        if not facture:
            return None
        
        # Calculer le montant de la remise
        if remise.type_remise == "pourcentage":
            montant_remise = facture.montant_total * (remise.valeur / Decimal("100"))
        else:  # montant_fixe
            montant_remise = remise.valeur
        
        # Ne pas dépasser le montant restant
        montant_remise = min(montant_remise, facture.montant_restant)
        
        # Créer l'attribution de remise
        remise_etudiant = RemiseEtudiant(
            remise_id=remise_id,
            etudiant_id=etudiant_id,
            facture_id=facture_id,
            annee_academique_id=annee_id,
            montant_remise=montant_remise,
            date_attribution=today,
            attribuee_par=user_id,
        )
        db.add(remise_etudiant)
        
        # Incrémenter le compteur d'utilisations
        remise.nombre_utilisations += 1
        remise.updated_at = datetime.utcnow()
        
        # Mettre à jour la facture
        facture.montant_restant -= montant_remise
        if facture.montant_restant <= 0:
            facture.statut = "payee"
        facture.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(remise_etudiant)
        return remise_etudiant

    def get_attributions(self, db: Session, remise_id: int) -> list[RemiseEtudiant]:
        """
        Liste les attributions d'une remise.
        
        Args:
            db: Session de base de données
            remise_id: ID de la remise
            
        Returns:
            Liste des attributions
        """
        return db.query(RemiseEtudiant).filter(
            RemiseEtudiant.remise_id == remise_id
        ).order_by(RemiseEtudiant.date_attribution.desc()).all()

    def get_by_type_frais(self, db: Session, type_frais_id: int) -> list[Remise]:
        """
        Liste les remises pour un type de frais.
        
        Args:
            db: Session de base de données
            type_frais_id: ID du type de frais
            
        Returns:
            Liste des remises
        """
        return db.query(self.model).filter(
            self.model.type_frais_id == type_frais_id,
            self.model.is_active == True
        ).all()


# Instance singleton du repository
remise_repository = RemiseRepository()
