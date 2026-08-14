from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Numeric, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class TypeFrais(Base):
    __tablename__ = "types_frais"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    libelle = Column(String(255), nullable=False)
    categorie = Column(String(100), nullable=False)  # inscription, scolarite, examen, bibliotheque, sport, autre
    montant_defaut = Column(Numeric(10, 2), nullable=True)
    est_obligatoire = Column(Boolean, default=True)
    est_recurrent = Column(Boolean, default=False)
    periode_application = Column(String(50), nullable=True)  # annuel, semestriel, mensuel
    description = Column(Text, nullable=True)
    compte_comptable = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    frais_scolarite = relationship("FraisScolarite", back_populates="type_frais")
    remises = relationship("Remise", back_populates="type_frais")
