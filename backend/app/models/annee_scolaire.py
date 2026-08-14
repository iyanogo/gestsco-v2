"""
Modèle pour l'année scolaire
"""

from typing import Optional
from datetime import datetime
from sqlalchemy import String, Boolean, BigInteger, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Annee(Base):
    """Modèle représentant une année scolaire."""

    __tablename__ = "annee"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    statut: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    etat: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    lier_enseignement: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Annee(id={self.id}, code={self.code}, libelle={self.libelle}, statut={self.statut})>"
