from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Remise(Base):
    __tablename__ = "remises"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    type_remise = Column(String(50), nullable=False)  # pourcentage, montant_fixe
    valeur = Column(Numeric(10, 2), nullable=False)
    type_frais_id = Column(Integer, ForeignKey("types_frais.id"), nullable=True)
    conditions = Column(Text, nullable=True)
    date_debut = Column(Date, nullable=False)
    date_fin = Column(Date, nullable=False)
    nombre_utilisations_max = Column(Integer, nullable=True)
    nombre_utilisations = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    type_frais = relationship("TypeFrais", back_populates="remises")
    attributions = relationship("RemiseEtudiant", back_populates="remise")

    def peut_etre_utilisee(self) -> bool:
        """Vérifie si la remise peut encore être utilisée"""
        if not self.is_active:
            return False
        if self.nombre_utilisations_max and self.nombre_utilisations >= self.nombre_utilisations_max:
            return False
        from datetime import date
        today = date.today()
        return self.date_debut <= today <= self.date_fin
