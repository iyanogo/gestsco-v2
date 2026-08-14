"""
Modèle pour les notes.
Gère les notes individuelles des étudiants pour chaque examen.
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, DateTime, Text, ForeignKey, Index, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.examen import Examen
    from app.models.inscription_matiere import InscriptionMatiere
    from app.models.etudiant import Etudiant
    from app.models.user import User


class Note(Base):
    """
    Modèle représentant une note d'examen pour un étudiant.
    
    Chaque note est liée à un examen et à une inscription matière.
    Elle inclut le statut de présence et la traçabilité de la saisie/validation.
    """

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    examen_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("examens.id"), nullable=False
    )
    inscription_matiere_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("inscriptions_matieres.id"), nullable=False
    )
    etudiant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("etudiant.id"), nullable=False
    )
    note: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # null si absent
    note_sur: Mapped[float] = mapped_column(Float, nullable=False, default=20.0)
    note_sur_20: Mapped[Optional[float]] = mapped_column(Float, nullable=True)  # note ramenée sur 20
    statut_presence: Mapped[str] = mapped_column(
        String(50), nullable=False, default="present"
    )  # present, absent, absent_justifie, dispense
    numero_anonymat: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    observation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    saisie_par: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    date_saisie: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    validee_par: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    date_validation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_valide: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    examen: Mapped["Examen"] = relationship("Examen", back_populates="notes")
    inscription_matiere: Mapped["InscriptionMatiere"] = relationship("InscriptionMatiere")
    etudiant: Mapped["Etudiant"] = relationship("Etudiant")
    saisie_utilisateur: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[saisie_par]
    )
    validation_utilisateur: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[validee_par]
    )

    __table_args__ = (
        UniqueConstraint("examen_id", "inscription_matiere_id", name="uq_note_examen_inscription"),
        Index("ix_notes_examen_id", "examen_id"),
        Index("ix_notes_etudiant_id", "etudiant_id"),
        Index("ix_notes_is_valide", "is_valide"),
    )

    def calculer_note_sur_20(self) -> Optional[float]:
        """
        Calcule la note ramenée sur 20.
        
        Returns:
            La note sur 20 ou None si pas de note
        """
        if self.note is None:
            return None
        if self.note_sur == 0:
            return 0.0
        return round((self.note / self.note_sur) * 20, 2)

    def __repr__(self) -> str:
        return f"<Note(id={self.id}, etudiant_id={self.etudiant_id}, note={self.note})>"
