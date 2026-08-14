import json
from datetime import datetime
from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session

from app.models.parametre_systeme import ParametreSysteme
from app.schemas.parametre_systeme import ParametreSystemeCreate, ParametreSystemeUpdate


class ParametreRepository:
    
    @staticmethod
    def get_by_id(db: Session, parametre_id: int) -> Optional[ParametreSysteme]:
        return db.query(ParametreSysteme).filter(ParametreSysteme.id == parametre_id).first()
    
    @staticmethod
    def get_by_cle(db: Session, cle: str) -> Optional[ParametreSysteme]:
        return db.query(ParametreSysteme).filter(ParametreSysteme.cle == cle).first()
    
    @staticmethod
    def get_by_categorie(db: Session, categorie: str) -> List[ParametreSysteme]:
        return db.query(ParametreSysteme).filter(
            ParametreSysteme.categorie == categorie,
            ParametreSysteme.est_visible == True
        ).order_by(ParametreSysteme.ordre_affichage).all()
    
    @staticmethod
    def get_all(db: Session) -> List[ParametreSysteme]:
        return db.query(ParametreSysteme).filter(
            ParametreSysteme.est_visible == True
        ).order_by(ParametreSysteme.categorie, ParametreSysteme.ordre_affichage).all()
    
    @staticmethod
    def get_valeur(db: Session, cle: str, defaut: Any = None) -> Any:
        """Retourne la valeur convertie selon type_valeur"""
        parametre = ParametreRepository.get_by_cle(db, cle)
        if not parametre:
            return defaut
        
        valeur = parametre.valeur
        type_valeur = parametre.type_valeur
        
        try:
            if type_valeur == "integer":
                return int(valeur)
            elif type_valeur == "float":
                return float(valeur)
            elif type_valeur == "boolean":
                return valeur.lower() in ("true", "1", "yes", "oui")
            elif type_valeur == "json":
                return json.loads(valeur)
            elif type_valeur == "date":
                return datetime.strptime(valeur, "%Y-%m-%d").date()
            else:
                return valeur
        except (ValueError, json.JSONDecodeError):
            return defaut
    
    @staticmethod
    def set_valeur(db: Session, cle: str, valeur: Any, user_id: int) -> Optional[ParametreSysteme]:
        """Met à jour ou crée le paramètre"""
        parametre = ParametreRepository.get_by_cle(db, cle)
        
        if not parametre:
            return None
        
        if not parametre.est_modifiable:
            return None
        
        # Convertir la valeur en string
        if isinstance(valeur, bool):
            valeur_str = "true" if valeur else "false"
        elif isinstance(valeur, (dict, list)):
            valeur_str = json.dumps(valeur)
        else:
            valeur_str = str(valeur)
        
        parametre.valeur = valeur_str
        parametre.modifie_par = user_id
        parametre.date_modification = datetime.utcnow()
        
        db.commit()
        db.refresh(parametre)
        return parametre
    
    @staticmethod
    def get_all_parametres(db: Session) -> Dict[str, Any]:
        """Retourne tous les paramètres sous forme de dict {cle: valeur}"""
        parametres = db.query(ParametreSysteme).all()
        result = {}
        for p in parametres:
            result[p.cle] = ParametreRepository.get_valeur(db, p.cle)
        return result
    
    @staticmethod
    def get_parametres_modifiables(db: Session) -> List[ParametreSysteme]:
        return db.query(ParametreSysteme).filter(
            ParametreSysteme.est_modifiable == True,
            ParametreSysteme.est_visible == True
        ).order_by(ParametreSysteme.categorie, ParametreSysteme.ordre_affichage).all()
    
    @staticmethod
    def create(db: Session, parametre_in: ParametreSystemeCreate) -> ParametreSysteme:
        parametre = ParametreSysteme(**parametre_in.model_dump())
        db.add(parametre)
        db.commit()
        db.refresh(parametre)
        return parametre
    
    @staticmethod
    def update(db: Session, parametre: ParametreSysteme, parametre_in: ParametreSystemeUpdate) -> ParametreSysteme:
        update_data = parametre_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(parametre, field, value)
        db.commit()
        db.refresh(parametre)
        return parametre
    
    @staticmethod
    def delete(db: Session, parametre_id: int) -> bool:
        parametre = ParametreRepository.get_by_id(db, parametre_id)
        if parametre:
            db.delete(parametre)
            db.commit()
            return True
        return False
    
    @staticmethod
    def initialiser_parametres_defaut(db: Session) -> int:
        """Crée les paramètres par défaut s'ils n'existent pas"""
        from app.scripts.init_parametres import PARAMETRES_DEFAUT
        
        count = 0
        for param_data in PARAMETRES_DEFAUT:
            existing = ParametreRepository.get_by_cle(db, param_data["cle"])
            if not existing:
                parametre = ParametreSysteme(**param_data)
                db.add(parametre)
                count += 1
        
        db.commit()
        return count


parametre_repository = ParametreRepository()
