"""
Modèle pour les résultats annuels.
Gère les résultats consolidés d'un étudiant pour une année académique.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.inscription import Inscription
    from app.models.etudiant import Etudiant
    from app.models.annee_academique import AnneeAcademique
    from app.models.niveau import Niveau


class ResultatAnnuel(Base):
    """
    Modèle représentant le résultat annuel d'un étudiant.
    
    Consolide les résultats des deux semestres pour déterminer
    le passage au niveau supérieur et la mention obtenue.
    """

    __tablename__ = "resultats_annuels"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    inscription_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("inscriptions.id"), nullable=False, unique=True
    )
    etudiant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("etudiant.id"), nullable=False
    )
    annee_academique_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("annees_academiques.id"), nullable=False
    )
    niveau_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("niveau.id"), nullable=False
    )
    moyenne_annuelle: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    moyenne_semestre1: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    moyenne_semestre2: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_credits_inscrits: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_credits_obtenus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_credits_capitalises: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_cours"
    )  # en_cours, valide, ajourne
    decision: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # admis, admis_avec_dette, redouble, exclus
    mention: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # passable, assez_bien, bien, tres_bien, excellent
    rang: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    effectif: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    passage_niveau_superieur: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_valide: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    date_deliberation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    inscription: Mapped["Inscription"] = relationship("Inscription")
    etudiant: Mapped["Etudiant"] = relationship("Etudiant")
    annee_academique: Mapped["AnneeAcademique"] = relationship("AnneeAcademique")
    niveau: Mapped["Niveau"] = relationship("Niveau")

    __table_args__ = (
        Index("ix_resultats_annuels_etudiant_annee", "etudiant_id", "annee_academique_id"),
        Index("ix_resultats_annuels_niveau_id", "niveau_id"),
        Index("ix_resultats_annuels_statut", "statut"),
    )

    def __repr__(self) -> str:
        return f"<ResultatAnnuel(id={self.id}, etudiant_id={self.etudiant_id}, moyenne={self.moyenne_annuelle})>"
