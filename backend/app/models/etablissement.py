from datetime import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.departement import Departement
    from app.models.universite import Universite
    from app.models.batiment import Batiment
    from app.models.configuration_etablissement import ConfigurationEtablissement


class Etablissement(Base):
    """Modèle pour la table etablissement existante."""
    __tablename__ = "etablissement"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    nom: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sigle: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    ville: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    adresse: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telephone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fixe: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    universite_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("universite.id"), nullable=True
    )
    nom_directeur: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    prenom_directeur: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    tel_directeur: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relations
    universite: Mapped[Optional["Universite"]] = relationship(
        "Universite", back_populates="etablissements"
    )
    departements: Mapped[List["Departement"]] = relationship(
        "Departement", back_populates="etablissement"
    )
    batiments: Mapped[List["Batiment"]] = relationship(
        "Batiment", back_populates="etablissement"
    )
    configurations: Mapped[List["ConfigurationEtablissement"]] = relationship(
        "ConfigurationEtablissement", back_populates="etablissement"
    )

    @property
    def libelle(self) -> Optional[str]:
        """Alias pour compatibilité avec le frontend."""
        return self.nom

    def __repr__(self) -> str:
        return f"<Etablissement(code={self.code}, nom={self.nom})>"
