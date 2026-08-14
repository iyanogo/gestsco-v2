from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.configuration_etablissement import ConfigurationEtablissement
from app.schemas.configuration_etablissement import (
    ConfigurationEtablissementCreate,
    ConfigurationEtablissementUpdate
)


class ConfigurationEtablissementRepository:
    
    @staticmethod
    def get_by_id(db: Session, config_id: int) -> Optional[ConfigurationEtablissement]:
        return db.query(ConfigurationEtablissement).filter(
            ConfigurationEtablissement.id == config_id
        ).first()
    
    @staticmethod
    def get_by_etablissement(db: Session, etablissement_id: int) -> Optional[ConfigurationEtablissement]:
        return db.query(ConfigurationEtablissement).filter(
            ConfigurationEtablissement.etablissement_id == etablissement_id
        ).first()
    
    @staticmethod
    def get_active(db: Session, etablissement_id: int) -> Optional[ConfigurationEtablissement]:
        return db.query(ConfigurationEtablissement).filter(
            ConfigurationEtablissement.etablissement_id == etablissement_id,
            ConfigurationEtablissement.is_active == True
        ).first()
    
    @staticmethod
    def get_all(db: Session) -> List[ConfigurationEtablissement]:
        return db.query(ConfigurationEtablissement).filter(
            ConfigurationEtablissement.is_active == True
        ).all()
    
    @staticmethod
    def get_or_create_default(db: Session, etablissement_id: int, nom_etablissement: str = "Établissement") -> ConfigurationEtablissement:
        """Récupère ou crée une configuration par défaut"""
        config = ConfigurationEtablissementRepository.get_by_etablissement(db, etablissement_id)
        if config:
            return config
        
        # Créer une configuration par défaut
        config = ConfigurationEtablissement(
            etablissement_id=etablissement_id,
            nom_complet=nom_etablissement,
            nom_court=nom_etablissement,
            pays="Burkina Faso",
            systeme_notation="LMD",
            referentiel="CAMES",
            langue_enseignement="Français",
            devise="XOF",
            note_minimale=0,
            note_maximale=20,
            note_passage=10,
            precision_notes=2,
            taux_presence_minimum=75,
            fuseau_horaire="Africa/Ouagadougou",
            format_date="DD/MM/YYYY",
            format_heure="HH:mm",
            couleur_primaire="#1976d2",
            couleur_secondaire="#dc004e",
            theme="light"
        )
        db.add(config)
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def create(db: Session, config_in: ConfigurationEtablissementCreate) -> ConfigurationEtablissement:
        config = ConfigurationEtablissement(**config_in.model_dump())
        db.add(config)
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def update(db: Session, config: ConfigurationEtablissement, config_in: ConfigurationEtablissementUpdate) -> ConfigurationEtablissement:
        update_data = config_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(config, field, value)
        db.commit()
        db.refresh(config)
        return config
    
    @staticmethod
    def update_logo(db: Session, config_id: int, logo_url: str) -> Optional[ConfigurationEtablissement]:
        config = ConfigurationEtablissementRepository.get_by_id(db, config_id)
        if config:
            config.logo_url = logo_url
            db.commit()
            db.refresh(config)
        return config
    
    @staticmethod
    def update_banniere(db: Session, config_id: int, banniere_url: str) -> Optional[ConfigurationEtablissement]:
        config = ConfigurationEtablissementRepository.get_by_id(db, config_id)
        if config:
            config.banniere_url = banniere_url
            db.commit()
            db.refresh(config)
        return config
    
    @staticmethod
    def update_couleurs(db: Session, config_id: int, primaire: str, secondaire: str) -> Optional[ConfigurationEtablissement]:
        config = ConfigurationEtablissementRepository.get_by_id(db, config_id)
        if config:
            config.couleur_primaire = primaire
            config.couleur_secondaire = secondaire
            db.commit()
            db.refresh(config)
        return config
    
    @staticmethod
    def delete(db: Session, config_id: int) -> bool:
        config = ConfigurationEtablissementRepository.get_by_id(db, config_id)
        if config:
            db.delete(config)
            db.commit()
            return True
        return False


configuration_etablissement_repository = ConfigurationEtablissementRepository()
