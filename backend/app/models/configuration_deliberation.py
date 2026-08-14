"""
Modèle ConfigurationDeliberation pour la configuration des règles de délibération.
Conforme au système CAMES avec gestion des compensations et validations.
"""

from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    Numeric, JSON, ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class ConfigurationDeliberation(Base):
    """
    Configuration des règles de délibération par année académique et niveau.
    
    Permet de définir :
    - La périodicité des délibérations (semestrielle ou annuelle)
    - Les règles de compensation entre semestres
    - Les seuils de validation et de passage
    - Les règles spécifiques par niveau
    """
    
    __tablename__ = "configurations_deliberation"
    __table_args__ = (
        UniqueConstraint(
            'annee_academique_id', 'niveau_id',
            name='uq_config_deliberation_annee_niveau'
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    
    # Références
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False, index=True)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=True)  # NULL = config globale
    
    # Périodicité
    periodicite = Column(String(50), nullable=False, default="semestrielle")  # semestrielle, annuelle
    
    # Compensation des semestres
    compensation_semestres = Column(Boolean, default=True)  # Les moyennes des semestres se compensent
    
    # Seuils
    note_eliminatoire = Column(Numeric(5, 2), nullable=True)  # Note en dessous = éliminatoire
    nombre_matieres_dette_max = Column(Integer, nullable=True, default=2)  # Max matières en dette
    moyenne_validation = Column(Numeric(5, 2), nullable=False, default=Decimal("10.0"))  # Moyenne pour valider
    moyenne_passage_conditionnel = Column(Numeric(5, 2), nullable=True, default=Decimal("8.0"))  # Passage conditionnel
    credits_min_passage = Column(Integer, nullable=True)  # Crédits min pour passage
    
    # Présence
    taux_presence_min = Column(Numeric(5, 2), nullable=True, default=Decimal("75.0"))  # % présence min
    
    # Sessions
    autoriser_rattrapage = Column(Boolean, default=True)
    nombre_sessions_max = Column(Integer, nullable=False, default=2)
    
    # Règles spécifiques (JSON pour flexibilité)
    regles_specifiques = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    annee_academique = relationship("AnneeAcademique")
    niveau = relationship("Niveau")

    def __repr__(self):
        niveau_str = f"niveau={self.niveau_id}" if self.niveau_id else "global"
        return f"<ConfigurationDeliberation annee={self.annee_academique_id} {niveau_str}>"
    
    @property
    def est_semestrielle(self) -> bool:
        """Retourne True si la périodicité est semestrielle."""
        return self.periodicite == "semestrielle"
    
    @property
    def est_annuelle(self) -> bool:
        """Retourne True si la périodicité est annuelle."""
        return self.periodicite == "annuelle"
    
    def peut_compenser(self, moyenne_s1: Decimal, moyenne_s2: Decimal) -> bool:
        """
        Vérifie si les semestres peuvent se compenser.
        
        Args:
            moyenne_s1: Moyenne du semestre 1
            moyenne_s2: Moyenne du semestre 2
            
        Returns:
            True si la compensation est possible et valide l'année
        """
        if not self.compensation_semestres:
            return False
        
        moyenne_annuelle = (moyenne_s1 + moyenne_s2) / 2
        return moyenne_annuelle >= self.moyenne_validation
    
    def est_note_eliminatoire(self, note: Decimal) -> bool:
        """
        Vérifie si une note est éliminatoire.
        
        Args:
            note: Note à vérifier
            
        Returns:
            True si la note est éliminatoire
        """
        if self.note_eliminatoire is None:
            return False
        return note < self.note_eliminatoire
    
    def valide_taux_presence(self, taux: Decimal) -> bool:
        """
        Vérifie si le taux de présence est suffisant.
        
        Args:
            taux: Taux de présence en pourcentage
            
        Returns:
            True si le taux est suffisant
        """
        if self.taux_presence_min is None:
            return True
        return taux >= self.taux_presence_min
    
    def peut_passer_conditionnel(self, moyenne: Decimal, matieres_dette: int) -> bool:
        """
        Vérifie si l'étudiant peut passer de manière conditionnelle.
        
        Args:
            moyenne: Moyenne de l'étudiant
            matieres_dette: Nombre de matières en dette
            
        Returns:
            True si le passage conditionnel est possible
        """
        if self.moyenne_passage_conditionnel is None:
            return False
        
        if moyenne < self.moyenne_passage_conditionnel:
            return False
        
        if self.nombre_matieres_dette_max is not None:
            if matieres_dette > self.nombre_matieres_dette_max:
                return False
        
        return True
