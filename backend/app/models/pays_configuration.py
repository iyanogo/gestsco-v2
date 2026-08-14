from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric

from app.core.database import Base


class PaysConfiguration(Base):
    __tablename__ = "pays_configurations"

    id = Column(Integer, primary_key=True, index=True)
    code_pays = Column(String(3), unique=True, nullable=False)  # ISO 3166-1 alpha-3: BFA, CIV, SEN, etc.
    nom_pays = Column(String(255), nullable=False)
    nom_pays_en = Column(String(255), nullable=True)
    continent = Column(String(50), nullable=False, default="Afrique")
    region = Column(String(100), nullable=True)  # Afrique de l'Ouest, etc.
    
    # Paramètres académiques
    systeme_educatif = Column(String(50), nullable=False)  # LMD, Anglo-Saxon, Autre
    organisme_regulation = Column(String(255), nullable=True)  # CAMES, CEDEAO, etc.
    langue_officielle = Column(String(50), nullable=False)
    langues_secondaires = Column(Text, nullable=True)  # JSON array
    
    # Paramètres financiers
    devise_officielle = Column(String(10), nullable=False)
    symbole_devise = Column(String(10), nullable=True)
    format_montant = Column(String(50), nullable=True)
    
    # Paramètres administratifs
    format_telephone = Column(String(50), nullable=True)  # regex
    format_code_postal = Column(String(50), nullable=True)
    format_matricule = Column(String(100), nullable=True)
    
    # Paramètres de notation
    systeme_notation_defaut = Column(String(50), nullable=False, default="20")
    note_min_defaut = Column(Numeric(5, 2), default=0)
    note_max_defaut = Column(Numeric(5, 2), default=20)
    
    # Paramètres temporels
    fuseau_horaire = Column(String(50), nullable=False)
    format_date_defaut = Column(String(50), nullable=False, default="DD/MM/YYYY")
    debut_annee_academique = Column(String(5), nullable=False, default="10-01")  # MM-DD
    fin_annee_academique = Column(String(5), nullable=False, default="09-30")
    
    # Jours fériés
    jours_feries = Column(Text, nullable=True)  # JSON array
    
    # Autres
    indicatif_telephonique = Column(String(10), nullable=True)
    drapeau_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<PaysConfiguration {self.code_pays}: {self.nom_pays}>"
