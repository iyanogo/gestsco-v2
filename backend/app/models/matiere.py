from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.module import Module


class Matiere(Base):
    """Modèle pour la table matiere existante."""
    __tablename__ = "matiere"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sigle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    annee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tpe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    va: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vcvh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    module_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("module.id"), nullable=True
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relations
    module: Mapped[Optional["Module"]] = relationship("Module", back_populates="matieres")

    def __repr__(self) -> str:
        return f"<Matiere(code={self.code}, libelle={self.libelle})>"
