"""
Modèle pour les délibérations.
Gère les sessions de délibération pour valider les résultats des étudiants.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.session_examen import SessionExamen
    from app.models.niveau import Niveau
    from app.models.filiere import Filiere
    from app.models.user import User


class Deliberation(Base):
    """
    Modèle représentant une délibération.
    
    Une délibération est une réunion du jury pour valider les résultats
    des étudiants d'un niveau et d'une filière pour une session donnée.
    """

    __tablename__ = "deliberations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions_examen.id"), nullable=False
    )
    niveau_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("niveau.id"), nullable=False
    )
    filiere_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("filiere.id"), nullable=False
    )
    date_deliberation: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    type_deliberation: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # semestrielle, annuelle (legacy: semestre)
    semestre: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # si type=semestrielle
    president_jury: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    membres_jury: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON des membres
    nombre_etudiants: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_admis: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_ajournes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    nombre_redoublants: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    taux_reussite: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_cours"
    )  # en_cours, terminee, validee, publiee
    proces_verbal_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    observations: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    validee_par: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    date_validation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    publiee: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    date_publication: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    session: Mapped["SessionExamen"] = relationship("SessionExamen")
    niveau: Mapped["Niveau"] = relationship("Niveau")
    filiere: Mapped["Filiere"] = relationship("Filiere")
    president: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[president_jury]
    )
    validateur: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[validee_par]
    )

    __table_args__ = (
        UniqueConstraint(
            "session_id", "niveau_id", "filiere_id", "semestre",
            name="uq_deliberation_session_niveau_filiere_semestre"
        ),
        Index("ix_deliberations_session_id", "session_id"),
        Index("ix_deliberations_niveau_id", "niveau_id"),
        Index("ix_deliberations_filiere_id", "filiere_id"),
        Index("ix_deliberations_statut", "statut"),
    )

    def calculer_taux_reussite(self) -> Optional[float]:
        """Calcule le taux de réussite."""
        if self.nombre_etudiants == 0:
            return None
        return round((self.nombre_admis / self.nombre_etudiants) * 100, 2)

    def __repr__(self) -> str:
        return f"<Deliberation(id={self.id}, session_id={self.session_id}, niveau_id={self.niveau_id})>"
