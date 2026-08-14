"""
Modèle SQLAlchemy pour les salles
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Salle(Base):
    """Modèle représentant une salle de cours/TP/amphi"""
    
    __tablename__ = "salles"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    batiment_id = Column(Integer, ForeignKey("batiments.id"), nullable=False)
    type_salle = Column(String(50), nullable=False)  # cours, tp, amphi, labo, salle_info, salle_reunion
    etage = Column(Integer, nullable=True)
    capacite = Column(Integer, nullable=False, default=30)
    superficie = Column(Float, nullable=True)  # en m²
    equipements = Column(Text, nullable=True)  # JSON : projecteur, tableau, ordinateurs, etc.
    description = Column(Text, nullable=True)
    is_accessible_pmr = Column(Boolean, default=False)  # Personnes à Mobilité Réduite
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    batiment = relationship("Batiment", back_populates="salles")
    seances = relationship("Seance", back_populates="salle")
    reservations = relationship("ReservationSalle", back_populates="salle")

    # Index composé
    __table_args__ = (
        Index('ix_salles_batiment_type', 'batiment_id', 'type_salle'),
    )

    def __repr__(self):
        return f"<Salle(id={self.id}, code='{self.code}', type='{self.type_salle}', capacite={self.capacite})>"
