import re
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from app.models.template_document import TemplateDocument
from app.schemas.template_document import TemplateDocumentCreate, TemplateDocumentUpdate


class TemplateDocumentRepository:
    
    @staticmethod
    def get_by_id(db: Session, template_id: int) -> Optional[TemplateDocument]:
        return db.query(TemplateDocument).filter(TemplateDocument.id == template_id).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str, etablissement_id: Optional[int] = None) -> Optional[TemplateDocument]:
        """Récupère un template par code, priorité à l'établissement spécifique"""
        if etablissement_id:
            template = db.query(TemplateDocument).filter(
                TemplateDocument.code == code,
                TemplateDocument.etablissement_id == etablissement_id,
                TemplateDocument.is_active == True
            ).first()
            if template:
                return template
        
        # Fallback sur le template système par défaut
        return db.query(TemplateDocument).filter(
            TemplateDocument.code == code,
            TemplateDocument.etablissement_id == None,
            TemplateDocument.is_active == True
        ).first()
    
    @staticmethod
    def get_by_type(db: Session, type_document: str, etablissement_id: Optional[int] = None) -> List[TemplateDocument]:
        query = db.query(TemplateDocument).filter(
            TemplateDocument.type_document == type_document,
            TemplateDocument.is_active == True
        )
        if etablissement_id:
            query = query.filter(
                (TemplateDocument.etablissement_id == etablissement_id) |
                (TemplateDocument.etablissement_id == None)
            )
        return query.all()
    
    @staticmethod
    def get_all(db: Session, etablissement_id: Optional[int] = None, type_document: Optional[str] = None) -> List[TemplateDocument]:
        query = db.query(TemplateDocument).filter(TemplateDocument.is_active == True)
        if etablissement_id:
            query = query.filter(
                (TemplateDocument.etablissement_id == etablissement_id) |
                (TemplateDocument.etablissement_id == None)
            )
        if type_document:
            query = query.filter(TemplateDocument.type_document == type_document)
        return query.order_by(TemplateDocument.type_document, TemplateDocument.code).all()
    
    @staticmethod
    def render_template(db: Session, template_id: int, variables: Dict[str, Any]) -> str:
        """Remplace les variables dans le template HTML"""
        template = TemplateDocumentRepository.get_by_id(db, template_id)
        if not template:
            return ""
        
        html = template.template_html
        
        # Remplacer les variables {{variable_name}}
        def replace_var(match):
            var_name = match.group(1).strip()
            return str(variables.get(var_name, f"{{{{ {var_name} }}}}"))
        
        html = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, html)
        
        # Ajouter le CSS si présent
        if template.template_css:
            html = f"<style>{template.template_css}</style>\n{html}"
        
        # Ajouter l'en-tête si présent
        if template.en_tete_html:
            en_tete = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, template.en_tete_html)
            html = f"{en_tete}\n{html}"
        
        # Ajouter le pied de page si présent
        if template.pied_page_html:
            pied = re.sub(r'\{\{\s*(\w+)\s*\}\}', replace_var, template.pied_page_html)
            html = f"{html}\n{pied}"
        
        return html
    
    @staticmethod
    def create(db: Session, template_in: TemplateDocumentCreate) -> TemplateDocument:
        template = TemplateDocument(**template_in.model_dump())
        db.add(template)
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def update(db: Session, template: TemplateDocument, template_in: TemplateDocumentUpdate) -> TemplateDocument:
        update_data = template_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(template, field, value)
        db.commit()
        db.refresh(template)
        return template
    
    @staticmethod
    def delete(db: Session, template_id: int) -> bool:
        template = TemplateDocumentRepository.get_by_id(db, template_id)
        if template:
            db.delete(template)
            db.commit()
            return True
        return False


template_document_repository = TemplateDocumentRepository()
