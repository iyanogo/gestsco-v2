"""
Modèle Semestre pour le système LMD CAMES.
Structure : L (S1-S6), M (S7-S10), D (S11-S16)
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, DateTime,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class Semestre(Base):
    """
    Représente un semestre dans le système LMD.
    
    Structure CAMES :
    - Licence (L) : S1-S6 (3 ans × 2 semestres = 180 crédits)
    - Master (M) : S7-S10 (2 ans × 2 semestres = 120 crédits)
    - Doctorat (D) : S11-S16 (3 ans × 2 semestres = 180 crédits)
    """
    
    __tablename__ = "semestres"
    __table_args__ = (
        UniqueConstraint('cycle_id', 'numero_semestre', name='uq_semestre_cycle_numero'),
    )

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # S1, S2, ..., S16
    libelle = Column(String(100), nullable=False)  # Semestre 1, Semestre 2, ...
    
    # Référence au cycle (Licence, Master, Doctorat)
    cycle_id = Column(Integer, ForeignKey("cycle.id"), nullable=False)
    
    # Position du semestre
    numero_semestre = Column(Integer, nullable=False)  # 1 à 16 (global)
    annee_dans_cycle = Column(Integer, nullable=False)  # 1, 2, 3 pour L; 1, 2 pour M; 1-3 pour D
    semestre_dans_annee = Column(Integer, nullable=False)  # 1 ou 2
    
    # Crédits ECTS
    credits_requis = Column(Integer, nullable=False, default=30)
    
    # Informations complémentaires
    description = Column(Text, nullable=True)
    
    # Statut
    is_active = Column(Boolean, default=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    cycle = relationship("Cycle", back_populates="semestres")
    niveaux = relationship("Niveau", back_populates="semestre")

    def __repr__(self):
        return f"<Semestre {self.code}: {self.libelle}>"
    
    @property
    def est_semestre_pair(self) -> bool:
        """Retourne True si c'est un semestre pair (fin d'année)."""
        return self.semestre_dans_annee == 2
    
    @property
    def cycle_code(self) -> str:
        """Retourne le code du cycle (L, M ou D)."""
        if self.numero_semestre <= 6:
            return "L"
        elif self.numero_semestre <= 10:
            return "M"
        else:
            return "D"
