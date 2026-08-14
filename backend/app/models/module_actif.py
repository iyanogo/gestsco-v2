"""
Modèle ModuleActif pour l'activation des modules par université et année académique.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, Boolean, DateTime, JSON,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ModuleActif(Base):
    """
    Représente l'activation d'un module pour une université et/ou année académique.
    
    - Si universite_id est NULL : activation pour toutes les universités
    - Si annee_academique_id est NULL : activation pour toutes les années
    """
    
    __tablename__ = "modules_actifs"
    __table_args__ = (
        UniqueConstraint(
            'module_id', 'universite_id', 'annee_academique_id',
            name='uq_module_actif_unique'
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Références
    module_id = Column(Integer, ForeignKey("modules_systeme.id"), nullable=False, index=True)
    universite_id = Column(Integer, ForeignKey("universite.id"), nullable=True, index=True)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=True, index=True)
    
    # État
    est_actif = Column(Boolean, default=True)
    
    # Dates d'activation/désactivation
    date_activation = Column(DateTime, nullable=True)
    date_desactivation = Column(DateTime, nullable=True)
    
    # Utilisateurs ayant effectué les actions
    active_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    desactive_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Configuration spécifique au module pour ce contexte
    configuration = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    module = relationship("ModuleSysteme", back_populates="activations")
    universite = relationship("Universite")
    annee_academique = relationship("AnneeAcademique", back_populates="modules_actifs")
    utilisateur_activation = relationship("User", foreign_keys=[active_par])
    utilisateur_desactivation = relationship("User", foreign_keys=[desactive_par])

    def __repr__(self):
        return f"<ModuleActif module={self.module_id} univ={self.universite_id} annee={self.annee_academique_id}>"
    
    def activer(self, user_id: int) -> None:
        """Active le module."""
        self.est_actif = True
        self.date_activation = datetime.utcnow()
        self.active_par = user_id
        self.date_desactivation = None
        self.desactive_par = None
    
    def desactiver(self, user_id: int) -> None:
        """Désactive le module."""
        self.est_actif = False
        self.date_desactivation = datetime.utcnow()
        self.desactive_par = user_id
