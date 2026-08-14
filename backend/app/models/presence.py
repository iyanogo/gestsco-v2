"""
Modèle SQLAlchemy pour les présences aux séances
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Time, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.database import Base


class Presence(Base):
    """Modèle représentant la présence d'un étudiant à une séance"""
    
    __tablename__ = "presences"

    id = Column(Integer, primary_key=True, index=True)
    seance_id = Column(Integer, ForeignKey("seances.id"), nullable=False, index=True)
    etudiant_id = Column(Integer, ForeignKey("etudiant.id"), nullable=False, index=True)
    statut = Column(String(50), nullable=False, default="absent")  # present, absent, retard, absent_justifie
    heure_arrivee = Column(Time, nullable=True)
    justificatif_url = Column(String(500), nullable=True)
    observation = Column(Text, nullable=True)
    saisie_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_saisie = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    seance = relationship("Seance", back_populates="presences")
    etudiant = relationship("Etudiant")
    saisie_utilisateur = relationship("User", foreign_keys=[saisie_par])

    # Contrainte unique : un étudiant ne peut avoir qu'une présence par séance
    __table_args__ = (
        UniqueConstraint('seance_id', 'etudiant_id', name='uq_presence_seance_etudiant'),
    )

    def __repr__(self):
        return f"<Presence(id={self.id}, seance_id={self.seance_id}, etudiant_id={self.etudiant_id}, statut='{self.statut}')>"
