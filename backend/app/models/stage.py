"""
Modèle Stage pour la gestion des stages étudiants.
Conforme au système CAMES avec intégration dans le système d'évaluation.
"""

from datetime import datetime, date
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, Date, Boolean, DateTime,
    Numeric, ForeignKey
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Stage(Base):
    """
    Représente un stage étudiant.
    
    Le stage est traité comme une matière dans le système d'évaluation,
    avec des notes provenant de l'entreprise, du rapport et de la soutenance.
    """
    
    __tablename__ = "stages"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    
    # Références académiques
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False, index=True)
    matiere_id = Column(Integer, ForeignKey("matiere.id"), nullable=False)  # Stage vu comme matière
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False, index=True)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False, index=True)
    
    # Type et durée
    type_stage = Column(String(50), nullable=False)  # observation, pratique, professionnel, recherche
    duree_semaines = Column(Integer, nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    
    # Informations entreprise
    entreprise_nom = Column(String(255), nullable=False)
    entreprise_adresse = Column(String(500), nullable=True)
    entreprise_telephone = Column(String(50), nullable=True)
    entreprise_email = Column(String(255), nullable=True)
    
    # Maître de stage (entreprise)
    maitre_stage_nom = Column(String(255), nullable=False)
    maitre_stage_fonction = Column(String(255), nullable=True)
    maitre_stage_email = Column(String(255), nullable=True)
    
    # Encadrant académique
    encadrant_academique_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Thème et objectifs
    theme = Column(Text, nullable=False)
    objectifs = Column(Text, nullable=True)
    
    # Statut
    statut = Column(String(50), nullable=False, default="en_cours")  # en_cours, termine, valide, invalide
    
    # Rapport
    rapport_url = Column(String(500), nullable=True)
    date_depot_rapport = Column(Date, nullable=True)
    
    # Notes
    note_entreprise = Column(Numeric(5, 2), nullable=True)  # Note du maître de stage
    note_rapport = Column(Numeric(5, 2), nullable=True)  # Note du rapport écrit
    note_soutenance = Column(Numeric(5, 2), nullable=True)  # Note de soutenance
    note_finale = Column(Numeric(5, 2), nullable=True)  # Note finale calculée
    
    # Observations
    observations = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant = relationship("Etudiant", back_populates="stages")
    matiere = relationship("Matiere")
    niveau = relationship("Niveau")
    annee_academique = relationship("AnneeAcademique")
    encadrant = relationship("User", foreign_keys=[encadrant_academique_id])
    soutenance = relationship("Soutenance", back_populates="stage", uselist=False)

    def __repr__(self):
        return f"<Stage {self.code}: {self.theme[:50]}...>"
    
    @property
    def est_termine(self) -> bool:
        """Retourne True si le stage est terminé."""
        return self.statut in ["termine", "valide", "invalide"]
    
    @property
    def est_valide(self) -> bool:
        """Retourne True si le stage est validé."""
        return self.statut == "valide"
    
    @property
    def peut_programmer_soutenance(self) -> bool:
        """Retourne True si une soutenance peut être programmée."""
        return (
            self.statut == "termine" and 
            self.rapport_url is not None and
            self.soutenance is None
        )
    
    def calculer_note_finale(
        self,
        coef_entreprise: Decimal = Decimal("0.3"),
        coef_rapport: Decimal = Decimal("0.3"),
        coef_soutenance: Decimal = Decimal("0.4")
    ) -> Decimal | None:
        """
        Calcule la note finale du stage.
        
        Args:
            coef_entreprise: Coefficient de la note entreprise (défaut: 30%)
            coef_rapport: Coefficient de la note rapport (défaut: 30%)
            coef_soutenance: Coefficient de la note soutenance (défaut: 40%)
            
        Returns:
            Note finale ou None si toutes les notes ne sont pas disponibles
        """
        if self.note_entreprise is None or self.note_rapport is None or self.note_soutenance is None:
            return None
        
        note = (
            self.note_entreprise * coef_entreprise +
            self.note_rapport * coef_rapport +
            self.note_soutenance * coef_soutenance
        )
        self.note_finale = round(note, 2)
        return self.note_finale
    
    def terminer(self) -> None:
        """Marque le stage comme terminé."""
        self.statut = "termine"
    
    def valider(self) -> None:
        """Valide le stage."""
        self.statut = "valide"
    
    def invalider(self) -> None:
        """Invalide le stage."""
        self.statut = "invalide"
