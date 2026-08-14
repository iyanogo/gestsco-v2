"""
Modèle pour les inscriptions des étudiants
"""

from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Boolean, Date, DateTime, BigInteger, Float, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.etudiant import Etudiant
    from app.models.filiere import Filiere
    from app.models.niveau import Niveau
    from app.models.inscription_matiere import InscriptionMatiere


class Inscription(Base):
    """Modèle représentant une inscription d'étudiant."""

    __tablename__ = "inscriptions"
    __table_args__ = (
        UniqueConstraint('etudiant_id', 'annee_academique', 'niveau_id', name='uq_inscription_etudiant_annee_niveau'),
        Index('idx_inscription_annee', 'annee_academique'),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    etudiant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("etudiant.id"), nullable=False, index=True)
    filiere_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("filiere.id"), nullable=False, index=True)
    niveau_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("niveau.id"), nullable=False, index=True)
    
    # Informations d'inscription
    annee_academique: Mapped[str] = mapped_column(String(20), nullable=False)
    date_inscription: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)
    type_inscription: Mapped[str] = mapped_column(String(50), nullable=False)
    regime_etudes: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    statut_inscription: Mapped[str] = mapped_column(String(50), nullable=False, default="en_cours")
    
    # Frais
    frais_inscription: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    frais_payes: Mapped[Optional[float]] = mapped_column(Float, nullable=True, default=0.0)
    
    # Statut
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant: Mapped["Etudiant"] = relationship("Etudiant", back_populates="inscriptions")
    filiere: Mapped["Filiere"] = relationship("Filiere")
    niveau: Mapped["Niveau"] = relationship("Niveau")
    inscriptions_matieres: Mapped[List["InscriptionMatiere"]] = relationship(
        "InscriptionMatiere",
        back_populates="inscription",
        cascade="all, delete-orphan"
    )

    def get_solde(self) -> float:
        """Calcule le solde restant à payer."""
        return (self.frais_inscription or 0.0) - (self.frais_payes or 0.0)

    def is_paid(self) -> bool:
        """Vérifie si l'inscription est entièrement payée."""
        return self.get_solde() <= 0

    def __repr__(self) -> str:
        return f"<Inscription(id={self.id}, etudiant_id={self.etudiant_id}, annee={self.annee_academique})>"
