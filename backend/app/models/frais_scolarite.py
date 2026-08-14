from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class FraisScolarite(Base):
    __tablename__ = "frais_scolarite"

    id = Column(Integer, primary_key=True, index=True)
    type_frais_id = Column(Integer, ForeignKey("types_frais.id"), nullable=False)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=True)
    filiere_id = Column(Integer, ForeignKey("filiere.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("cycle.id"), nullable=True)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    montant = Column(Numeric(10, 2), nullable=False)
    devise = Column(String(10), default="XOF")
    date_debut_validite = Column(Date, nullable=False)
    date_fin_validite = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    type_frais = relationship("TypeFrais", back_populates="frais_scolarite")
    niveau = relationship("Niveau")
    filiere = relationship("Filiere")
    cycle = relationship("Cycle")
    annee_academique = relationship("AnneeAcademique")
    lignes_facture = relationship("LigneFacture", back_populates="frais_scolarite")

    # Index composite
    __table_args__ = (
        Index('ix_frais_scolarite_composite', 'type_frais_id', 'niveau_id', 'filiere_id', 'annee_academique_id'),
    )
