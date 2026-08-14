from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.etablissement import Etablissement


class Departement(Base):
    """Modèle pour la table departement existante."""
    __tablename__ = "departement"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sigle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    etablissement_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("etablissement.id"), nullable=True
    )
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relations
    etablissement: Mapped[Optional["Etablissement"]] = relationship(
        "Etablissement", back_populates="departements"
    )

    def __repr__(self) -> str:
        return f"<Departement(code={self.code}, libelle={self.libelle})>"
