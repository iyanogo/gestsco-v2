"""
Modèle SQLAlchemy pour les emplois du temps
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class EmploiTemps(Base):
    """Modèle représentant un emploi du temps pour un niveau/filière"""
    
    __tablename__ = "emplois_temps"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    niveau_id = Column(Integer, ForeignKey("niveau.id"), nullable=False)
    filiere_id = Column(Integer, ForeignKey("filiere.id"), nullable=True)
    semestre = Column(Integer, nullable=False)  # 1 ou 2
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=False)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    statut = Column(String(50), nullable=False, default="brouillon")  # brouillon, valide, publie, archive
    version = Column(Integer, nullable=False, default=1)
    publie_le = Column(DateTime, nullable=True)
    publie_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    observations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    niveau = relationship("Niveau")
    filiere = relationship("Filiere")
    annee_academique = relationship("AnneeAcademique")
    publieur = relationship("User", foreign_keys=[publie_par])

    # Contrainte unique pour éviter les doublons
    __table_args__ = (
        UniqueConstraint('niveau_id', 'filiere_id', 'semestre', 'annee_academique_id', 'version', 
                        name='uq_emploi_temps_niveau_filiere_semestre_annee_version'),
    )

    def __repr__(self):
        return f"<EmploiTemps(id={self.id}, code='{self.code}', niveau_id={self.niveau_id}, semestre={self.semestre})>"
