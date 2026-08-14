from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class PaiementFacture(Base):
    """Paiement lié à une facture étudiant"""
    __tablename__ = "paiements_factures"

    id = Column(Integer, primary_key=True, index=True)
    numero_paiement = Column(String(50), unique=True, nullable=False, index=True)
    numero_recu = Column(String(50), unique=True, nullable=True, index=True)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=False)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    date_paiement = Column(DateTime, nullable=False, default=datetime.utcnow)
    montant = Column(Numeric(10, 2), nullable=False)
    devise = Column(String(10), default="XOF")
    mode_paiement = Column(String(50), nullable=False)  # especes, cheque, virement, carte_bancaire, mobile_money, autre
    reference_transaction = Column(String(255), nullable=True)
    statut = Column(String(50), nullable=False, default="en_attente")  # en_attente, valide, rejete, annule
    banque = Column(String(255), nullable=True)
    numero_cheque = Column(String(100), nullable=True)
    date_valeur = Column(Date, nullable=True)
    observations = Column(Text, nullable=True)
    recu_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    valide_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_validation = Column(DateTime, nullable=True)
    rejete_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_rejet = Column(DateTime, nullable=True)
    motif_rejet = Column(Text, nullable=True)
    fichier_preuve_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    facture = relationship("Facture", back_populates="paiements")
    etudiant = relationship("Etudiant")
    mouvements = relationship("MouvementCompte", back_populates="paiement")

    # Index
    __table_args__ = (
        Index('ix_paiements_factures_statut_date', 'statut', 'date_paiement'),
    )
