"""
Modèle pour les types de pièces requises par campagne
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.campagne_inscription import CampagneInscription


class TypePieceRequise(Base):
    """
    Modèle représentant un type de pièce requise pour une campagne d'inscription.
    
    Définit les documents que les candidats doivent fournir.
    """

    __tablename__ = "types_pieces_requises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    campagne_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campagnes_inscription.id"), nullable=False, index=True
    )
    type_piece: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    libelle: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    ordre: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    format_accepte: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    taille_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    # Relations
    campagne: Mapped["CampagneInscription"] = relationship(
        "CampagneInscription", back_populates="types_pieces_requises"
    )

    __table_args__ = (
        UniqueConstraint("campagne_id", "type_piece", name="uq_campagne_type_piece"),
        Index("ix_types_pieces_requises_campagne_ordre", "campagne_id", "ordre"),
    )

    def __repr__(self) -> str:
        return f"<TypePieceRequise(id={self.id}, type_piece={self.type_piece}, campagne_id={self.campagne_id})>"
