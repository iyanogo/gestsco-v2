"""
Repository pour la gestion des paiements de factures
"""

from datetime import date, datetime
from decimal import Decimal
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract

from app.models.paiement_facture import PaiementFacture
from app.models.facture import Facture
from app.models.compte_etudiant import CompteEtudiant
from app.models.mouvement_compte import MouvementCompte
from app.models.echeancier import Echeancier
from app.schemas.paiement_facture import PaiementFactureCreate, PaiementFactureUpdate
from app.repositories.base_repository import BaseRepository


class PaiementFactureRepository(BaseRepository[PaiementFacture, PaiementFactureCreate, PaiementFactureUpdate]):
    """Repository pour les opérations sur les paiements de factures."""

    def __init__(self):
        super().__init__(PaiementFacture)

    def get_by_facture(self, db: Session, facture_id: int) -> list[PaiementFacture]:
        """
        Liste les paiements d'une facture.
        
        Args:
            db: Session de base de données
            facture_id: ID de la facture
            
        Returns:
            Liste des paiements de la facture
        """
        return db.query(self.model).filter(
            self.model.facture_id == facture_id
        ).order_by(self.model.date_paiement.desc()).all()

    def get_by_etudiant(
        self, db: Session, etudiant_id: int, 
        date_debut: date = None, date_fin: date = None
    ) -> list[PaiementFacture]:
        """
        Liste les paiements d'un étudiant.
        
        Args:
            db: Session de base de données
            etudiant_id: ID de l'étudiant
            date_debut: Date de début (optionnel)
            date_fin: Date de fin (optionnel)
            
        Returns:
            Liste des paiements de l'étudiant
        """
        query = db.query(self.model).filter(self.model.etudiant_id == etudiant_id)
        
        if date_debut:
            query = query.filter(self.model.date_paiement >= date_debut)
        if date_fin:
            query = query.filter(self.model.date_paiement <= date_fin)
        
        return query.order_by(self.model.date_paiement.desc()).all()

    def get_by_numero(self, db: Session, numero_paiement: str) -> PaiementFacture | None:
        """
        Récupère un paiement par son numéro.
        
        Args:
            db: Session de base de données
            numero_paiement: Numéro du paiement
            
        Returns:
            Le paiement trouvé ou None
        """
        return db.query(self.model).filter(
            self.model.numero_paiement == numero_paiement
        ).first()

    def get_by_statut(self, db: Session, statut: str) -> list[PaiementFacture]:
        """
        Liste les paiements par statut.
        
        Args:
            db: Session de base de données
            statut: Statut des paiements
            
        Returns:
            Liste des paiements avec le statut spécifié
        """
        return db.query(self.model).filter(
            self.model.statut == statut
        ).order_by(self.model.date_paiement.desc()).all()

    def get_en_attente_validation(self, db: Session) -> list[PaiementFacture]:
        """
        Liste les paiements en attente de validation.
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des paiements en attente
        """
        return db.query(self.model).filter(
            self.model.statut == "en_attente"
        ).order_by(self.model.date_paiement.asc()).all()

    def _generer_numero_paiement(self, db: Session) -> str:
        """
        Génère un numéro de paiement unique.
        
        Format: PAY-YYYY-XXXXX
        """
        year = datetime.now().year
        prefix = f"PAY-{year}-"
        
        last_paiement = db.query(self.model).filter(
            self.model.numero_paiement.like(f"{prefix}%")
        ).order_by(self.model.numero_paiement.desc()).first()
        
        if last_paiement:
            last_num = int(last_paiement.numero_paiement.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:05d}"

    def _generer_numero_recu(self, db: Session) -> str:
        """
        Génère un numéro de reçu unique.
        
        Format: RECU-YYYY-XXXXX
        """
        year = datetime.now().year
        prefix = f"RECU-{year}-"
        
        last_paiement = db.query(self.model).filter(
            self.model.numero_recu.like(f"{prefix}%")
        ).order_by(self.model.numero_recu.desc()).first()
        
        if last_paiement:
            last_num = int(last_paiement.numero_recu.split("-")[-1])
            new_num = last_num + 1
        else:
            new_num = 1
        
        return f"{prefix}{new_num:05d}"

    def create_paiement(
        self, db: Session, paiement_create: PaiementFactureCreate, user_id: int
    ) -> PaiementFacture:
        """
        Crée un nouveau paiement.
        
        Args:
            db: Session de base de données
            paiement_create: Données du paiement à créer
            user_id: ID de l'utilisateur créateur
            
        Returns:
            Le paiement créé
        """
        numero_paiement = self._generer_numero_paiement(db)
        
        paiement = PaiementFacture(
            numero_paiement=numero_paiement,
            facture_id=paiement_create.facture_id,
            etudiant_id=paiement_create.etudiant_id,
            montant=paiement_create.montant,
            mode_paiement=paiement_create.mode_paiement,
            reference_transaction=paiement_create.reference_transaction,
            banque=paiement_create.banque,
            numero_cheque=paiement_create.numero_cheque,
            observations=paiement_create.observations,
            statut="en_attente",
            recu_par=user_id,
        )
        
        db.add(paiement)
        db.commit()
        db.refresh(paiement)
        return paiement

    def valider_paiement(self, db: Session, id: int, user_id: int) -> PaiementFacture | None:
        """
        Valide un paiement et met à jour la facture et le compte.
        
        Args:
            db: Session de base de données
            id: ID du paiement
            user_id: ID de l'utilisateur validateur
            
        Returns:
            Le paiement mis à jour ou None
        """
        paiement = self.get_by_id(db, id)
        if not paiement or paiement.statut != "en_attente":
            return None
        
        # Générer le numéro de reçu
        numero_recu = self._generer_numero_recu(db)
        
        # Mettre à jour le paiement
        paiement.statut = "valide"
        paiement.numero_recu = numero_recu
        paiement.valide_par = user_id
        paiement.date_validation = datetime.utcnow()
        paiement.date_valeur = date.today()
        paiement.updated_at = datetime.utcnow()
        
        # Récupérer et mettre à jour la facture
        facture = db.query(Facture).filter(Facture.id == paiement.facture_id).first()
        if facture:
            facture.montant_paye += paiement.montant
            facture.montant_restant = facture.montant_total - facture.montant_paye
            
            # Mettre à jour le statut de la facture
            if facture.montant_restant <= 0:
                facture.statut = "payee"
            elif facture.montant_paye > 0:
                facture.statut = "partiellement_payee"
            
            facture.updated_at = datetime.utcnow()
        
        # Récupérer ou créer le compte étudiant
        compte = db.query(CompteEtudiant).filter(
            CompteEtudiant.etudiant_id == paiement.etudiant_id,
            CompteEtudiant.annee_academique_id == facture.annee_academique_id
        ).first()
        
        if compte:
            # Créer le mouvement de compte (crédit)
            solde_avant = compte.solde_actuel
            solde_apres = solde_avant + paiement.montant
            
            mouvement = MouvementCompte(
                compte_id=compte.id,
                type_mouvement="credit",
                montant=paiement.montant,
                solde_avant=solde_avant,
                solde_apres=solde_apres,
                libelle=f"Paiement {numero_recu}",
                description=f"Paiement facture {facture.numero_facture}",
                facture_id=facture.id,
                paiement_id=paiement.id,
                effectue_par=user_id,
            )
            db.add(mouvement)
            
            # Mettre à jour le compte
            compte.solde_actuel = solde_apres
            compte.total_paye += paiement.montant
            compte.total_restant = compte.total_facture - compte.total_paye
            compte.date_derniere_operation = datetime.utcnow()
        
        # Mettre à jour les échéanciers si existent
        echeances = db.query(Echeancier).filter(
            Echeancier.facture_id == facture.id,
            Echeancier.statut == "en_attente"
        ).order_by(Echeancier.date_echeance.asc()).all()
        
        montant_restant = paiement.montant
        for echeance in echeances:
            if montant_restant <= 0:
                break
            
            montant_a_payer = min(
                montant_restant, 
                echeance.montant_echeance - echeance.montant_paye
            )
            echeance.montant_paye += montant_a_payer
            montant_restant -= montant_a_payer
            
            if echeance.montant_paye >= echeance.montant_echeance:
                echeance.statut = "payee"
            
            echeance.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(paiement)
        return paiement

    def rejeter_paiement(
        self, db: Session, id: int, user_id: int, motif: str
    ) -> PaiementFacture | None:
        """
        Rejette un paiement.
        
        Args:
            db: Session de base de données
            id: ID du paiement
            user_id: ID de l'utilisateur
            motif: Motif du rejet
            
        Returns:
            Le paiement mis à jour ou None
        """
        paiement = self.get_by_id(db, id)
        if not paiement:
            return None
        
        paiement.statut = "rejete"
        paiement.rejete_par = user_id
        paiement.date_rejet = datetime.utcnow()
        paiement.motif_rejet = motif
        paiement.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(paiement)
        return paiement

    def annuler_paiement(self, db: Session, id: int, user_id: int) -> PaiementFacture | None:
        """
        Annule un paiement validé et inverse les mises à jour.
        
        Args:
            db: Session de base de données
            id: ID du paiement
            user_id: ID de l'utilisateur
            
        Returns:
            Le paiement mis à jour ou None
        """
        paiement = self.get_by_id(db, id)
        if not paiement:
            return None
        
        # Si le paiement était validé, inverser les mises à jour
        if paiement.statut == "valide":
            facture = db.query(Facture).filter(Facture.id == paiement.facture_id).first()
            
            if facture:
                # Inverser la mise à jour de la facture
                facture.montant_paye -= paiement.montant
                facture.montant_restant = facture.montant_total - facture.montant_paye
                
                if facture.montant_paye <= 0:
                    facture.statut = "en_attente"
                elif facture.montant_restant > 0:
                    facture.statut = "partiellement_payee"
                
                facture.updated_at = datetime.utcnow()
                
                # Inverser la mise à jour du compte
                compte = db.query(CompteEtudiant).filter(
                    CompteEtudiant.etudiant_id == paiement.etudiant_id,
                    CompteEtudiant.annee_academique_id == facture.annee_academique_id
                ).first()
                
                if compte:
                    solde_avant = compte.solde_actuel
                    solde_apres = solde_avant - paiement.montant
                    
                    mouvement = MouvementCompte(
                        compte_id=compte.id,
                        type_mouvement="debit",
                        montant=paiement.montant,
                        solde_avant=solde_avant,
                        solde_apres=solde_apres,
                        libelle=f"Annulation paiement {paiement.numero_recu}",
                        description="Annulation de paiement",
                        facture_id=facture.id,
                        paiement_id=paiement.id,
                        effectue_par=user_id,
                    )
                    db.add(mouvement)
                    
                    compte.solde_actuel = solde_apres
                    compte.total_paye -= paiement.montant
                    compte.total_restant = compte.total_facture - compte.total_paye
                    compte.date_derniere_operation = datetime.utcnow()
        
        paiement.statut = "annule"
        paiement.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(paiement)
        return paiement

    def calculer_statistiques(
        self, db: Session, annee_id: int = None, mode_paiement: str = None
    ) -> dict:
        """
        Calcule les statistiques des paiements.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique (optionnel)
            mode_paiement: Mode de paiement (optionnel)
            
        Returns:
            Dictionnaire avec les statistiques
        """
        query = db.query(self.model).filter(self.model.statut == "valide")
        
        if mode_paiement:
            query = query.filter(self.model.mode_paiement == mode_paiement)
        
        if annee_id:
            query = query.join(Facture).filter(
                Facture.annee_academique_id == annee_id
            )
        
        paiements = query.all()
        
        total_paiements = len(paiements)
        montant_total = sum(p.montant for p in paiements) if paiements else Decimal("0")
        
        # Par mode de paiement
        par_mode = {}
        for p in paiements:
            if p.mode_paiement not in par_mode:
                par_mode[p.mode_paiement] = {"count": 0, "montant": Decimal("0")}
            par_mode[p.mode_paiement]["count"] += 1
            par_mode[p.mode_paiement]["montant"] += p.montant
        
        # Convertir en float
        for mode in par_mode:
            par_mode[mode]["montant"] = float(par_mode[mode]["montant"])
        
        # Par mois
        par_mois = {}
        for p in paiements:
            mois_key = p.date_paiement.strftime("%Y-%m")
            if mois_key not in par_mois:
                par_mois[mois_key] = {"count": 0, "montant": Decimal("0")}
            par_mois[mois_key]["count"] += 1
            par_mois[mois_key]["montant"] += p.montant
        
        for mois in par_mois:
            par_mois[mois]["montant"] = float(par_mois[mois]["montant"])
        
        return {
            "total_paiements": total_paiements,
            "montant_total": float(montant_total),
            "par_mode_paiement": par_mode,
            "par_mois": par_mois,
        }


# Instance singleton du repository
paiement_facture_repository = PaiementFactureRepository()
