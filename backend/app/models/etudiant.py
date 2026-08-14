"""
Modèle pour l'entité Étudiant
"""

from datetime import date, datetime
from typing import Optional, List, TYPE_CHECKING

from sqlalchemy import String, Boolean, Date, DateTime, BigInteger, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.document_etudiant import DocumentEtudiant
    from app.models.inscription import Inscription
    from app.models.inscrit import Inscrit
    from app.models.stage import Stage


class Etudiant(Base):
    """Modèle représentant un étudiant."""

    __tablename__ = "etudiant"

    # Champs d'identification
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, index=True, autoincrement=True)
    matricule: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    numero_carte: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    ine: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    cni: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Informations personnelles
    nom: Mapped[str] = mapped_column(String(255), nullable=False)
    prenom: Mapped[str] = mapped_column(String(255), nullable=False)
    date_naissance: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    lieu_naissance: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    sexe: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    nationalite: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Contacts
    email: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    telephone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    telephone_urgence: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    adresse: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    ville: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    pays: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, default="Burkina Faso")

    # Informations familiales
    nom_pere: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    profession_pere: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    nom_mere: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    profession_mere: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    personne_contact: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    telephone_contact: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Informations académiques (existantes)
    annee_bac: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    numero_bac: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mention: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    diplome: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    boursier: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

    # Statut
    statut: Mapped[Optional[str]] = mapped_column(String(50), nullable=True, default="actif")
    is_active: Mapped[Optional[bool]] = mapped_column(Boolean, default=True, nullable=True)

    # Audit (existants)
    created_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)
    last_modified_by: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    last_modified_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Référence d'importation
    importation_id: Mapped[Optional[int]] = mapped_column(BigInteger, nullable=True)

    # Relations
    documents: Mapped[List["DocumentEtudiant"]] = relationship(
        "DocumentEtudiant",
        back_populates="etudiant",
        cascade="all, delete-orphan"
    )
    inscriptions: Mapped[List["Inscription"]] = relationship(
        "Inscription",
        back_populates="etudiant",
        cascade="all, delete-orphan"
    )
    inscrits: Mapped[List["Inscrit"]] = relationship(
        "Inscrit",
        back_populates="etudiant",
        lazy="selectin"
    )
    stages: Mapped[List["Stage"]] = relationship(
        "Stage",
        back_populates="etudiant",
        lazy="selectin"
    )

    def get_full_name(self) -> str:
        """Retourne le nom complet de l'étudiant."""
        return f"{self.prenom} {self.nom}"

    def get_age(self) -> Optional[int]:
        """Calcule l'âge de l'étudiant depuis sa date de naissance."""
        if not self.date_naissance:
            return None
        try:
            # Gérer le cas où date_naissance est une chaîne
            if isinstance(self.date_naissance, str):
                birth_date = datetime.strptime(self.date_naissance, "%Y-%m-%d").date()
            else:
                birth_date = self.date_naissance
            today = date.today()
            age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
            return age
        except (ValueError, TypeError):
            return None

    def __repr__(self) -> str:
        return f"<Etudiant(id={self.id}, matricule={self.matricule}, nom={self.nom}, prenom={self.prenom})>"


# Index pour les recherches fréquentes
Index("idx_etudiant_nom_prenom", Etudiant.nom, Etudiant.prenom)
