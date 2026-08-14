"""
Modèle Soutenance pour la gestion des soutenances de stage.
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    Numeric, ForeignKey
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Soutenance(Base):
    """
    Représente une soutenance de stage.
    
    La soutenance est évaluée par un jury composé d'un président,
    d'un rapporteur et éventuellement d'un examinateur.
    """
    
    __tablename__ = "soutenances"

    id = Column(Integer, primary_key=True, index=True)
    
    # Référence au stage (relation 1-1)
    stage_id = Column(Integer, ForeignKey("stages.id"), unique=True, nullable=False, index=True)
    
    # Date et lieu
    date_soutenance = Column(DateTime, nullable=False)
    lieu = Column(String(255), nullable=False)
    salle_id = Column(Integer, ForeignKey("salles.id"), nullable=True)
    duree_minutes = Column(Integer, nullable=False, default=30)
    
    # Composition du jury
    president_jury_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rapporteur_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    examinateur_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Notes du jury
    note_presentation = Column(Numeric(5, 2), nullable=True)  # Qualité de la présentation
    note_defense = Column(Numeric(5, 2), nullable=True)  # Qualité de la défense
    note_jury = Column(Numeric(5, 2), nullable=True)  # Note globale du jury
    note_finale = Column(Numeric(5, 2), nullable=True)  # Note finale calculée
    
    # Appréciation et mention
    appreciation = Column(String(50), nullable=True)  # excellent, tres_bien, bien, assez_bien, passable, insuffisant
    mention = Column(String(50), nullable=True)
    
    # Observations
    observations_jury = Column(Text, nullable=True)
    
    # Statut
    statut = Column(String(50), nullable=False, default="programmee")  # programmee, en_cours, terminee, validee
    
    # Procès-verbal
    proces_verbal_url = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    stage = relationship("Stage", back_populates="soutenance")
    salle = relationship("Salle")
    president_jury = relationship("User", foreign_keys=[president_jury_id])
    rapporteur = relationship("User", foreign_keys=[rapporteur_id])
    examinateur = relationship("User", foreign_keys=[examinateur_id])

    def __repr__(self):
        return f"<Soutenance stage={self.stage_id} date={self.date_soutenance}>"
    
    @property
    def est_programmee(self) -> bool:
        """Retourne True si la soutenance est programmée."""
        return self.statut == "programmee"
    
    @property
    def est_terminee(self) -> bool:
        """Retourne True si la soutenance est terminée."""
        return self.statut in ["terminee", "validee"]
    
    @property
    def est_validee(self) -> bool:
        """Retourne True si la soutenance est validée."""
        return self.statut == "validee"
    
    def calculer_note_finale(
        self,
        coef_presentation: Decimal = Decimal("0.3"),
        coef_defense: Decimal = Decimal("0.4"),
        coef_jury: Decimal = Decimal("0.3")
    ) -> Decimal | None:
        """
        Calcule la note finale de la soutenance.
        
        Args:
            coef_presentation: Coefficient de la note de présentation (défaut: 30%)
            coef_defense: Coefficient de la note de défense (défaut: 40%)
            coef_jury: Coefficient de la note du jury (défaut: 30%)
            
        Returns:
            Note finale ou None si toutes les notes ne sont pas disponibles
        """
        if self.note_presentation is None or self.note_defense is None or self.note_jury is None:
            return None
        
        note = (
            self.note_presentation * coef_presentation +
            self.note_defense * coef_defense +
            self.note_jury * coef_jury
        )
        self.note_finale = round(note, 2)
        return self.note_finale
    
    def determiner_appreciation(self) -> str | None:
        """
        Détermine l'appréciation en fonction de la note finale.
        
        Returns:
            Appréciation ou None si la note finale n'est pas disponible
        """
        if self.note_finale is None:
            return None
        
        note = float(self.note_finale)
        if note >= 18:
            self.appreciation = "excellent"
        elif note >= 16:
            self.appreciation = "tres_bien"
        elif note >= 14:
            self.appreciation = "bien"
        elif note >= 12:
            self.appreciation = "assez_bien"
        elif note >= 10:
            self.appreciation = "passable"
        else:
            self.appreciation = "insuffisant"
        
        return self.appreciation
    
    def determiner_mention(self) -> str | None:
        """
        Détermine la mention en fonction de la note finale.
        
        Returns:
            Mention ou None si la note finale n'est pas disponible
        """
        if self.note_finale is None:
            return None
        
        note = float(self.note_finale)
        if note >= 16:
            self.mention = "Très Bien"
        elif note >= 14:
            self.mention = "Bien"
        elif note >= 12:
            self.mention = "Assez Bien"
        elif note >= 10:
            self.mention = "Passable"
        else:
            self.mention = None
        
        return self.mention
    
    def demarrer(self) -> None:
        """Démarre la soutenance."""
        self.statut = "en_cours"
    
    def terminer(self) -> None:
        """Termine la soutenance."""
        self.statut = "terminee"
    
    def valider(self) -> None:
        """Valide la soutenance."""
        self.statut = "validee"
