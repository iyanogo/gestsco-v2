from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Date, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class Echeancier(Base):
    __tablename__ = "echeanciers"

    id = Column(Integer, primary_key=True, index=True)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=False)
    numero_echeance = Column(Integer, nullable=False)
    date_echeance = Column(Date, nullable=False)
    montant_echeance = Column(Numeric(10, 2), nullable=False)
    montant_paye = Column(Numeric(10, 2), default=0)
    statut = Column(String(50), nullable=False, default="en_attente")  # en_attente, payee, en_retard
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant = relationship("Etudiant")
    facture = relationship("Facture", back_populates="echeanciers")

    # Index composite
    __table_args__ = (
        Index('ix_echeanciers_facture_numero', 'facture_id', 'numero_echeance'),
    )

    def verifier_retard(self):
        """Vérifie si l'échéance est en retard"""
        if self.statut == "payee":
            return
        if self.date_echeance < date.today() and float(self.montant_paye or 0) < float(self.montant_echeance):
            self.statut = "en_retard"

    def est_payee(self) -> bool:
        """Vérifie si l'échéance est entièrement payée"""
        return float(self.montant_paye or 0) >= float(self.montant_echeance)
