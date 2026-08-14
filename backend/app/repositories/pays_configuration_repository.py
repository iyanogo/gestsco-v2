from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.pays_configuration import PaysConfiguration
from app.schemas.pays_configuration import PaysConfigurationCreate, PaysConfigurationUpdate


class PaysConfigurationRepository:
    
    @staticmethod
    def get_by_id(db: Session, pays_id: int) -> Optional[PaysConfiguration]:
        return db.query(PaysConfiguration).filter(PaysConfiguration.id == pays_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code_pays: str) -> Optional[PaysConfiguration]:
        return db.query(PaysConfiguration).filter(
            PaysConfiguration.code_pays == code_pays
        ).first()
    
    @staticmethod
    def get_all_actifs(db: Session) -> List[PaysConfiguration]:
        return db.query(PaysConfiguration).filter(
            PaysConfiguration.is_active == True
        ).order_by(PaysConfiguration.nom_pays).all()
    
    @staticmethod
    def get_by_region(db: Session, region: str) -> List[PaysConfiguration]:
        return db.query(PaysConfiguration).filter(
            PaysConfiguration.region == region,
            PaysConfiguration.is_active == True
        ).order_by(PaysConfiguration.nom_pays).all()
    
    @staticmethod
    def get_by_continent(db: Session, continent: str) -> List[PaysConfiguration]:
        return db.query(PaysConfiguration).filter(
            PaysConfiguration.continent == continent,
            PaysConfiguration.is_active == True
        ).order_by(PaysConfiguration.nom_pays).all()
    
    @staticmethod
    def create(db: Session, pays_in: PaysConfigurationCreate) -> PaysConfiguration:
        pays = PaysConfiguration(**pays_in.model_dump())
        db.add(pays)
        db.commit()
        db.refresh(pays)
        return pays
    
    @staticmethod
    def update(db: Session, pays: PaysConfiguration, pays_in: PaysConfigurationUpdate) -> PaysConfiguration:
        update_data = pays_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(pays, field, value)
        db.commit()
        db.refresh(pays)
        return pays
    
    @staticmethod
    def delete(db: Session, pays_id: int) -> bool:
        pays = PaysConfigurationRepository.get_by_id(db, pays_id)
        if pays:
            db.delete(pays)
            db.commit()
            return True
        return False


pays_configuration_repository = PaysConfigurationRepository()
