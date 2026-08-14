"""
Modèle pour les paiements
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.dossier_candidature import DossierCandidature
    from app.models.inscrit import Inscrit
    from app.models.user import User


class Paiement(Base):
    """
    Modèle représentant un paiement.
    
    Peut être lié à un dossier de candidature ou une inscription.
    """

    __tablename__ = "paiements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_transaction: Mapped[str] = mapped_column(
        String(100), unique=True, nullable=False, index=True
    )
    dossier_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("dossiers_candidature.id"), nullable=True, index=True
    )
    inscrit_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("inscrit.id"), nullable=True, index=True
    )
    type_paiement: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    montant: Mapped[float] = mapped_column(Float, nullable=False)
    devise: Mapped[str] = mapped_column(String(10), nullable=False, default="XOF")
    mode_paiement: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    reference_paiement: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    date_paiement: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, default=datetime.utcnow
    )
    statut_paiement: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_attente", index=True
    )
    operateur: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    numero_recu: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    commentaire: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    valide_par: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    date_validation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    dossier: Mapped[Optional["DossierCandidature"]] = relationship(
        "DossierCandidature", back_populates="paiements"
    )
    inscrit: Mapped[Optional["Inscrit"]] = relationship("Inscrit", back_populates="paiements", lazy="joined")
    validateur: Mapped[Optional["User"]] = relationship("User", lazy="joined")

    __table_args__ = (
        Index("ix_paiements_statut_type", "statut_paiement", "type_paiement"),
        Index("ix_paiements_date", "date_paiement"),
    )

    def __repr__(self) -> str:
        return f"<Paiement(id={self.id}, numero={self.numero_transaction}, montant={self.montant}, statut={self.statut_paiement})>"
