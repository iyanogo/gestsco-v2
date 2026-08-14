"""
Modèle pour les campagnes d'inscription
"""

from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Float, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship, Session

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.annee_academique import AnneeAcademique
    from app.models.cycle import Cycle
    from app.models.dossier_candidature import DossierCandidature


class CampagneInscription(Base):
    """
    Modèle représentant une campagne d'inscription.
    
    Une campagne est liée à une année académique et un cycle.
    Elle définit les dates, frais et conditions d'inscription.
    """

    __tablename__ = "campagnes_inscription"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    libelle: Mapped[str] = mapped_column(String(255), nullable=False)
    annee_academique_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("annees_academiques.id"), nullable=False, index=True
    )
    cycle_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("cycle.id"), nullable=False, index=True
    )
    date_ouverture: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_cloture: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    date_limite_paiement: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    frais_inscription: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    frais_dossier: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    nombre_places: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    statut: Mapped[str] = mapped_column(
        String(50), nullable=False, default="brouillon", index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    annee_academique: Mapped["AnneeAcademique"] = relationship(
        "AnneeAcademique", back_populates="campagnes_inscription"
    )
    cycle: Mapped["Cycle"] = relationship("Cycle", lazy="joined")
    dossiers: Mapped[list["DossierCandidature"]] = relationship(
        "DossierCandidature", back_populates="campagne", lazy="dynamic"
    )
    types_pieces_requises: Mapped[list["TypePieceRequise"]] = relationship(
        "TypePieceRequise", back_populates="campagne", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_campagnes_inscription_statut_active", "statut", "is_active"),
    )

    def is_open(self) -> bool:
        """
        Vérifie si la campagne est ouverte aux inscriptions.
        
        Returns:
            True si la campagne est ouverte, False sinon
        """
        if self.statut != "ouverte" or not self.is_active:
            return False
        now = datetime.utcnow()
        return self.date_ouverture <= now <= self.date_cloture

    def places_disponibles(self, db: Session) -> Optional[int]:
        """
        Calcule le nombre de places disponibles.
        
        Args:
            db: Session de base de données
            
        Returns:
            Nombre de places restantes ou None si pas de quota
        """
        if self.nombre_places is None:
            return None
        
        from app.models.dossier_candidature import DossierCandidature
        
        dossiers_admis = db.query(DossierCandidature).filter(
            DossierCandidature.campagne_id == self.id,
            DossierCandidature.statut_dossier == "admis"
        ).count()
        
        return max(0, self.nombre_places - dossiers_admis)

    def __repr__(self) -> str:
        return f"<CampagneInscription(id={self.id}, code={self.code}, statut={self.statut})>"


# Import pour éviter les références circulaires
from app.models.type_piece_requise import TypePieceRequise
