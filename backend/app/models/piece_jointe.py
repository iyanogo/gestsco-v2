"""
Modèle pour les pièces jointes des dossiers de candidature
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.dossier_candidature import DossierCandidature


class PieceJointe(Base):
    """
    Modèle représentant une pièce jointe d'un dossier de candidature.
    
    Stocke les documents fournis par les candidats.
    """

    __tablename__ = "pieces_jointes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    dossier_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("dossiers_candidature.id"), nullable=False, index=True
    )
    type_piece: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    libelle: Mapped[str] = mapped_column(String(255), nullable=False)
    fichier_url: Mapped[str] = mapped_column(String(500), nullable=False)
    format_fichier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    taille_fichier: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_valide: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    commentaire: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    dossier: Mapped["DossierCandidature"] = relationship(
        "DossierCandidature", back_populates="pieces_jointes"
    )

    __table_args__ = (
        Index("ix_pieces_jointes_dossier_type", "dossier_id", "type_piece"),
    )

    def __repr__(self) -> str:
        return f"<PieceJointe(id={self.id}, type={self.type_piece}, dossier_id={self.dossier_id})>"
