"""
Modèle SQLAlchemy pour les bâtiments
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Batiment(Base):
    """Modèle représentant un bâtiment d'un établissement"""
    
    __tablename__ = "batiments"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=False)
    adresse = Column(String(500), nullable=True)
    nombre_etages = Column(Integer, nullable=True, default=0)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement", back_populates="batiments")
    salles = relationship("Salle", back_populates="batiment", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Batiment(id={self.id}, code='{self.code}', libelle='{self.libelle}')>"
