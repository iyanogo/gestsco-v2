"""
Repository pour la gestion des comptes étudiants
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.compte_etudiant import CompteEtudiant
from app.schemas.compte_etudiant import CompteEtudiantCreate, CompteEtudiantUpdate
from app.repositories.base_repository import BaseRepository


class CompteEtudiantRepository(BaseRepository[CompteEtudiant, CompteEtudiantCreate, CompteEtudiantUpdate]):
    """Repository pour les opérations sur les comptes étudiants."""

    def __init__(self):
        super().__init__(CompteEtudiant)

    def get_by_etudiant(
        self, db: Session, etudiant_id: int, annee_id: int
    ) -> CompteEtudiant | None:
        """
        Récupère le compte d'un étudiant pour une année.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            annee_id: ID de l'année académique
            
        Returns:
            Le compte trouvé ou None
        """
        return db.query(self.model).filter(
            self.model.etudiant_id == etudiant_id,
            self.model.annee_academique_id == annee_id
        ).first()

    def get_or_create(
        self, db: Session, etudiant_id: int, annee_id: int
    ) -> CompteEtudiant:
        """
        Récupère ou crée le compte d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            annee_id: ID de l'année académique
            
        Returns:
            Le compte existant ou nouvellement créé
        """
        compte = self.get_by_etudiant(db, etudiant_id, annee_id)
        
        if not compte:
            compte = CompteEtudiant(
                etudiant_id=etudiant_id,
                annee_academique_id=annee_id,
                solde_actuel=Decimal("0"),
                total_facture=Decimal("0"),
                total_paye=Decimal("0"),
                total_restant=Decimal("0"),
                statut_compte="actif",
            )
            db.add(compte)
            db.commit()
            db.refresh(compte)
        
        return compte

    def get_debiteurs(
        self, db: Session, annee_id: int = None, seuil_dette: float = 0
    ) -> list[CompteEtudiant]:
        """
        Liste les comptes débiteurs (avec dette).
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique (optionnel)
            seuil_dette: Seuil minimum de dette
            
        Returns:
            Liste des comptes débiteurs
        """
        query = db.query(self.model).filter(
            self.model.solde_actuel < -Decimal(str(seuil_dette))
        )
        
        if annee_id:
            query = query.filter(self.model.annee_academique_id == annee_id)
        
        return query.order_by(self.model.solde_actuel.asc()).all()

    def get_crediteurs(self, db: Session, annee_id: int = None) -> list[CompteEtudiant]:
        """
        Liste les comptes créditeurs (avec avance).
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique (optionnel)
            
        Returns:
            Liste des comptes créditeurs
        """
        query = db.query(self.model).filter(self.model.solde_actuel > 0)
        
        if annee_id:
            query = query.filter(self.model.annee_academique_id == annee_id)
        
        return query.order_by(self.model.solde_actuel.desc()).all()

    def mettre_a_jour_solde(
        self, db: Session, compte_id: int, montant: float, type_operation: str
    ) -> CompteEtudiant | None:
        """
        Met à jour le solde d'un compte.
        
        Args:
            db: Session de base de données
            compte_id: ID du compte
            montant: Montant de l'opération
            type_operation: Type d'opération (facture, paiement)
            
        Returns:
            Le compte mis à jour ou None
        """
        compte = self.get_by_id(db, compte_id)
        if not compte:
            return None
        
        montant_decimal = Decimal(str(montant))
        
        if type_operation == "facture":
            compte.solde_actuel -= montant_decimal
            compte.total_facture += montant_decimal
        elif type_operation == "paiement":
            compte.solde_actuel += montant_decimal
            compte.total_paye += montant_decimal
        elif type_operation == "annulation_facture":
            compte.solde_actuel += montant_decimal
            compte.total_facture -= montant_decimal
        elif type_operation == "annulation_paiement":
            compte.solde_actuel -= montant_decimal
            compte.total_paye -= montant_decimal
        
        compte.total_restant = compte.total_facture - compte.total_paye
        compte.date_derniere_operation = datetime.utcnow()
        
        # Mettre à jour le statut si nécessaire
        if compte.total_restant <= 0 and compte.statut_compte == "actif":
            compte.statut_compte = "solde"
        
        compte.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(compte)
        return compte

    def bloquer_compte(
        self, db: Session, compte_id: int, motif: str
    ) -> CompteEtudiant | None:
        """
        Bloque un compte étudiant.
        
        Args:
            db: Session de base de données
            compte_id: ID du compte
            motif: Motif du blocage
            
        Returns:
            Le compte mis à jour ou None
        """
        compte = self.get_by_id(db, compte_id)
        if not compte:
            return None
        
        compte.statut_compte = "bloque"
        compte.observations = motif
        compte.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(compte)
        return compte

    def debloquer_compte(self, db: Session, compte_id: int) -> CompteEtudiant | None:
        """
        Débloque un compte étudiant.
        
        Args:
            db: Session de base de données
            compte_id: ID du compte
            
        Returns:
            Le compte mis à jour ou None
        """
        compte = self.get_by_id(db, compte_id)
        if not compte:
            return None
        
        compte.statut_compte = "actif"
        compte.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(compte)
        return compte

    def get_by_annee(self, db: Session, annee_id: int) -> list[CompteEtudiant]:
        """
        Liste les comptes pour une année académique.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique
            
        Returns:
            Liste des comptes
        """
        return db.query(self.model).filter(
            self.model.annee_academique_id == annee_id
        ).all()

    def get_by_statut(
        self, db: Session, statut: str, annee_id: int = None
    ) -> list[CompteEtudiant]:
        """
        Liste les comptes par statut.
        
        Args:
            db: Session de base de données
            statut: Statut du compte
            annee_id: ID de l'année académique (optionnel)
            
        Returns:
            Liste des comptes
        """
        query = db.query(self.model).filter(self.model.statut_compte == statut)
        
        if annee_id:
            query = query.filter(self.model.annee_academique_id == annee_id)
        
        return query.all()


# Instance singleton du repository
compte_etudiant_repository = CompteEtudiantRepository()
