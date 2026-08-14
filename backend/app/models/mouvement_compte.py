from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class MouvementCompte(Base):
    __tablename__ = "mouvements_compte"

    id = Column(Integer, primary_key=True, index=True)
    compte_id = Column(Integer, ForeignKey("comptes_etudiants.id"), nullable=False)
    type_mouvement = Column(String(50), nullable=False)  # debit, credit
    montant = Column(Numeric(10, 2), nullable=False)
    solde_avant = Column(Numeric(10, 2), nullable=False)
    solde_apres = Column(Numeric(10, 2), nullable=False)
    libelle = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=True)
    paiement_id = Column(Integer, ForeignKey("paiements_factures.id"), nullable=True)
    date_mouvement = Column(DateTime, nullable=False, default=datetime.utcnow)
    effectue_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    compte = relationship("CompteEtudiant", back_populates="mouvements")
    facture = relationship("Facture", back_populates="mouvements")
    paiement = relationship("PaiementFacture", back_populates="mouvements")

    # Index composite
    __table_args__ = (
        Index('ix_mouvements_compte_date', 'compte_id', 'date_mouvement'),
    )
