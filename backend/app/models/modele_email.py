from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ModeleEmail(Base):
    __tablename__ = "modeles_email"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=True)
    code = Column(String(50), unique=True, nullable=False)  # BIENVENUE, FACTURE, PAIEMENT, RESULTAT, CONVOCATION, etc.
    libelle = Column(String(255), nullable=False)
    type_destinataire = Column(String(50), nullable=False)  # etudiant, enseignant, parent, personnel
    objet = Column(String(500), nullable=False)  # peut contenir des variables
    corps_html = Column(Text, nullable=False)  # template HTML avec variables
    corps_texte = Column(Text, nullable=True)  # version texte
    variables_disponibles = Column(Text, nullable=True)  # JSON array
    pieces_jointes_auto = Column(Text, nullable=True)  # JSON array des documents à joindre
    est_systeme_defaut = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement")

    def __repr__(self):
        return f"<ModeleEmail {self.code}: {self.libelle}>"
