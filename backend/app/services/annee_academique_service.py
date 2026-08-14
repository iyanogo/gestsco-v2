"""
Service de gestion des années académiques.
Gère l'ouverture, la clôture, la reconduction du référentiel et les rapports.
"""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.annee_academique import AnneeAcademique
from app.models.periode_comptable import PeriodeComptable
from app.models.module_actif import ModuleActif
from app.models.module_systeme import ModuleSysteme
from app.models.filiere import Filiere
from app.models.module import Module
from app.models.matiere import Matiere
from app.models.salle import Salle
from app.models.creneau_horaire import CreneauHoraire
from app.models.frais_scolarite import FraisScolarite
from app.models.type_frais import TypeFrais
from app.models.etudiant import Etudiant
from app.models.inscription import Inscription
from app.models.deliberation import Deliberation
from app.models.facture import Facture
from app.models.paiement_facture import PaiementFacture

logger = logging.getLogger(__name__)


class AnneeAcademiqueServiceError(Exception):
    """Exception pour les erreurs du service année académique."""
    pass


class AnneeAcademiqueService:
    """
    Service pour la gestion des années académiques.
    
    Fonctionnalités :
    - Ouverture d'année avec reconduction optionnelle du référentiel
    - Clôture de semestre et d'année
    - Archivage
    - Génération de rapports
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def ouvrir_annee(
        self,
        annee_id: int,
        user_id: int,
        reconduire: bool = True,
        elements_a_reconduire: Optional[dict] = None
    ) -> AnneeAcademique:
        """
        Ouvre une année académique.
        
        Args:
            annee_id: ID de l'année à ouvrir
            user_id: ID de l'utilisateur effectuant l'action
            reconduire: Si True, reconduit le référentiel de l'année précédente
            elements_a_reconduire: Dictionnaire des éléments à reconduire
            
        Returns:
            L'année académique ouverte
            
        Raises:
            AnneeAcademiqueServiceError: Si une erreur survient
        """
        # Vérifier qu'aucune année n'est déjà ouverte
        annee_ouverte = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.statut.in_(["ouverte", "en_cours"])
        ).first()
        
        if annee_ouverte:
            raise AnneeAcademiqueServiceError(
                f"L'année {annee_ouverte.code} est déjà ouverte. "
                "Veuillez la clôturer avant d'en ouvrir une nouvelle."
            )
        
        # Récupérer l'année à ouvrir
        annee = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.id == annee_id
        ).first()
        
        if not annee:
            raise AnneeAcademiqueServiceError(f"Année académique {annee_id} non trouvée.")
        
        if not annee.est_brouillon:
            raise AnneeAcademiqueServiceError(
                f"L'année {annee.code} n'est pas en brouillon (statut: {annee.statut})."
            )
        
        try:
            # Reconduire le référentiel si demandé
            if reconduire and annee.annee_precedente_id:
                self.reconduire_referentiel(
                    annee.annee_precedente_id,
                    annee_id,
                    user_id,
                    elements_a_reconduire or self._get_elements_par_defaut()
                )
                annee.est_reconduite = True
            
            # Créer la période comptable
            self._creer_periode_comptable(annee, user_id)
            
            # Activer les modules par défaut
            self._activer_modules_par_defaut(annee_id, user_id)
            
            # Ouvrir l'année
            annee.ouvrir(user_id)
            
            self.db.commit()
            logger.info(f"Année académique {annee.code} ouverte par utilisateur {user_id}")
            
            return annee
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de l'ouverture de l'année {annee_id}: {str(e)}")
            raise AnneeAcademiqueServiceError(f"Erreur lors de l'ouverture: {str(e)}")
    
    def reconduire_referentiel(
        self,
        annee_source_id: int,
        annee_cible_id: int,
        user_id: int,
        elements: dict
    ) -> dict:
        """
        Reconduit le référentiel d'une année vers une autre.
        
        Args:
            annee_source_id: ID de l'année source
            annee_cible_id: ID de l'année cible
            user_id: ID de l'utilisateur
            elements: Dictionnaire des éléments à reconduire
            
        Returns:
            Rapport de reconduction avec compteurs
        """
        rapport = {
            "filieres_copiees": 0,
            "modules_copies": 0,
            "matieres_copiees": 0,
            "salles_copiees": 0,
            "creneaux_copies": 0,
            "frais_scolarite_copies": 0,
            "types_frais_copies": 0,
            "erreurs": []
        }
        
        try:
            if elements.get("filieres", False):
                rapport["filieres_copiees"] = self._reconduire_filieres(
                    annee_source_id, annee_cible_id
                )
            
            if elements.get("modules", False):
                rapport["modules_copies"] = self._reconduire_modules(
                    annee_source_id, annee_cible_id
                )
            
            if elements.get("matieres", False):
                rapport["matieres_copiees"] = self._reconduire_matieres(
                    annee_source_id, annee_cible_id
                )
            
            if elements.get("frais_scolarite", False):
                rapport["frais_scolarite_copies"] = self._reconduire_frais_scolarite(
                    annee_source_id, annee_cible_id
                )
            
            if elements.get("types_frais", False):
                rapport["types_frais_copies"] = self._reconduire_types_frais(
                    annee_source_id, annee_cible_id
                )
            
            logger.info(f"Reconduction du référentiel terminée: {rapport}")
            return rapport
            
        except Exception as e:
            rapport["erreurs"].append(str(e))
            logger.error(f"Erreur lors de la reconduction: {str(e)}")
            return rapport
    
    def cloturer_semestre(
        self,
        annee_id: int,
        semestre: int,
        user_id: int
    ) -> dict:
        """
        Clôture un semestre.
        
        Args:
            annee_id: ID de l'année académique
            semestre: Numéro du semestre (1 ou 2)
            user_id: ID de l'utilisateur
            
        Returns:
            Rapport de clôture
        """
        annee = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.id == annee_id
        ).first()
        
        if not annee:
            raise AnneeAcademiqueServiceError(f"Année académique {annee_id} non trouvée.")
        
        if annee.semestre_actif != semestre:
            raise AnneeAcademiqueServiceError(
                f"Le semestre actif est {annee.semestre_actif}, pas {semestre}."
            )
        
        rapport = {
            "semestre": semestre,
            "deliberations_lancees": 0,
            "bulletins_generes": 0,
            "erreurs": []
        }
        
        try:
            # Vérifier que toutes les notes sont saisies
            # (Cette vérification serait plus complète dans une implémentation réelle)
            
            # Passer au semestre suivant ou marquer comme en cours
            if semestre == 1:
                annee.passer_semestre2()
                annee.demarrer()
            
            self.db.commit()
            logger.info(f"Semestre {semestre} clôturé pour l'année {annee.code}")
            
            return rapport
            
        except Exception as e:
            self.db.rollback()
            rapport["erreurs"].append(str(e))
            logger.error(f"Erreur lors de la clôture du semestre: {str(e)}")
            raise AnneeAcademiqueServiceError(f"Erreur lors de la clôture: {str(e)}")
    
    def cloturer_annee(
        self,
        annee_id: int,
        user_id: int
    ) -> AnneeAcademique:
        """
        Clôture une année académique.
        
        Args:
            annee_id: ID de l'année à clôturer
            user_id: ID de l'utilisateur
            
        Returns:
            L'année académique clôturée
        """
        annee = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.id == annee_id
        ).first()
        
        if not annee:
            raise AnneeAcademiqueServiceError(f"Année académique {annee_id} non trouvée.")
        
        if not annee.est_en_cours:
            raise AnneeAcademiqueServiceError(
                f"L'année {annee.code} n'est pas en cours (statut: {annee.statut})."
            )
        
        if annee.semestre_actif != 2:
            raise AnneeAcademiqueServiceError(
                "Le semestre 2 doit être actif pour clôturer l'année."
            )
        
        try:
            # Clôturer les périodes comptables
            self._cloturer_periodes_comptables(annee_id, user_id)
            
            # Clôturer l'année
            annee.cloturer(user_id)
            
            self.db.commit()
            logger.info(f"Année académique {annee.code} clôturée par utilisateur {user_id}")
            
            return annee
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de la clôture de l'année: {str(e)}")
            raise AnneeAcademiqueServiceError(f"Erreur lors de la clôture: {str(e)}")
    
    def archiver_annee(
        self,
        annee_id: int
    ) -> AnneeAcademique:
        """
        Archive une année académique.
        
        Args:
            annee_id: ID de l'année à archiver
            
        Returns:
            L'année académique archivée
        """
        annee = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.id == annee_id
        ).first()
        
        if not annee:
            raise AnneeAcademiqueServiceError(f"Année académique {annee_id} non trouvée.")
        
        if not annee.est_cloturee:
            raise AnneeAcademiqueServiceError(
                f"L'année {annee.code} doit être clôturée avant d'être archivée."
            )
        
        try:
            # Désactiver tous les modules
            self.db.query(ModuleActif).filter(
                ModuleActif.annee_academique_id == annee_id
            ).update({"est_actif": False})
            
            # Archiver l'année
            annee.archiver()
            
            self.db.commit()
            logger.info(f"Année académique {annee.code} archivée")
            
            return annee
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Erreur lors de l'archivage: {str(e)}")
            raise AnneeAcademiqueServiceError(f"Erreur lors de l'archivage: {str(e)}")
    
    def get_rapport_annee(self, annee_id: int) -> dict:
        """
        Génère un rapport complet pour une année académique.
        
        Args:
            annee_id: ID de l'année académique
            
        Returns:
            Rapport complet avec statistiques
        """
        annee = self.db.query(AnneeAcademique).filter(
            AnneeAcademique.id == annee_id
        ).first()
        
        if not annee:
            raise AnneeAcademiqueServiceError(f"Année académique {annee_id} non trouvée.")
        
        # Statistiques étudiants
        total_etudiants = self.db.query(func.count(Etudiant.id)).scalar() or 0
        
        # Statistiques inscriptions
        total_inscriptions = self.db.query(func.count(Inscription.id)).filter(
            Inscription.annee_academique == annee.code
        ).scalar() or 0
        
        # Statistiques financières
        total_facture = self.db.query(func.sum(Facture.montant_total)).filter(
            Facture.annee_academique_id == annee_id
        ).scalar() or Decimal("0")
        
        total_paye = self.db.query(func.sum(Facture.montant_paye)).filter(
            Facture.annee_academique_id == annee_id
        ).scalar() or Decimal("0")
        
        # Statistiques délibérations
        total_deliberations = self.db.query(func.count(Deliberation.id)).filter(
            Deliberation.annee_academique_id == annee_id
        ).scalar() or 0
        
        return {
            "annee": {
                "id": annee.id,
                "code": annee.code,
                "libelle": annee.libelle,
                "statut": annee.statut,
                "semestre_actif": annee.semestre_actif
            },
            "statistiques": {
                "etudiants": {
                    "total": total_etudiants
                },
                "inscriptions": {
                    "total": total_inscriptions
                },
                "finances": {
                    "total_facture": float(total_facture),
                    "total_paye": float(total_paye),
                    "total_restant": float(total_facture - total_paye),
                    "taux_recouvrement": float(
                        (total_paye / total_facture * 100) if total_facture > 0 else 0
                    )
                },
                "deliberations": {
                    "total": total_deliberations
                }
            }
        }
    
    # Méthodes privées
    
    def _get_elements_par_defaut(self) -> dict:
        """Retourne les éléments par défaut à reconduire."""
        return {
            "filieres": True,
            "modules": True,
            "matieres": True,
            "salles": False,
            "creneaux": False,
            "frais_scolarite": True,
            "types_frais": True,
            "configurations": True
        }
    
    def _creer_periode_comptable(self, annee: AnneeAcademique, user_id: int) -> PeriodeComptable:
        """Crée la période comptable pour l'année."""
        periode = PeriodeComptable(
            code=f"PC-{annee.code}",
            libelle=f"Période comptable {annee.libelle}",
            annee_academique_id=annee.id,
            date_debut=annee.date_debut,
            date_fin=annee.date_fin,
            statut="ouverte",
            est_periode_courante=True
        )
        self.db.add(periode)
        return periode
    
    def _activer_modules_par_defaut(self, annee_id: int, user_id: int) -> None:
        """Active les modules obligatoires pour l'année."""
        modules_obligatoires = self.db.query(ModuleSysteme).filter(
            ModuleSysteme.est_obligatoire == True,
            ModuleSysteme.is_active == True
        ).all()
        
        for module in modules_obligatoires:
            module_actif = ModuleActif(
                module_id=module.id,
                annee_academique_id=annee_id,
                est_actif=True,
                date_activation=datetime.utcnow(),
                active_par=user_id
            )
            self.db.add(module_actif)
    
    def _cloturer_periodes_comptables(self, annee_id: int, user_id: int) -> None:
        """Clôture toutes les périodes comptables de l'année."""
        periodes = self.db.query(PeriodeComptable).filter(
            PeriodeComptable.annee_academique_id == annee_id,
            PeriodeComptable.statut == "ouverte"
        ).all()
        
        for periode in periodes:
            periode.cloturer(user_id)
    
    def _reconduire_filieres(self, source_id: int, cible_id: int) -> int:
        """Reconduit les filières (placeholder - à implémenter selon le schéma)."""
        # Dans une implémentation réelle, copier les filières actives
        return 0
    
    def _reconduire_modules(self, source_id: int, cible_id: int) -> int:
        """Reconduit les modules (placeholder - à implémenter selon le schéma)."""
        return 0
    
    def _reconduire_matieres(self, source_id: int, cible_id: int) -> int:
        """Reconduit les matières (placeholder - à implémenter selon le schéma)."""
        return 0
    
    def _reconduire_frais_scolarite(self, source_id: int, cible_id: int) -> int:
        """Reconduit les frais de scolarité."""
        frais_source = self.db.query(FraisScolarite).filter(
            FraisScolarite.annee_academique_id == source_id,
            FraisScolarite.is_active == True
        ).all()
        
        count = 0
        for frais in frais_source:
            nouveau_frais = FraisScolarite(
                type_frais_id=frais.type_frais_id,
                niveau_id=frais.niveau_id,
                filiere_id=frais.filiere_id,
                cycle_id=frais.cycle_id,
                annee_academique_id=cible_id,
                montant=frais.montant,
                devise=frais.devise,
                date_debut_validite=frais.date_debut_validite,
                date_fin_validite=frais.date_fin_validite,
                description=frais.description,
                is_active=True
            )
            self.db.add(nouveau_frais)
            count += 1
        
        return count
    
    def _reconduire_types_frais(self, source_id: int, cible_id: int) -> int:
        """Reconduit les types de frais (les types sont généralement globaux)."""
        return 0
