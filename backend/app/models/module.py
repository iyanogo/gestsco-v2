from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import BigInteger, DateTime, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.matiere import Matiere


class Module(Base):
    """Modèle pour la table module existante."""
    __tablename__ = "module"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sigle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    vol_horaire: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    annee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tpe: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    va: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vcvh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    coordinateur_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    semestre_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    filiere_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("filiere.id"), nullable=True
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relations
    matieres: Mapped[List["Matiere"]] = relationship("Matiere", back_populates="module")

    def __repr__(self) -> str:
        return f"<Module(code={self.code}, libelle={self.libelle})>"
