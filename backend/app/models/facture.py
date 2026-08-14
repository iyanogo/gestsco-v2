from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Facture(Base):
    __tablename__ = "factures"

    id = Column(Integer, primary_key=True, index=True)
    numero_facture = Column(String(50), unique=True, nullable=False, index=True)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    date_emission = Column(Date, nullable=False, default=date.today)
    date_echeance = Column(Date, nullable=False)
    montant_total = Column(Numeric(10, 2), nullable=False)
    montant_paye = Column(Numeric(10, 2), default=0)
    montant_restant = Column(Numeric(10, 2), nullable=False)
    devise = Column(String(10), default="XOF")
    statut = Column(String(50), nullable=False, default="en_attente")  # en_attente, partiellement_payee, payee, annulee, expiree
    type_facture = Column(String(50), nullable=False)  # inscription, scolarite, examen, autre
    description = Column(Text, nullable=True)
    observations = Column(Text, nullable=True)
    emise_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    validee_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_validation = Column(DateTime, nullable=True)
    annulee_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_annulation = Column(DateTime, nullable=True)
    motif_annulation = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant = relationship("Etudiant")
    annee_academique = relationship("AnneeAcademique")
    lignes_facture = relationship("LigneFacture", back_populates="facture", cascade="all, delete-orphan")
    paiements = relationship("PaiementFacture", back_populates="facture")
    echeanciers = relationship("Echeancier", back_populates="facture", cascade="all, delete-orphan")
    remises_appliquees = relationship("RemiseEtudiant", back_populates="facture")
    mouvements = relationship("MouvementCompte", back_populates="facture")

    def calculer_montant_restant(self) -> float:
        """Calcule le montant restant à payer"""
        return float(self.montant_total or 0) - float(self.montant_paye or 0)

    def mettre_a_jour_statut(self):
        """Met à jour le statut de la facture en fonction des paiements"""
        montant_restant = self.calculer_montant_restant()
        if montant_restant <= 0:
            self.statut = "payee"
        elif float(self.montant_paye or 0) > 0:
            self.statut = "partiellement_payee"
        else:
            self.statut = "en_attente"
        self.montant_restant = montant_restant
