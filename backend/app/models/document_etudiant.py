"""
Modèle pour les documents des étudiants
"""

from datetime import date, datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Date, DateTime, BigInteger, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.etudiant import Etudiant


class DocumentEtudiant(Base):
    """Modèle représentant un document d'étudiant."""

    __tablename__ = "documents_etudiant"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    etudiant_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("etudiant.id"), nullable=False, index=True)
    
    # Informations du document
    type_document: Mapped[str] = mapped_column(String(100), nullable=False)
    libelle: Mapped[str] = mapped_column(String(255), nullable=False)
    numero_document: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    date_delivrance: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    lieu_delivrance: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Fichier
    fichier_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    format_fichier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    taille_fichier: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    # Statut et commentaire
    statut: Mapped[str] = mapped_column(String(50), nullable=False, default="en_attente")
    commentaire: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Audit
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etudiant: Mapped["Etudiant"] = relationship("Etudiant", back_populates="documents")

    def __repr__(self) -> str:
        return f"<DocumentEtudiant(id={self.id}, type={self.type_document}, etudiant_id={self.etudiant_id})>"
