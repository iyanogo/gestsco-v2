"""
Modèle pour les examens.
Gère les évaluations (contrôle continu, examen partiel, examen final, TP, projet).
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.session_examen import SessionExamen
    from app.models.matiere import Matiere
    from app.models.niveau import Niveau
    from app.models.user import User
    from app.models.note import Note


class Examen(Base):
    """
    Modèle représentant un examen ou une évaluation.
    
    Un examen est lié à une session, une matière et un niveau.
    Il peut être de différents types : contrôle continu, examen partiel,
    examen final, TP ou projet.
    """

    __tablename__ = "examens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions_examen.id"), nullable=False
    )
    matiere_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("matiere.id"), nullable=False
    )
    niveau_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("niveau.id"), nullable=False
    )
    type_evaluation: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # controle_continu, examen_partiel, examen_final, tp, projet
    date_examen: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    duree_minutes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    salle: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    coefficient: Mapped[float] = mapped_column(Float, nullable=False, default=1.0)
    note_sur: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)
    bareme: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)
    anonymat: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="planifie"
    )  # planifie, en_cours, termine, notes_saisies, valide
    enseignant_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    session: Mapped["SessionExamen"] = relationship(
        "SessionExamen", back_populates="examens"
    )
    matiere: Mapped["Matiere"] = relationship("Matiere")
    niveau: Mapped["Niveau"] = relationship("Niveau")
    enseignant: Mapped[Optional["User"]] = relationship("User")
    notes: Mapped[list["Note"]] = relationship(
        "Note", back_populates="examen", lazy="dynamic"
    )

    __table_args__ = (
        Index(
            "ix_examens_session_matiere_niveau_type",
            "session_id", "matiere_id", "niveau_id", "type_evaluation"
        ),
        Index("ix_examens_session_id", "session_id"),
        Index("ix_examens_matiere_id", "matiere_id"),
        Index("ix_examens_statut", "statut"),
    )

    def __repr__(self) -> str:
        return f"<Examen(id={self.id}, type={self.type_evaluation}, matiere_id={self.matiere_id})>"
