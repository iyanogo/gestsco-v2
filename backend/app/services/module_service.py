"""
Service de gestion des modules système.
Permet d'activer/désactiver des modules par université et année académique.
"""

from datetime import datetime
from typing import Optional, List
import logging

from sqlalchemy.orm import Session

from app.models.module_systeme import ModuleSysteme
from app.models.module_actif import ModuleActif
from app.models.user import User

logger = logging.getLogger(__name__)


class ModuleServiceError(Exception):
    """Exception pour les erreurs du service module."""
    pass


class ModuleService:
    """
    Service pour la gestion des modules système.
    
    Fonctionnalités :
    - Activation/désactivation de modules
    - Vérification des dépendances
    - Vérification des accès
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def activer_module(
        self,
        module_code: str,
        universite_id: Optional[int],
        annee_id: Optional[int],
        user_id: int,
        config: Optional[dict] = None
    ) -> ModuleActif:
        """
        Active un module pour une université et/ou année académique.
        
        Args:
            module_code: Code du module à activer
            universite_id: ID de l'université (None = toutes)
            annee_id: ID de l'année académique (None = toutes)
            user_id: ID de l'utilisateur effectuant l'action
            config: Configuration spécifique au module
            
        Returns:
            Le ModuleActif créé ou mis à jour
            
        Raises:
            ModuleServiceError: Si une erreur survient
        """
        # Récupérer le module système
        module = self.db.query(ModuleSysteme).filter(
            ModuleSysteme.code == module_code,
            ModuleSysteme.is_active == True
        ).first()
        
        if not module:
            raise ModuleServiceError(f"Module {module_code} non trouvé ou inactif.")
        
        # Vérifier les dépendances
        if not self._verifier_dependances(module, universite_id, annee_id):
            raise ModuleServiceError(
                f"Les dépendances du module {module_code} ne sont pas satisfaites. "
                f"Dépendances requises: {module.dependances}"
            )
        
        # Chercher une activation existante
        module_actif = self.db.query(ModuleActif).filter(
            ModuleActif.module_id == module.id,
            ModuleActif.universite_id == universite_id,
            ModuleActif.annee_academique_id == annee_id
        ).first()
        
        if module_actif:
            # Mettre à jour l'activation existante
            module_actif.activer(user_id)
            if config:
                module_actif.configuration = config
        else:
            # Créer une nouvelle activation
            module_actif = ModuleActif(
                module_id=module.id,
                universite_id=universite_id,
                annee_academique_id=annee_id,
                est_actif=True,
                date_activation=datetime.utcnow(),
                active_par=user_id,
                configuration=config
            )
            self.db.add(module_actif)
        
        self.db.commit()
        logger.info(
            f"Module {module_code} activé pour universite={universite_id}, "
            f"annee={annee_id} par utilisateur {user_id}"
        )
        
        return module_actif
    
    def desactiver_module(
        self,
        module_code: str,
        universite_id: Optional[int],
        annee_id: Optional[int],
        user_id: int
    ) -> ModuleActif:
        """
        Désactive un module.
        
        Args:
            module_code: Code du module à désactiver
            universite_id: ID de l'université
            annee_id: ID de l'année académique
            user_id: ID de l'utilisateur
            
        Returns:
            Le ModuleActif désactivé
            
        Raises:
            ModuleServiceError: Si une erreur survient
        """
        # Récupérer le module système
        module = self.db.query(ModuleSysteme).filter(
            ModuleSysteme.code == module_code
        ).first()
        
        if not module:
            raise ModuleServiceError(f"Module {module_code} non trouvé.")
        
        # Vérifier que le module n'est pas obligatoire
        if module.est_obligatoire:
            raise ModuleServiceError(
                f"Le module {module_code} est obligatoire et ne peut pas être désactivé."
            )
        
        # Vérifier qu'aucun module actif ne dépend de celui-ci
        dependants = self._get_modules_dependants(module_code, universite_id, annee_id)
        if dependants:
            raise ModuleServiceError(
                f"Impossible de désactiver {module_code}. "
                f"Les modules suivants en dépendent: {[m.code for m in dependants]}"
            )
        
        # Récupérer l'activation
        module_actif = self.db.query(ModuleActif).filter(
            ModuleActif.module_id == module.id,
            ModuleActif.universite_id == universite_id,
            ModuleActif.annee_academique_id == annee_id
        ).first()
        
        if not module_actif:
            raise ModuleServiceError(
                f"Module {module_code} non activé pour ce contexte."
            )
        
        module_actif.desactiver(user_id)
        self.db.commit()
        
        logger.info(
            f"Module {module_code} désactivé pour universite={universite_id}, "
            f"annee={annee_id} par utilisateur {user_id}"
        )
        
        return module_actif
    
    def get_modules_actifs(
        self,
        universite_id: Optional[int],
        annee_id: Optional[int]
    ) -> List[ModuleSysteme]:
        """
        Récupère la liste des modules actifs pour un contexte donné.
        
        Args:
            universite_id: ID de l'université
            annee_id: ID de l'année académique
            
        Returns:
            Liste des modules système actifs
        """
        # Récupérer les IDs des modules actifs
        query = self.db.query(ModuleActif.module_id).filter(
            ModuleActif.est_actif == True
        )
        
        # Filtrer par contexte (inclure les activations globales)
        if universite_id is not None:
            query = query.filter(
                (ModuleActif.universite_id == universite_id) |
                (ModuleActif.universite_id == None)
            )
        
        if annee_id is not None:
            query = query.filter(
                (ModuleActif.annee_academique_id == annee_id) |
                (ModuleActif.annee_academique_id == None)
            )
        
        module_ids = [r[0] for r in query.all()]
        
        # Récupérer les modules
        modules = self.db.query(ModuleSysteme).filter(
            ModuleSysteme.id.in_(module_ids),
            ModuleSysteme.is_active == True
        ).order_by(ModuleSysteme.ordre).all()
        
        return modules
    
    def verifier_acces_module(
        self,
        module_code: str,
        user: User,
        universite_id: Optional[int],
        annee_id: Optional[int]
    ) -> bool:
        """
        Vérifie si un utilisateur a accès à un module.
        
        Args:
            module_code: Code du module
            user: Utilisateur à vérifier
            universite_id: ID de l'université
            annee_id: ID de l'année académique
            
        Returns:
            True si l'utilisateur a accès
        """
        # Récupérer le module
        module = self.db.query(ModuleSysteme).filter(
            ModuleSysteme.code == module_code,
            ModuleSysteme.is_active == True
        ).first()
        
        if not module:
            return False
        
        # Vérifier que le module est actif pour ce contexte
        modules_actifs = self.get_modules_actifs(universite_id, annee_id)
        if module not in modules_actifs:
            return False
        
        # Vérifier les permissions
        if module.permissions_requises:
            user_role = getattr(user, 'role', None)
            if user_role not in module.permissions_requises:
                return False
        
        return True
    
    def get_tous_modules(self) -> List[ModuleSysteme]:
        """
        Récupère tous les modules système.
        
        Returns:
            Liste de tous les modules
        """
        return self.db.query(ModuleSysteme).filter(
            ModuleSysteme.is_active == True
        ).order_by(ModuleSysteme.ordre).all()
    
    # Méthodes privées
    
    def _verifier_dependances(
        self,
        module: ModuleSysteme,
        universite_id: Optional[int],
        annee_id: Optional[int]
    ) -> bool:
        """Vérifie que toutes les dépendances d'un module sont satisfaites."""
        if not module.dependances:
            return True
        
        modules_actifs = self.get_modules_actifs(universite_id, annee_id)
        codes_actifs = [m.code for m in modules_actifs]
        
        return all(dep in codes_actifs for dep in module.dependances)
    
    def _get_modules_dependants(
        self,
        module_code: str,
        universite_id: Optional[int],
        annee_id: Optional[int]
    ) -> List[ModuleSysteme]:
        """Récupère les modules actifs qui dépendent d'un module donné."""
        modules_actifs = self.get_modules_actifs(universite_id, annee_id)
        
        dependants = []
        for module in modules_actifs:
            if module.dependances and module_code in module.dependances:
                dependants.append(module)
        
        return dependants
