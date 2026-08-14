from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class CompteEtudiant(Base):
    __tablename__ = "comptes_etudiants"

    id = Column(Integer, primary_key=True, index=True)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), unique=True, nullable=False)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    solde_actuel = Column(Numeric(10, 2), default=0)  # négatif si dette, positif si crédit
    total_facture = Column(Numeric(10, 2), default=0)
    total_paye = Column(Numeric(10, 2), default=0)
    total_restant = Column(Numeric(10, 2), default=0)
    devise = Column(String(10), default="XOF")
    statut_compte = Column(String(50), nullable=False, default="actif")  # actif, suspendu, bloque, solde
    date_derniere_operation = Column(DateTime, nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant = relationship("Etudiant")
    annee_academique = relationship("AnneeAcademique")
    mouvements = relationship("MouvementCompte", back_populates="compte", order_by="desc(MouvementCompte.date_mouvement)")

    # Index composite
    __table_args__ = (
        Index('ix_comptes_etudiants_composite', 'etudiant_id', 'annee_academique_id'),
    )

    def recalculer_soldes(self):
        """Recalcule les soldes du compte"""
        self.total_restant = float(self.total_facture or 0) - float(self.total_paye or 0)
        self.solde_actuel = -self.total_restant  # négatif si dette
