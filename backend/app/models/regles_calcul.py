from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class RegleCalcul(Base):
    __tablename__ = "regles_calcul"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("cycle.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    libelle = Column(String(255), nullable=False)
    type_regle = Column(String(50), nullable=False)  # moyenne_matiere, moyenne_semestre, moyenne_annuelle, validation_credits, compensation, deliberation
    description = Column(Text, nullable=True)
    formule = Column(Text, nullable=False)  # expression mathématique ou JSON des règles
    conditions = Column(Text, nullable=True)  # JSON des conditions d'application
    ordre_execution = Column(Integer, default=0)
    est_systeme_defaut = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement")
    cycle = relationship("Cycle")

    def __repr__(self):
        return f"<RegleCalcul {self.code}: {self.libelle}>"
