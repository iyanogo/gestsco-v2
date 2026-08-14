"""
Repository pour la gestion des factures
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_

from app.models.facture import Facture
from app.models.ligne_facture import LigneFacture
from app.models.compte_etudiant import CompteEtudiant
from app.models.mouvement_compte import MouvementCompte
from app.schemas.facture import FactureCreate, FactureUpdate
from app.repositories.base_repository import BaseRepository


class FactureRepository(BaseRepository[Facture, FactureCreate, FactureUpdate]):
    """Repository pour les opérations sur les factures."""

    def __init__(self):
        super().__init__(Facture)

    def get_by_etudiant(
        self, db: Session, etudiant_id: int, annee_id: int = None
    ) -> list[Facture]:
        """
        Liste les factures d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            annee_id: ID de l'année académique (optionnel)
            
        Returns:
            Liste des factures de l'étudiant
        """
        query = db.query(self.model).filter(self.model.etudiant_id == etudiant_id)
        if annee_id:
            query = query.filter(self.model.annee_academique_id == annee_id)
        return query.order_by(self.model.date_emission.desc()).all()

    def get_by_numero(self, db: Session, numero_facture: str) -> Facture | None:
        """
        Récupère une facture par son numéro.
        
        Args:
            db: Session de base de données
            numero_facture: Numéro de la facture
            
        Returns:
            La facture trouvée ou None
        """
        return db.query(self.model).filter(
            self.model.numero_facture == numero_facture
        ).first()

    def get_by_statut(
        self, db: Session, statut: str, skip: int = 0, limit: int = 100
    ) -> list[Facture]:
        """
        Liste les factures par statut.
        
        Args:
            db: Session de base de données
            statut: Statut des factures
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des factures avec le statut spécifié
        """
        return db.query(self.model).filter(
            self.model.statut == statut
        ).offset(skip).limit(limit).all()

    def get_impayees(self, db: Session, skip: int = 0, limit: int = 100) -> list[Facture]:
        """
        Liste les factures impayées (en_attente ou partiellement_payee).
        
        Args:
            db: Session de base de données
            skip: Nombre d'éléments à ignorer
            limit: Nombre maximum d'éléments
            
        Returns:
            Liste des factures impayées
        """
        return db.query(self.model).filter(
            or_(
                self.model.statut == "en_attente",
                self.model.statut == "partiellement_payee"
            )
        ).offset(skip).limit(limit).all()

    def get_expirees(self, db: Session) -> list[Facture]:
        """
        Liste les factures expirées (date_echeance dépassée et non payées).
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des factures expirées
        """
        today = date.today()
        return db.query(self.model).filter(
            self.model.date_echeance < today,
            self.model.statut != "payee",
            self.model.statut != "annulee"
        ).all()

    def _generer_numero_facture(self, db: Session) -> str:
        """
        Génère un numéro de facture unique.
        
        Format: FAC-YYYY-XXXXX
        """
        year = datetime.now().year
        prefix = f"FAC-{year}-"
        
        # Trouver le dernier numéro de l'année
        last_facture = db.query(self.model).filter(
            self.model.numero_facture.like(f"{prefix}%")
        ).order_by(self.model.numero_facture.desc()).first()
        
        if last_facture:
            last_num = int(last_facture.numero_facture.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:05d}"

    def create_with_lignes(
        self, db: Session, facture_create: FactureCreate, user_id: int
    ) -> Facture:
        """
        Crée une facture avec ses lignes.
        
        Args:
            db: Session de base de données
            facture_create: Données de la facture à créer
            user_id: ID de l'utilisateur créateur
            
        Returns:
            La facture créée
        """
        # Générer le numéro de facture
        numero_facture = self._generer_numero_facture(db)
        
        # Calculer les montants des lignes
        montant_total = Decimal("0")
        lignes_data = []
        
        for ligne in facture_create.lignes:
            montant_ligne = Decimal(str(ligne.prix_unitaire)) * ligne.quantite
            tva_montant = montant_ligne * (ligne.tva_taux / Decimal("100"))
            montant_ttc = montant_ligne + tva_montant
            montant_total += montant_ttc
            
            lignes_data.append({
                "libelle": ligne.libelle,
                "description": ligne.description,
                "quantite": ligne.quantite,
                "prix_unitaire": ligne.prix_unitaire,
                "montant_ligne": montant_ligne,
                "tva_taux": ligne.tva_taux,
                "tva_montant": tva_montant,
                "montant_ttc": montant_ttc,
                "frais_scolarite_id": getattr(ligne, "frais_scolarite_id", None),
            })
        
        # Créer la facture
        facture = Facture(
            numero_facture=numero_facture,
            etudiant_id=facture_create.etudiant_id,
            annee_academique_id=facture_create.annee_academique_id,
            date_emission=date.today(),
            date_echeance=facture_create.date_echeance,
            type_facture=facture_create.type_facture,
            description=facture_create.description,
            observations=facture_create.observations,
            montant_total=montant_total,
            montant_paye=Decimal("0"),
            montant_restant=montant_total,
            statut="en_attente",
            emise_par=user_id,
        )
        db.add(facture)
        db.flush()
        
        # Créer les lignes de facture
        for ligne_data in lignes_data:
            ligne = LigneFacture(facture_id=facture.id, **ligne_data)
            db.add(ligne)
        
        # Récupérer ou créer le compte étudiant
        compte = db.query(CompteEtudiant).filter(
            CompteEtudiant.etudiant_id == facture_create.etudiant_id,
            CompteEtudiant.annee_academique_id == facture_create.annee_academique_id
        ).first()
        
        if not compte:
            compte = CompteEtudiant(
                etudiant_id=facture_create.etudiant_id,
                annee_academique_id=facture_create.annee_academique_id,
                solde_actuel=Decimal("0"),
                total_facture=Decimal("0"),
                total_paye=Decimal("0"),
                total_restant=Decimal("0"),
            )
            db.add(compte)
            db.flush()
        
        # Créer le mouvement de compte (débit)
        solde_avant = compte.solde_actuel
        solde_apres = solde_avant - montant_total
        
        mouvement = MouvementCompte(
            compte_id=compte.id,
            type_mouvement="debit",
            montant=montant_total,
            solde_avant=solde_avant,
            solde_apres=solde_apres,
            libelle=f"Facture {numero_facture}",
            description=facture_create.description,
            facture_id=facture.id,
            effectue_par=user_id,
        )
        db.add(mouvement)
        
        # Mettre à jour le compte
        compte.solde_actuel = solde_apres
        compte.total_facture += montant_total
        compte.total_restant = compte.total_facture - compte.total_paye
        compte.date_derniere_operation = datetime.utcnow()
        
        db.commit()
        db.refresh(facture)
        return facture

    def valider_facture(self, db: Session, id: int, user_id: int) -> Facture | None:
        """
        Valide une facture.
        
        Args:
            db: Session de base de données
            id: ID de la facture
            user_id: ID de l'utilisateur validateur
            
        Returns:
            La facture mise à jour ou None
        """
        facture = self.get_by_id(db, id)
        if not facture:
            return None
        
        facture.validee_par = user_id
        facture.date_validation = datetime.utcnow()
        facture.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(facture)
        return facture

    def annuler_facture(
        self, db: Session, id: int, user_id: int, motif: str
    ) -> Facture | None:
        """
        Annule une facture.
        
        Args:
            db: Session de base de données
            id: ID de la facture
            user_id: ID de l'utilisateur
            motif: Motif de l'annulation
            
        Returns:
            La facture mise à jour ou None
        """
        facture = self.get_by_id(db, id)
        if not facture:
            return None
        
        # Récupérer le compte étudiant
        compte = db.query(CompteEtudiant).filter(
            CompteEtudiant.etudiant_id == facture.etudiant_id,
            CompteEtudiant.annee_academique_id == facture.annee_academique_id
        ).first()
        
        if compte:
            # Créer le mouvement de compte inverse (crédit)
            solde_avant = compte.solde_actuel
            solde_apres = solde_avant + facture.montant_restant
            
            mouvement = MouvementCompte(
                compte_id=compte.id,
                type_mouvement="credit",
                montant=facture.montant_restant,
                solde_avant=solde_avant,
                solde_apres=solde_apres,
                libelle=f"Annulation facture {facture.numero_facture}",
                description=motif,
                facture_id=facture.id,
                effectue_par=user_id,
            )
            db.add(mouvement)
            
            # Mettre à jour le compte
            compte.solde_actuel = solde_apres
            compte.total_facture -= facture.montant_restant
            compte.total_restant = compte.total_facture - compte.total_paye
            compte.date_derniere_operation = datetime.utcnow()
        
        # Mettre à jour la facture
        facture.statut = "annulee"
        facture.annulee_par = user_id
        facture.date_annulation = datetime.utcnow()
        facture.motif_annulation = motif
        facture.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(facture)
        return facture

    def calculer_statistiques(
        self, db: Session, annee_id: int = None, 
        date_debut: date = None, date_fin: date = None
    ) -> dict:
        """
        Calcule les statistiques des factures.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique (optionnel)
            date_debut: Date de début (optionnel)
            date_fin: Date de fin (optionnel)
            
        Returns:
            Dictionnaire avec les statistiques
        """
        query = db.query(self.model).filter(self.model.statut != "annulee")
        
        if annee_id:
            query = query.filter(self.model.annee_academique_id == annee_id)
        if date_debut:
            query = query.filter(self.model.date_emission >= date_debut)
        if date_fin:
            query = query.filter(self.model.date_emission <= date_fin)
        
        factures = query.all()
        
        total_factures = len(factures)
        montant_total = sum(f.montant_total for f in factures) if factures else Decimal("0")
        montant_paye = sum(f.montant_paye for f in factures) if factures else Decimal("0")
        montant_restant = sum(f.montant_restant for f in factures) if factures else Decimal("0")
        
        taux_recouvrement = (
            float(montant_paye / montant_total * 100) if montant_total > 0 else 0
        )
        
        return {
            "total_factures": total_factures,
            "montant_total": float(montant_total),
            "montant_paye": float(montant_paye),
            "montant_restant": float(montant_restant),
            "taux_recouvrement": round(taux_recouvrement, 2),
        }


# Instance singleton du repository
facture_repository = FactureRepository()
