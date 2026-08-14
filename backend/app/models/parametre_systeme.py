from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class ParametreSysteme(Base):
    __tablename__ = "parametres_systeme"

    id = Column(Integer, primary_key=True, index=True)
    categorie = Column(String(100), nullable=False, index=True)  # general, academique, financier, notation, inscription, communication
    cle = Column(String(255), unique=True, nullable=False, index=True)  # ex: "nom_etablissement", "devise", "note_max"
    valeur = Column(Text, nullable=False)  # stockage JSON si complexe
    type_valeur = Column(String(50), nullable=False)  # string, integer, float, boolean, json, date
    libelle = Column(String(255), nullable=False)  # nom affiché
    description = Column(Text, nullable=True)  # explication du paramètre
    unite = Column(String(50), nullable=True)  # %, XOF, heures, etc.
    valeur_defaut = Column(Text, nullable=True)
    est_modifiable = Column(Boolean, default=True)  # certains paramètres système non modifiables
    est_visible = Column(Boolean, default=True)
    ordre_affichage = Column(Integer, default=0)
    modifie_par = Column(Integer, ForeignKey("users.id"), nullable=True)
    date_modification = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    modificateur = relationship("User", foreign_keys=[modifie_par])

    def __repr__(self):
        return f"<ParametreSysteme {self.cle}={self.valeur}>"
