"""
Modèle ModuleSysteme pour la gestion des modules applicatifs.
Permet d'activer/désactiver des fonctionnalités par université et année académique.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime, JSON
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ModuleSysteme(Base):
    """
    Représente un module fonctionnel du système.
    
    Modules disponibles :
    - REFERENTIEL : Gestion du référentiel (obligatoire)
    - ETUDIANTS : Gestion des étudiants (obligatoire)
    - INSCRIPTIONS : Gestion des inscriptions (obligatoire)
    - EVALUATIONS : Gestion des évaluations (obligatoire)
    - EMPLOI_TEMPS : Gestion des emplois du temps
    - FINANCES : Gestion financière
    - STAGES : Gestion des stages et soutenances
    - BIBLIOTHEQUE : Gestion de la bibliothèque
    - COMMUNICATION : Communication et notifications
    """
    
    __tablename__ = "modules_systeme"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Affichage
    icone = Column(String(50), nullable=True)  # Nom icône Bootstrap (bi-*)
    ordre = Column(Integer, nullable=False, default=0)
    
    # Configuration
    est_obligatoire = Column(Boolean, default=False)  # Ne peut pas être désactivé
    permissions_requises = Column(JSON, nullable=True)  # Liste des rôles autorisés
    dependances = Column(JSON, nullable=True)  # Liste des codes de modules requis
    
    # Statut
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    activations = relationship("ModuleActif", back_populates="module")

    def __repr__(self):
        return f"<ModuleSysteme {self.code}: {self.libelle}>"
    
    def verifier_dependances(self, modules_actifs: list) -> bool:
        """
        Vérifie si toutes les dépendances sont satisfaites.
        
        Args:
            modules_actifs: Liste des codes de modules actuellement actifs
            
        Returns:
            True si toutes les dépendances sont satisfaites
        """
        if not self.dependances:
            return True
        return all(dep in modules_actifs for dep in self.dependances)
    
    def verifier_permission(self, role: str) -> bool:
        """
        Vérifie si un rôle a accès au module.
        
        Args:
            role: Code du rôle à vérifier
            
        Returns:
            True si le rôle a accès
        """
        if not self.permissions_requises:
            return True
        return role in self.permissions_requises
