"""
Repository pour la gestion des échéanciers
"""

from datetime import date, datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

from app.models.echeancier import Echeancier
from app.models.facture import Facture
from app.schemas.echeancier import EcheancierCreate, EcheancierUpdate
from app.repositories.base_repository import BaseRepository


class EcheancierRepository(BaseRepository[Echeancier, EcheancierCreate, EcheancierUpdate]):
    """Repository pour les opérations sur les échéanciers."""

    def __init__(self):
        super().__init__(Echeancier)

    def get_by_facture(self, db: Session, facture_id: int) -> list[Echeancier]:
        """
        Liste les échéances d'une facture.
        
        Args:
            db: Session de base de données
            facture_id: ID de la facture
            
        Returns:
            Liste des échéances
        """
        return db.query(self.model).filter(
            self.model.facture_id == facture_id
        ).order_by(self.model.numero_echeance.asc()).all()

    def get_by_etudiant(
        self, db: Session, etudiant_id: int, statut: str = None
    ) -> list[Echeancier]:
        """
        Liste les échéances d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            statut: Statut des échéances (optionnel)
            
        Returns:
            Liste des échéances
        """
        query = db.query(self.model).filter(self.model.etudiant_id == etudiant_id)
        
        if statut:
            query = query.filter(self.model.statut == statut)
        
        return query.order_by(self.model.date_echeance.asc()).all()

    def get_echeances_proches(self, db: Session, jours: int = 7) -> list[Echeancier]:
        """
        Liste les échéances dans les X prochains jours.
        
        Args:
            db: Session de base de données
            jours: Nombre de jours
            
        Returns:
            Liste des échéances proches
        """
        today = date.today()
        date_limite = today + timedelta(days=jours)
        
        return db.query(self.model).filter(
            self.model.date_echeance >= today,
            self.model.date_echeance <= date_limite,
            self.model.statut == "en_attente"
        ).order_by(self.model.date_echeance.asc()).all()

    def get_echeances_retard(self, db: Session) -> list[Echeancier]:
        """
        Liste les échéances en retard.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des échéances en retard
        """
        today = date.today()
        
        return db.query(self.model).filter(
            self.model.date_echeance < today,
            self.model.statut == "en_attente"
        ).order_by(self.model.date_echeance.asc()).all()

    def create_echeancier(
        self, db: Session, facture_id: int, echeances: list[dict]
    ) -> list[Echeancier]:
        """
        Crée un échéancier pour une facture.
        
        Args:
            db: Session de base de données
            facture_id: ID de la facture
            echeances: Liste des échéances [{date_echeance, montant_echeance}]
            
        Returns:
            Liste des échéances créées
        """
        # Récupérer la facture
        facture = db.query(Facture).filter(Facture.id == facture_id).first()
        if not facture:
            return []
        
        # Vérifier que la somme des échéances = montant facture
        total_echeances = sum(
            Decimal(str(e.get("montant_echeance", 0))) for e in echeances
        )
        
        if total_echeances != facture.montant_restant:
            raise ValueError(
                f"La somme des échéances ({total_echeances}) ne correspond pas "
                f"au montant restant de la facture ({facture.montant_restant})"
            )
        
        # Créer les échéances
        echeances_creees = []
        for i, echeance_data in enumerate(echeances, start=1):
            echeance = Echeancier(
                etudiant_id=facture.etudiant_id,
                facture_id=facture_id,
                numero_echeance=i,
                date_echeance=echeance_data["date_echeance"],
                montant_echeance=Decimal(str(echeance_data["montant_echeance"])),
                montant_paye=Decimal("0"),
                statut="en_attente",
            )
            db.add(echeance)
            echeances_creees.append(echeance)
        
        db.commit()
        
        for echeance in echeances_creees:
            db.refresh(echeance)
        
        return echeances_creees

    def marquer_payee(
        self, db: Session, id: int, montant_paye: float
    ) -> Echeancier | None:
        """
        Marque une échéance comme payée.
        
        Args:
            db: Session de base de données
            id: ID de l'échéance
            montant_paye: Montant payé
            
        Returns:
            L'échéance mise à jour ou None
        """
        echeance = self.get_by_id(db, id)
        if not echeance:
            return None
        
        echeance.montant_paye += Decimal(str(montant_paye))
        
        if echeance.montant_paye >= echeance.montant_echeance:
            echeance.statut = "payee"
        
        echeance.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(echeance)
        return echeance

    def mettre_a_jour_statuts(self, db: Session) -> int:
        """
        Met à jour les statuts des échéances en retard.
        
        Args:
            db: Session de base de données
            
        Returns:
            Nombre d'échéances mises à jour
        """
        today = date.today()
        
        echeances_retard = db.query(self.model).filter(
            self.model.date_echeance < today,
            self.model.statut == "en_attente"
        ).all()
        
        count = 0
        for echeance in echeances_retard:
            echeance.statut = "en_retard"
            echeance.updated_at = datetime.utcnow()
            count += 1
        
        db.commit()
        return count

    def supprimer_echeancier_facture(self, db: Session, facture_id: int) -> int:
        """
        Supprime toutes les échéances d'une facture.
        
        Args:
            db: Session de base de données
            facture_id: ID de la facture
            
        Returns:
            Nombre d'échéances supprimées
        """
        count = db.query(self.model).filter(
            self.model.facture_id == facture_id
        ).delete()
        
        db.commit()
        return count


# Instance singleton du repository
echeancier_repository = EcheancierRepository()
