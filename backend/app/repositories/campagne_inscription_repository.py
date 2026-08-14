"""
Repository pour la gestion des campagnes d'inscription
"""

from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.campagne_inscription import CampagneInscription
from app.models.dossier_candidature import DossierCandidature
from app.schemas.campagne_inscription import CampagneInscriptionCreate, CampagneInscriptionUpdate
from app.repositories.base_repository import BaseRepository


class CampagneInscriptionRepository(BaseRepository[CampagneInscription, CampagneInscriptionCreate, CampagneInscriptionUpdate]):
    """Repository pour les opérations sur les campagnes d'inscription."""

    def __init__(self):
        super().__init__(CampagneInscription)

    def get_by_annee(self, db: Session, annee_id: int) -> list[CampagneInscription]:
        """
        Liste les campagnes d'une année académique.
        
        Args:
            db: Session de base de données
            annee_id: ID de l'année académique
            
        Returns:
            Liste des campagnes de l'année
        """
        return db.query(self.model).filter(
            self.model.annee_academique_id == annee_id,
            self.model.is_active == True
        ).all()

    def get_by_cycle(self, db: Session, cycle_id: int) -> list[CampagneInscription]:
        """
        Liste les campagnes d'un cycle.
        
        Args:
            db: Session de base de données
            cycle_id: ID du cycle
            
        Returns:
            Liste des campagnes du cycle
        """
        return db.query(self.model).filter(
            self.model.cycle_id == cycle_id,
            self.model.is_active == True
        ).all()

    def get_ouvertes(self, db: Session) -> list[CampagneInscription]:
        """
        Liste les campagnes ouvertes (statut=ouverte et dates valides).
        
        Args:
            db: Session de base de données
            
        Returns:
            Liste des campagnes ouvertes
        """
        now = datetime.utcnow()
        return db.query(self.model).filter(
            self.model.statut == "ouverte",
            self.model.is_active == True,
            self.model.date_ouverture <= now,
            self.model.date_cloture >= now
        ).all()

    def ouvrir_campagne(self, db: Session, id: int) -> CampagneInscription | None:
        """
        Ouvre une campagne (change le statut en "ouverte").
        
        Args:
            db: Session de base de données
            id: ID de la campagne
            
        Returns:
            La campagne mise à jour ou None si non trouvée
        """
        campagne = self.get_by_id(db, id)
        if not campagne:
            return None

        campagne.statut = "ouverte"
        campagne.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(campagne)
        return campagne

    def cloturer_campagne(self, db: Session, id: int) -> CampagneInscription | None:
        """
        Clôture une campagne (change le statut en "cloturee").
        
        Args:
            db: Session de base de données
            id: ID de la campagne
            
        Returns:
            La campagne mise à jour ou None si non trouvée
        """
        campagne = self.get_by_id(db, id)
        if not campagne:
            return None

        campagne.statut = "cloturee"
        campagne.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(campagne)
        return campagne

    def get_statistiques(self, db: Session, id: int) -> dict:
        """
        Retourne les statistiques d'une campagne.
        
        Args:
            db: Session de base de données
            id: ID de la campagne
            
        Returns:
            Dictionnaire avec total_dossiers, dossiers_complets, dossiers_valides, admis, refuses
        """
        total = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id
        ).scalar() or 0

        complets = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id,
            DossierCandidature.statut_dossier == "complet"
        ).scalar() or 0

        valides = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id,
            DossierCandidature.statut_dossier == "valide"
        ).scalar() or 0

        admis = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id,
            DossierCandidature.statut_dossier == "admis"
        ).scalar() or 0

        refuses = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id,
            DossierCandidature.statut_dossier == "refuse"
        ).scalar() or 0

        return {
            "total_dossiers": total,
            "dossiers_complets": complets,
            "dossiers_valides": valides,
            "admis": admis,
            "refuses": refuses
        }

    def get_places_restantes(self, db: Session, id: int) -> int | None:
        """
        Calcule le nombre de places restantes pour une campagne.
        
        Args:
            db: Session de base de données
            id: ID de la campagne
            
        Returns:
            Nombre de places restantes ou None si pas de quota
        """
        campagne = self.get_by_id(db, id)
        if not campagne or campagne.nombre_places is None:
            return None

        admis = db.query(func.count(DossierCandidature.id)).filter(
            DossierCandidature.campagne_id == id,
            DossierCandidature.statut_dossier == "admis"
        ).scalar() or 0

        return max(0, campagne.nombre_places - admis)


# Instance singleton du repository
campagne_inscription_repository = CampagneInscriptionRepository()
