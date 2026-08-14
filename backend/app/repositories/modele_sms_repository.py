import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.modele_sms import ModeleSMS
from app.schemas.modele_sms import ModeleSMSCreate, ModeleSMSUpdate


class ModeleSMSRepository:
    
    @staticmethod
    def get_by_id(db: Session, modele_id: int) -> Optional[ModeleSMS]:
        return db.query(ModeleSMS).filter(ModeleSMS.id == modele_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str, etablissement_id: Optional[int] = None) -> Optional[ModeleSMS]:
        """Récupère un modèle par code, priorité à l'établissement spécifique"""
        if etablissement_id:
            modele = db.query(ModeleSMS).filter(
                ModeleSMS.code == code,
                ModeleSMS.etablissement_id == etablissement_id,
                ModeleSMS.is_active == True
            ).first()
            if modele:
                return modele
        
        # Fallback sur le modèle système par défaut
        return db.query(ModeleSMS).filter(
            ModeleSMS.code == code,
            ModeleSMS.etablissement_id == None,
            ModeleSMS.is_active == True
        ).first()
    
    @staticmethod
    def get_by_type_destinataire(db: Session, type_destinataire: str) -> List[ModeleSMS]:
        return db.query(ModeleSMS).filter(
            ModeleSMS.type_destinataire == type_destinataire,
            ModeleSMS.is_active == True
        ).all()
    
    @staticmethod
    def get_all(db: Session, etablissement_id: Optional[int] = None) -> List[ModeleSMS]:
        query = db.query(ModeleSMS).filter(ModeleSMS.is_active == True)
        if etablissement_id:
            query = query.filter(
                (ModeleSMS.etablissement_id == etablissement_id) |
                (ModeleSMS.etablissement_id == None)
            )
        return query.order_by(ModeleSMS.type_destinataire, ModeleSMS.code).all()
    
    @staticmethod
    def render_sms(db: Session, modele_id: int, variables: Dict[str, Any]) -> Dict[str, Any]:
        """Retourne {message, longueur} avec variables remplacées"""
        modele = ModeleSMSRepository.get_by_id(db, modele_id)
        if not modele:
            return {"message": "", "longueur": 0}
        
        def replace_var(match):
            var_name = match.group(1).strip()
            return str(variables.get(var_name, f"{{{{ {var_name} }}}}"))
        
        message = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, modele.message)
        
        return {
            "message": message,
            "longueur": len(message)
        }
    
    @staticmethod
    def create(db: Session, modele_in: ModeleSMSCreate) -> ModeleSMS:
        modele = ModeleSMS(**modele_in.model_dump())
        db.add(modele)
        db.commit()
        db.refresh(modele)
        return modele
    
    @staticmethod
    def update(db: Session, modele: ModeleSMS, modele_in: ModeleSMSUpdate) -> ModeleSMS:
        update_data = modele_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(modele, field, value)
        db.commit()
        db.refresh(modele)
        return modele
    
    @staticmethod
    def delete(db: Session, modele_id: int) -> bool:
        modele = ModeleSMSRepository.get_by_id(db, modele_id)
        if modele:
            db.delete(modele)
            db.commit()
            return True
        return False


modele_sms_repository = ModeleSMSRepository()
