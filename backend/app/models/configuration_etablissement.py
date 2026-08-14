from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class ConfigurationEtablissement(Base):
    __tablename__ = "configurations_etablissement"

    id = Column(Integer, primary_key=True, index=True)
    etablissement_id = Column(Integer, ForeignKey("etablissement.id"), nullable=False)
    annee_academique_id = Column(Integer, ForeignKey("annees_academiques.id"), nullable=True)
    
    # Informations générales
    nom_complet = Column(String(500), nullable=False)
    nom_court = Column(String(255), nullable=False)
    sigle = Column(String(50), nullable=True)
    slogan = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    banniere_url = Column(String(500), nullable=True)
    
    # Coordonnées
    adresse_complete = Column(Text, nullable=True)
    ville = Column(String(100), nullable=True)
    code_postal = Column(String(20), nullable=True)
    pays = Column(String(100), nullable=False, default="Burkina Faso")
    telephone_principal = Column(String(50), nullable=True)
    telephone_secondaire = Column(String(50), nullable=True)
    email_principal = Column(String(255), nullable=True)
    email_scolarite = Column(String(255), nullable=True)
    site_web = Column(String(255), nullable=True)
    
    # Réseaux sociaux
    facebook_url = Column(String(255), nullable=True)
    twitter_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    
    # Paramètres académiques
    systeme_notation = Column(String(50), nullable=False, default="LMD")  # LMD, Classique, Autre
    referentiel = Column(String(50), nullable=False, default="CAMES")  # CAMES, National, Autre
    langue_enseignement = Column(String(50), nullable=False, default="Français")
    langues_secondaires = Column(Text, nullable=True)  # JSON array
    
    # Paramètres financiers
    devise = Column(String(10), nullable=False, default="XOF")
    tva_applicable = Column(Boolean, default=False)
    tva_taux_defaut = Column(Numeric(5, 2), nullable=True)
    
    # Paramètres de notation
    note_minimale = Column(Numeric(5, 2), nullable=False, default=0)
    note_maximale = Column(Numeric(5, 2), nullable=False, default=20)
    note_passage = Column(Numeric(5, 2), nullable=False, default=10)
    precision_notes = Column(Integer, nullable=False, default=2)  # nombre de décimales
    
    # Paramètres de présence
    taux_presence_minimum = Column(Numeric(5, 2), nullable=False, default=75)  # en %
    sanction_absence = Column(String(100), nullable=True)
    
    # Paramètres d'inscription
    inscription_en_ligne_active = Column(Boolean, default=True)
    validation_manuelle_dossiers = Column(Boolean, default=True)
    pieces_obligatoires = Column(Text, nullable=True)  # JSON array
    
    # Paramètres de communication
    email_expediteur_nom = Column(String(255), nullable=True)
    email_expediteur_adresse = Column(String(255), nullable=True)
    sms_actif = Column(Boolean, default=False)
    sms_expediteur = Column(String(50), nullable=True)
    
    # Paramètres d'affichage
    couleur_primaire = Column(String(7), nullable=True, default="#1976d2")
    couleur_secondaire = Column(String(7), nullable=True, default="#dc004e")
    theme = Column(String(20), nullable=False, default="light")  # light, dark
    
    # Autres
    fuseau_horaire = Column(String(50), nullable=False, default="Africa/Ouagadougou")
    format_date = Column(String(50), nullable=False, default="DD/MM/YYYY")
    format_heure = Column(String(50), nullable=False, default="HH:mm")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    etablissement = relationship("Etablissement", back_populates="configurations")
    annee_academique = relationship("AnneeAcademique")

    def __repr__(self):
        return f"<ConfigurationEtablissement {self.nom_court}>"
