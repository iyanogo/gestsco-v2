from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, String, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Niveau(Base):
    """Modèle pour la table niveau existante."""
    __tablename__ = "niveau"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    libelle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Référence au semestre LMD
    semestre_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("semestres.id"), nullable=True)
    
    # Relations
    semestre = relationship("Semestre", back_populates="niveaux")
    
    def __repr__(self) -> str:
        return f"<Niveau(code={self.code}, libelle={self.libelle})>"
