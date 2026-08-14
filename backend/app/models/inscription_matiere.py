"""
Modèle pour les inscriptions aux matières
"""

from datetime import datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import Integer, Boolean, DateTime, BigInteger, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.inscription import Inscription
    from app.models.matiere import Matiere


class InscriptionMatiere(Base):
    """Modèle représentant l'inscription d'un étudiant à une matière."""

    __tablename__ = "inscriptions_matieres"
    __table_args__ = (
        UniqueConstraint('inscription_id', 'matiere_id', name='uq_inscription_matiere'),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    inscription_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("inscriptions.id"), nullable=False, index=True)
    matiere_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("matiere.id"), nullable=False, index=True)
    
    # Semestre
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Statut
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)

    # Relations
    inscription: Mapped["Inscription"] = relationship("Inscription", back_populates="inscriptions_matieres")
    matiere: Mapped["Matiere"] = relationship("Matiere")

    def __repr__(self) -> str:
        return f"<InscriptionMatiere(id={self.id}, inscription_id={self.inscription_id}, matiere_id={self.matiere_id})>"
