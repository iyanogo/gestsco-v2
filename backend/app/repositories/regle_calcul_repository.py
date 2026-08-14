import json
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.regles_calcul import RegleCalcul
from app.schemas.regles_calcul import RegleCalculCreate, RegleCalculUpdate


class RegleCalculRepository:
    
    @staticmethod
    def get_by_id(db: Session, regle_id: int) -> Optional[RegleCalcul]:
        return db.query(RegleCalcul).filter(RegleCalcul.id == regle_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str) -> Optional[RegleCalcul]:
        return db.query(RegleCalcul).filter(
            RegleCalcul.code == code,
            RegleCalcul.is_active == True
        ).first()
    
    @staticmethod
    def get_by_type(db: Session, type_regle: str, cycle_id: Optional[int] = None, etablissement_id: Optional[int] = None) -> List[RegleCalcul]:
        query = db.query(RegleCalcul).filter(
            RegleCalcul.type_regle == type_regle,
            RegleCalcul.is_active == True
        )
        if cycle_id:
            query = query.filter(
                (RegleCalcul.cycle_id == cycle_id) |
                (RegleCalcul.cycle_id == None)
            )
        if etablissement_id:
            query = query.filter(
                (RegleCalcul.etablissement_id == etablissement_id) |
                (RegleCalcul.etablissement_id == None)
            )
        return query.order_by(RegleCalcul.ordre_execution).all()
    
    @staticmethod
    def get_all(db: Session, type_regle: Optional[str] = None, cycle_id: Optional[int] = None) -> List[RegleCalcul]:
        query = db.query(RegleCalcul).filter(RegleCalcul.is_active == True)
        if type_regle:
            query = query.filter(RegleCalcul.type_regle == type_regle)
        if cycle_id:
            query = query.filter(RegleCalcul.cycle_id == cycle_id)
        return query.order_by(RegleCalcul.type_regle, RegleCalcul.ordre_execution).all()
    
    @staticmethod
    def executer_regle(db: Session, regle_id: int, donnees: Dict[str, Any]) -> Any:
        """Exécute la formule avec les données fournies"""
        regle = RegleCalculRepository.get_by_id(db, regle_id)
        if not regle:
            return None
        
        # Vérifier les conditions si présentes
        if regle.conditions:
            try:
                conditions = json.loads(regle.conditions)
                for condition_key, condition_value in conditions.items():
                    if condition_key in donnees and donnees[condition_key] != condition_value:
                        return None
            except json.JSONDecodeError:
                pass
        
        # Exécuter la formule
        formule = regle.formule
        
        # Si la formule est du JSON, c'est une règle complexe
        try:
            formule_json = json.loads(formule)
            return RegleCalculRepository._executer_formule_json(formule_json, donnees)
        except json.JSONDecodeError:
            pass
        
        # Sinon, c'est une expression mathématique simple
        try:
            # Créer un contexte sécurisé pour eval
            safe_dict = {
                "__builtins__": {},
                "sum": sum,
                "len": len,
                "min": min,
                "max": max,
                "round": round,
                "abs": abs,
            }
            safe_dict.update(donnees)
            
            result = eval(formule, safe_dict)
            return result
        except Exception as e:
            return {"error": str(e)}
    
    @staticmethod
    def _executer_formule_json(formule: Dict, donnees: Dict[str, Any]) -> Any:
        """Exécute une formule JSON complexe"""
        operation = formule.get("operation")
        
        if operation == "moyenne_ponderee":
            notes = donnees.get("notes", [])
            coefficients = donnees.get("coefficients", [])
            if not notes or not coefficients or len(notes) != len(coefficients):
                return None
            total = sum(n * c for n, c in zip(notes, coefficients))
            total_coef = sum(coefficients)
            return round(total / total_coef, 2) if total_coef > 0 else 0
        
        elif operation == "validation_credits":
            note = donnees.get("note", 0)
            note_passage = formule.get("note_passage", 10)
            credits = donnees.get("credits", 0)
            return credits if note >= note_passage else 0
        
        elif operation == "compensation":
            moyenne = donnees.get("moyenne", 0)
            seuil = formule.get("seuil", 10)
            return moyenne >= seuil
        
        return None
    
    @staticmethod
    def create(db: Session, regle_in: RegleCalculCreate) -> RegleCalcul:
        regle = RegleCalcul(**regle_in.model_dump())
        db.add(regle)
        db.commit()
        db.refresh(regle)
        return regle
    
    @staticmethod
    def update(db: Session, regle: RegleCalcul, regle_in: RegleCalculUpdate) -> RegleCalcul:
        update_data = regle_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(regle, field, value)
        db.commit()
        db.refresh(regle)
        return regle
    
    @staticmethod
    def delete(db: Session, regle_id: int) -> bool:
        regle = RegleCalculRepository.get_by_id(db, regle_id)
        if regle:
            db.delete(regle)
            db.commit()
            return True
        return False


regle_calcul_repository = RegleCalculRepository()
