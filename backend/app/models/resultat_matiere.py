"""
Modèle pour les résultats par matière.
Gère les résultats consolidés d'un étudiant pour une matière donnée.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.inscription_matiere import InscriptionMatiere
    from app.models.etudiant import Etudiant
    from app.models.matiere import Matiere
    from app.models.session_examen import SessionExamen


class ResultatMatiere(Base):
    """
    Modèle représentant le résultat d'un étudiant pour une matière.
    
    Consolide les différentes notes (CC, TP, examen) pour calculer
    la moyenne de la matière et déterminer les crédits obtenus.
    """

    __tablename__ = "resultats_matieres"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    inscription_matiere_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("inscriptions_matieres.id"), nullable=False, unique=True
    )
    etudiant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("etudiant.id"), nullable=False
    )
    matiere_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("matiere.id"), nullable=False
    )
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("sessions_examen.id"), nullable=False
    )
    note_cc: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Contrôle Continu
    note_tp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Travaux Pratiques
    note_examen: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # Examen final
    moyenne_matiere: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    credit_matiere: Mapped[float] = mapped_column(Float, nullable=False)
    credit_obtenu: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_cours"
    )  # en_cours, valide, ajourne, dispense
    decision: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # admis, ajourne, rattrapage
    session_obtention: Mapped[Optional[str]] = mapped_column(
        String(50), nullable=True
    )  # normale, rattrapage
    observation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_valide: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    inscription_matiere: Mapped["InscriptionMatiere"] = relationship("InscriptionMatiere")
    etudiant: Mapped["Etudiant"] = relationship("Etudiant")
    matiere: Mapped["Matiere"] = relationship("Matiere")
    session: Mapped["SessionExamen"] = relationship("SessionExamen")

    __table_args__ = (
        Index("ix_resultats_matieres_etudiant_session", "etudiant_id", "session_id"),
        Index("ix_resultats_matieres_matiere_id", "matiere_id"),
        Index("ix_resultats_matieres_statut", "statut"),
    )

    def __repr__(self) -> str:
        return f"<ResultatMatiere(id={self.id}, etudiant_id={self.etudiant_id}, moyenne={self.moyenne_matiere})>"
