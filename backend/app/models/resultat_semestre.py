"""
Modèle pour les résultats semestriels.
Gère les résultats consolidés d'un étudiant pour un semestre.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.inscription import Inscription
    from app.models.etudiant import Etudiant
    from app.models.session_examen import SessionExamen


class ResultatSemestre(Base):
    """
    Modèle représentant le résultat semestriel d'un étudiant.
    
    Consolide les résultats de toutes les matières du semestre
    pour calculer la moyenne générale et les crédits obtenus.
    """

    __tablename__ = "resultats_semestres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    inscription_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("inscriptions.id"), nullable=False
    )
    etudiant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("etudiant.id"), nullable=False
    )
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions_examen.id"), nullable=False
    )
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 ou 2
    moyenne_generale: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_credits_inscrits: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_credits_obtenus: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    total_credits_capitalises: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    nombre_matieres: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_matieres_validees: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_cours"
    )  # en_cours, valide, ajourne
    decision: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # admis, admis_avec_dette, ajourne, redouble
    mention: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # passable, assez_bien, bien, tres_bien, excellent
    rang: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    effectif: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
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
    session: Mapped["SessionExamen"] = relationship("SessionExamen")

    __table_args__ = (
        UniqueConstraint("inscription_id", "session_id", "semestre", name="uq_resultat_semestre"),
        Index("ix_resultats_semestres_etudiant_id", "etudiant_id"),
        Index("ix_resultats_semestres_session_id", "session_id"),
        Index("ix_resultats_semestres_statut", "statut"),
    )

    def __repr__(self) -> str:
        return f"<ResultatSemestre(id={self.id}, etudiant_id={self.etudiant_id}, semestre={self.semestre}, moyenne={self.moyenne_generale})>"
