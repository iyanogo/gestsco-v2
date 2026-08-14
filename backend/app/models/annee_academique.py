"""
Modèle pour l'année académique avec gestion des inscriptions, semestres et modules.
Conforme au système CAMES avec gestion LMD.
"""

from datetime import datetime, date
from typing import Optional, TYPE_CHECKING

from sqlalchemy import String, Boolean, Integer, Date, DateTime, Index, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.campagne_inscription import CampagneInscription
    from app.models.session_examen import SessionExamen
    from app.models.module_actif import ModuleActif
    from app.models.periode_comptable import PeriodeComptable


class AnneeAcademique(Base):
    """
    Modèle représentant une année académique.
    
    Une seule année peut être active (is_active=True) à la fois.
    Une seule année peut être l'année en cours (is_current=True) à la fois.
    
    Statuts possibles :
    - brouillon : Année créée mais pas encore ouverte
    - ouverte : Année ouverte, inscriptions possibles
    - en_cours : Année en cours, semestre 1 ou 2 actif
    - cloturee : Année clôturée, délibérations terminées
    - archivee : Année archivée
    """

    __tablename__ = "annees_academiques"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    libelle: Mapped[str] = mapped_column(String(100), nullable=False)
    date_debut: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin: Mapped[date] = mapped_column(Date, nullable=False)
    date_debut_inscriptions: Mapped[date] = mapped_column(Date, nullable=False)
    date_fin_inscriptions: Mapped[date] = mapped_column(Date, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_current: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Gestion des semestres
    semestre_actif: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1 ou 2
    date_debut_semestre1: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_fin_semestre1: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_debut_semestre2: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    date_fin_semestre2: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    # Statut et workflow
    statut: Mapped[str] = mapped_column(String(50), nullable=False, default="brouillon")
    
    # Reconduction
    annee_precedente_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("annees_academiques.id"), nullable=True
    )
    est_reconduite: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # Ouverture et clôture
    date_ouverture: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    date_cloture: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    ouverte_par: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    cloturee_par: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relations
    campagnes_inscription: Mapped[list["CampagneInscription"]] = relationship(
        "CampagneInscription", back_populates="annee_academique", lazy="dynamic"
    )
    sessions_examen: Mapped[list["SessionExamen"]] = relationship(
        "SessionExamen", back_populates="annee_academique", lazy="dynamic"
    )
    modules_actifs: Mapped[list["ModuleActif"]] = relationship(
        "ModuleActif", back_populates="annee_academique", lazy="dynamic"
    )
    periodes_comptables: Mapped[list["PeriodeComptable"]] = relationship(
        "PeriodeComptable", back_populates="annee_academique", lazy="dynamic"
    )
    annee_precedente = relationship(
        "AnneeAcademique", remote_side=[id], foreign_keys=[annee_precedente_id]
    )
    utilisateur_ouverture = relationship("User", foreign_keys=[ouverte_par])
    utilisateur_cloture = relationship("User", foreign_keys=[cloturee_par])

    __table_args__ = (
        Index("ix_annees_academiques_is_active", "is_active"),
        Index("ix_annees_academiques_is_current", "is_current"),
        Index("ix_annees_academiques_statut", "statut"),
    )

    def is_inscription_open(self) -> bool:
        """
        Vérifie si les inscriptions sont ouvertes pour cette année académique.
        
        Returns:
            True si les inscriptions sont ouvertes, False sinon
        """
        if not self.is_active:
            return False
        today = date.today()
        return self.date_debut_inscriptions <= today <= self.date_fin_inscriptions
    
    @property
    def est_brouillon(self) -> bool:
        """Retourne True si l'année est en brouillon."""
        return self.statut == "brouillon"
    
    @property
    def est_ouverte(self) -> bool:
        """Retourne True si l'année est ouverte."""
        return self.statut == "ouverte"
    
    @property
    def est_en_cours(self) -> bool:
        """Retourne True si l'année est en cours."""
        return self.statut == "en_cours"
    
    @property
    def est_cloturee(self) -> bool:
        """Retourne True si l'année est clôturée."""
        return self.statut == "cloturee"
    
    @property
    def est_archivee(self) -> bool:
        """Retourne True si l'année est archivée."""
        return self.statut == "archivee"
    
    def ouvrir(self, user_id: int) -> None:
        """Ouvre l'année académique."""
        self.statut = "ouverte"
        self.date_ouverture = datetime.utcnow()
        self.ouverte_par = user_id
        self.is_active = True
        self.semestre_actif = 1
    
    def demarrer(self) -> None:
        """Démarre l'année académique (passage en cours)."""
        self.statut = "en_cours"
        self.is_current = True
    
    def cloturer(self, user_id: int) -> None:
        """Clôture l'année académique."""
        self.statut = "cloturee"
        self.date_cloture = datetime.utcnow()
        self.cloturee_par = user_id
        self.is_current = False
    
    def archiver(self) -> None:
        """Archive l'année académique."""
        self.statut = "archivee"
        self.is_active = False
        self.is_current = False
    
    def passer_semestre2(self) -> None:
        """Passe au semestre 2."""
        self.semestre_actif = 2
    
    def get_dates_semestre(self, semestre: int) -> tuple[date | None, date | None]:
        """
        Retourne les dates de début et fin d'un semestre.
        
        Args:
            semestre: Numéro du semestre (1 ou 2)
            
        Returns:
            Tuple (date_debut, date_fin)
        """
        if semestre == 1:
            return self.date_debut_semestre1, self.date_fin_semestre1
        elif semestre == 2:
            return self.date_debut_semestre2, self.date_fin_semestre2
        return None, None

    def __repr__(self) -> str:
        return f"<AnneeAcademique(id={self.id}, code={self.code}, statut={self.statut})>"
