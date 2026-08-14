"""
Modèle pour la table inscrit existante (inscriptions des étudiants)
"""

from datetime import date, datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Date, DateTime, BigInteger, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.etudiant import Etudiant
    from app.models.paiement import Paiement


class Inscrit(Base):
    """
    Modèle représentant une inscription d'étudiant.
    Mappe la table 'inscrit' existante dans la base de données.
    """

    __tablename__ = "inscrit"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    etudiant_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("etudiant.id"), nullable=True, index=True)
    enseignement_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    
    # Colonnes existantes d'audit
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Nouvelles colonnes à ajouter via migration
    filiere_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("filiere.id"), nullable=True, index=True)
    niveau_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("niveau.id"), nullable=True, index=True)
    annee_academique: Mapped[Optional[str]] = mapped_column(String(20), nullable=True, index=True)
    date_inscription: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    type_inscription: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    regime_etudes: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    statut_inscription: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="en_cours")
    frais_inscription: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    frais_payes: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, default=True)

    # Relations
    etudiant: Mapped[Optional["Etudiant"]] = relationship("Etudiant", back_populates="inscrits", lazy="joined")
    paiements: Mapped[list["Paiement"]] = relationship("Paiement", back_populates="inscrit", lazy="selectin")

    def get_solde(self) -> float:
        """Calcule le solde restant à payer."""
        return (self.frais_inscription or 0.0) - (self.frais_payes or 0.0)

    def is_paid(self) -> bool:
        """Vérifie si l'inscription est entièrement payée."""
        return self.get_solde() <= 0

    def __repr__(self) -> str:
        return f"<Inscrit(id={self.id}, etudiant_id={self.etudiant_id}, code={self.code})>"
