from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class LigneFacture(Base):
    __tablename__ = "lignes_facture"

    id = Column(Integer, primary_key=True, index=True)
    facture_id = Column(Integer, ForeignKey("factures.id"), nullable=False)
    frais_scolarite_id = Column(Integer, ForeignKey("frais_scolarite.id"), nullable=True)
    libelle = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quantite = Column(Integer, default=1)
    prix_unitaire = Column(Numeric(10, 2), nullable=False)
    montant_ligne = Column(Numeric(10, 2), nullable=False)
    tva_taux = Column(Numeric(5, 2), default=0)
    tva_montant = Column(Numeric(10, 2), default=0)
    montant_ttc = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    facture = relationship("Facture", back_populates="lignes_facture")
    frais_scolarite = relationship("FraisScolarite", back_populates="lignes_facture")

    def calculer_montants(self):
        """Calcule les montants de la ligne"""
        self.montant_ligne = float(self.prix_unitaire or 0) * (self.quantite or 1)
        self.tva_montant = self.montant_ligne * float(self.tva_taux or 0) / 100
        self.montant_ttc = self.montant_ligne + self.tva_montant
