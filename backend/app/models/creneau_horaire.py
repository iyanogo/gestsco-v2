"""
Modèle SQLAlchemy pour les créneaux horaires
"""
from datetime import datetime, time
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Time
from sqlalchemy.orm import relationship

from app.core.database import Base


class CreneauHoraire(Base):
    """Modèle représentant un créneau horaire (ex: 08h-10h)"""
    
    __tablename__ = "creneaux_horaires"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), unique=True, nullable=False, index=True)  # ex: "M1", "M2", "S1", "S2"
    libelle = Column(String(100), nullable=False)  # ex: "Matin 1 : 08h-10h"
    heure_debut = Column(Time, nullable=False)
    heure_fin = Column(Time, nullable=False)
    periode = Column(String(20), nullable=False)  # matin, apres_midi, soir
    ordre = Column(Integer, nullable=False, default=1)
    duree_minutes = Column(Integer, nullable=False)  # calculé automatiquement
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    seances = relationship("Seance", back_populates="creneau")

    def calculer_duree(self) -> int:
        """Calcule la durée en minutes entre heure_debut et heure_fin"""
        if self.heure_debut and self.heure_fin:
            debut = datetime.combine(datetime.today(), self.heure_debut)
            fin = datetime.combine(datetime.today(), self.heure_fin)
            delta = fin - debut
            return int(delta.total_seconds() / 60)
        return 0

    def __repr__(self):
        return f"<CreneauHoraire(id={self.id}, code='{self.code}', libelle='{self.libelle}')>"
