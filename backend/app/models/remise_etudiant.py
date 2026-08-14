from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class RemiseEtudiant(Base):
    __tablename__ = "remises_etudiants"

    id = Column(Integer, primary_key=True, index=True)
    remise_id = Column(Integer, ForeignKey("remises.id"), nullable=False)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=True)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    montant_remise = Column(Numeric(10, 2), nullable=False)
    date_attribution = Column(Date, nullable=False, default=date.today)
    motif = Column(Text, nullable=True)
    attribuee_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    remise = relationship("Remise", back_populates="attributions")
    etudiant = relationship("Etudiant")
    facture = relationship("Facture", back_populates="remises_appliquees")
    annee_academique = relationship("AnneeAcademique")

    # Index composite
    __table_args__ = (
        Index('ix_remises_etudiants_composite', 'etudiant_id', 'annee_academique_id'),
    )
