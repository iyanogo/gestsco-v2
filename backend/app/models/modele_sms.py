from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ModeleSMS(Base):
    __tablename__ = "modeles_sms"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)
    libelle = Column(String(255), nullable=False)
    type_destinataire = Column(String(50), nullable=False)  # etudiant, enseignant, parent, personnel
    message = Column(Text, nullable=False)  # max 160 caractères, peut contenir variables
    variables_disponibles = Column(Text, nullable=True)  # JSON array
    est_systeme_defaut = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement")

    def __repr__(self):
        return f"<ModeleSMS {self.code}: {self.libelle}>"
