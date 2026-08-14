from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Filiere(Base):
    """Modèle pour la table filiere existante."""
    __tablename__ = "filiere"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sigle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    annee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    etabissement_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    etablissement_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("etablissement.id"), nullable=True
    )
    coordonateur_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    coordinateur_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<Filiere(code={self.code}, libelle={self.libelle})>"
