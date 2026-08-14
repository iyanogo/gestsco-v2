"""
Modèle pour les dossiers de candidature
"""

from datetime import datetime, date
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Integer, Float, Text, Date, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.campagne_inscription import CampagneInscription
    from app.models.etudiant import Etudiant
    from app.models.filiere import Filiere
    from app.models.piece_jointe import PieceJointe
    from app.models.paiement import Paiement


class DossierCandidature(Base):
    """
    Modèle représentant un dossier de candidature.
    
    Contient toutes les informations du candidat et le suivi de son dossier.
    """

    __tablename__ = "dossiers_candidature"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    numero_dossier: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    campagne_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("campagnes_inscription.id"), nullable=False, index=True
    )
    etudiant_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("etudiant.id"), nullable=True, index=True
    )
    
    # Informations du candidat
    candidat_nom: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    candidat_prenom: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    candidat_email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    candidat_telephone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    candidat_date_naissance: Mapped[date] = mapped_column(Date, nullable=False)
    candidat_lieu_naissance: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    candidat_sexe: Mapped[str] = mapped_column(String(1), nullable=False)
    candidat_nationalite: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    candidat_adresse: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # Choix de filières
    filiere_souhaitee_1: Mapped[int] = mapped_column(
        Integer, ForeignKey("filiere.id"), nullable=False
    )
    filiere_souhaitee_2: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("filiere.id"), nullable=True
    )
    filiere_souhaitee_3: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("filiere.id"), nullable=True
    )
    
    # Parcours académique
    diplome_precedent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    etablissement_precedent: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    annee_obtention_diplome: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    moyenne_generale: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Statut et validation
    statut_dossier: Mapped[str] = mapped_column(
        String(50), nullable=False, default="en_cours", index=True
    )
    date_soumission: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    date_validation: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    commentaire_validation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    filiere_admise: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("filiere.id"), nullable=True
    )
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    campagne: Mapped["CampagneInscription"] = relationship(
        "CampagneInscription", back_populates="dossiers"
    )
    etudiant: Mapped[Optional["Etudiant"]] = relationship("Etudiant", lazy="joined")
    filiere_1: Mapped["Filiere"] = relationship(
        "Filiere", foreign_keys=[filiere_souhaitee_1], lazy="joined"
    )
    filiere_2: Mapped[Optional["Filiere"]] = relationship(
        "Filiere", foreign_keys=[filiere_souhaitee_2], lazy="joined"
    )
    filiere_3: Mapped[Optional["Filiere"]] = relationship(
        "Filiere", foreign_keys=[filiere_souhaitee_3], lazy="joined"
    )
    filiere_admission: Mapped[Optional["Filiere"]] = relationship(
        "Filiere", foreign_keys=[filiere_admise], lazy="joined"
    )
    pieces_jointes: Mapped[list["PieceJointe"]] = relationship(
        "PieceJointe", back_populates="dossier", lazy="selectin", cascade="all, delete-orphan"
    )
    paiements: Mapped[list["Paiement"]] = relationship(
        "Paiement", back_populates="dossier", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_dossiers_candidature_campagne_statut", "campagne_id", "statut_dossier"),
        Index("ix_dossiers_candidature_email", "candidat_email"),
    )

    def is_complet(self) -> bool:
        """
        Vérifie si toutes les pièces requises sont fournies.
        
        Returns:
            True si le dossier est complet, False sinon
        """
        if not self.campagne:
            return False
        
        types_requis = {
            tp.type_piece for tp in self.campagne.types_pieces_requises if tp.is_required
        }
        types_fournis = {pj.type_piece for pj in self.pieces_jointes if pj.is_valide}
        
        return types_requis.issubset(types_fournis)

    def __repr__(self) -> str:
        return f"<DossierCandidature(id={self.id}, numero={self.numero_dossier}, statut={self.statut_dossier})>"
