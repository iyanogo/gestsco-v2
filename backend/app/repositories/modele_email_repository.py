import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.modele_email import ModeleEmail
from app.schemas.modele_email import ModeleEmailCreate, ModeleEmailUpdate


class ModeleEmailRepository:
    
    @staticmethod
    def get_by_id(db: Session, modele_id: int) -> Optional[ModeleEmail]:
        return db.query(ModeleEmail).filter(ModeleEmail.id == modele_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str, etablissement_id: Optional[int] = None) -> Optional[ModeleEmail]:
        """Récupère un modèle par code, priorité à l'établissement spécifique"""
        if etablissement_id:
            modele = db.query(ModeleEmail).filter(
                ModeleEmail.code == code,
                ModeleEmail.etablissement_id == etablissement_id,
                ModeleEmail.is_active == True
            ).first()
            if modele:
                return modele
        
        # Fallback sur le modèle système par défaut
        return db.query(ModeleEmail).filter(
            ModeleEmail.code == code,
            ModeleEmail.etablissement_id == None,
            ModeleEmail.is_active == True
        ).first()
    
    @staticmethod
    def get_by_type_destinataire(db: Session, type_destinataire: str) -> List[ModeleEmail]:
        return db.query(ModeleEmail).filter(
            ModeleEmail.type_destinataire == type_destinataire,
            ModeleEmail.is_active == True
        ).all()
    
    @staticmethod
    def get_all(db: Session, etablissement_id: Optional[int] = None) -> List[ModeleEmail]:
        query = db.query(ModeleEmail).filter(ModeleEmail.is_active == True)
        if etablissement_id:
            query = query.filter(
                (ModeleEmail.etablissement_id == etablissement_id) |
                (ModeleEmail.etablissement_id == None)
            )
        return query.order_by(ModeleEmail.type_destinataire, ModeleEmail.code).all()
    
    @staticmethod
    def render_email(db: Session, modele_id: int, variables: Dict[str, Any]) -> Dict[str, str]:
        """Retourne {objet, corps_html, corps_texte} avec variables remplacées"""
        modele = ModeleEmailRepository.get_by_id(db, modele_id)
        if not modele:
            return {"objet": "", "corps_html": "", "corps_texte": ""}
        
        def replace_var(match):
            var_name = match.group(1).strip()
            return str(variables.get(var_name, f"{{{{ {var_name} }}}}"))
        
        objet = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, modele.objet)
        corps_html = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, modele.corps_html)
        corps_texte = ""
        if modele.corps_texte:
            corps_texte = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, modele.corps_texte)
        
        return {
            "objet": objet,
            "corps_html": corps_html,
            "corps_texte": corps_texte
        }
    
    @staticmethod
    def create(db: Session, modele_in: ModeleEmailCreate) -> ModeleEmail:
        modele = ModeleEmail(**modele_in.model_dump())
        db.add(modele)
        db.commit()
        db.refresh(modele)
        return modele
    
    @staticmethod
    def update(db: Session, modele: ModeleEmail, modele_in: ModeleEmailUpdate) -> ModeleEmail:
        update_data = modele_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(modele, field, value)
        db.commit()
        db.refresh(modele)
        return modele
    
    @staticmethod
    def delete(db: Session, modele_id: int) -> bool:
        modele = ModeleEmailRepository.get_by_id(db, modele_id)
        if modele:
            db.delete(modele)
            db.commit()
            return True
        return False


modele_email_repository = ModeleEmailRepository()
