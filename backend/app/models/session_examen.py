"""
Modèle pour les sessions d'examen.
Gère les périodes d'évaluation (session normale, rattrapage) selon le système LMD/CAMES.
"""

from datetime import datetime, date
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.annee_academique import AnneeAcademique
    from app.models.examen import Examen


class SessionExamen(Base):
    """
    Modèle représentant une session d'examen.
    
    Une session d'examen correspond à une période d'évaluation pour un semestre
    donné d'une année académique. Elle peut être de type normale ou rattrapage.
    """

    __tablename__ = "sessions_examen"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    libelle: Mapped[str] = mapped_column(String(255), nullable=False)
    annee_academique_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("annees_academiques.id"), nullable=False
    )
    type_session: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # normale, rattrapage
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 ou 2
    date_debut: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin: Mapped[date] = mapped_column(Date, nullable=False)
    date_limite_saisie_notes: Mapped[date] = mapped_column(Date, nullable=False)
    date_deliberation: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="planifiee"
    )  # planifiee, en_cours, cloturee, validee
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    annee_academique: Mapped["AnneeAcademique"] = relationship(
        "AnneeAcademique", back_populates="sessions_examen"
    )
    examens: Mapped[list["Examen"]] = relationship(
        "Examen", back_populates="session", lazy="dynamic"
    )

    __table_args__ = (
        Index("ix_sessions_examen_annee_semestre", "annee_academique_id", "semestre"),
        Index("ix_sessions_examen_statut", "statut"),
    )

    def is_saisie_ouverte(self) -> bool:
        """Vérifie si la saisie des notes est encore ouverte."""
        if self.statut not in ("planifiee", "en_cours"):
            return False
        return date.today() <= self.date_limite_saisie_notes

    def __repr__(self) -> str:
        return f"<SessionExamen(id={self.id}, code={self.code}, type={self.type_session})>"
