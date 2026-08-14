"""
Modèle PeriodeComptable pour la gestion des périodes comptables par année académique.
"""

from datetime import datetime, date
from sqlalchemy import (
    Column, Integer, String, Date, Boolean, DateTime,
    ForeignKey
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class PeriodeComptable(Base):
    """
    Représente une période comptable liée à une année académique.
    
    Permet de gérer les opérations financières par période
    et de clôturer les comptes à la fin de chaque période.
    """
    
    __tablename__ = "periodes_comptables"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    
    # Référence à l'année académique
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False, index=True)
    
    # Dates de la période
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    
    # Statut
    statut = Column(String(50), nullable=False, default="ouverte")  # ouverte, cloturee
    est_periode_courante = Column(Boolean, default=False)
    
    # Clôture
    date_cloture = Column(DateTime, nullable=True)
    cloturee_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    annee_academique = relationship("AnneeAcademique", back_populates="periodes_comptables")
    utilisateur_cloture = relationship("User", foreign_keys=[cloturee_par])

    def __repr__(self):
        return f"<PeriodeComptable {self.code}: {self.libelle}>"
    
    @property
    def est_ouverte(self) -> bool:
        """Retourne True si la période est ouverte."""
        return self.statut == "ouverte"
    
    @property
    def est_cloturee(self) -> bool:
        """Retourne True si la période est clôturée."""
        return self.statut == "cloturee"
    
    def cloturer(self, user_id: int) -> None:
        """Clôture la période comptable."""
        self.statut = "cloturee"
        self.date_cloture = datetime.utcnow()
        self.cloturee_par = user_id
        self.est_periode_courante = False
    
    def definir_comme_courante(self) -> None:
        """Définit cette période comme la période courante."""
        self.est_periode_courante = True
    
    def contient_date(self, d: date) -> bool:
        """Vérifie si une date est dans la période."""
        return self.date_debut <= d <= self.date_fin
