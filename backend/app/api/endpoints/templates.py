from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import HTMLResponse, StreamingResponse
from sqlalchemy.orm import Session
import io
from app.api.dependencies import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.schemas.template_document import (
    TemplateDocumentCreate,
    TemplateDocumentUpdate,
    TemplateDocumentResponse,
    TemplatePreviewRequest,
    TemplatePreviewResponse
)
from app.repositories.template_document_repository import template_document_repository
from app.services.template_service import render_document, get_variables_disponibles, render_document_pdf
from app.scripts.init_templates import init_templates
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter()

_TEMPLATE_FIELDS = ("code", "libelle", "type_document", "etablissement_id", "is_active", "format_papier")


@router.get("/", response_model=List[TemplateDocumentResponse])
def get_all_templates(
    etablissement_id: Optional[int] = None,
    type_document: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les templates de documents"""
    return template_document_repository.get_all(db, etablissement_id, type_document)


@router.get("/types")
def get_types_documents(
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la liste des types de documents disponibles"""
    return [
        {"code": "bulletin", "libelle": "Bulletin de notes"},
        {"code": "attestation", "libelle": "Attestation"},
        {"code": "certificat", "libelle": "Certificat"},
        {"code": "releve_notes", "libelle": "Relevé de notes"},
        {"code": "facture", "libelle": "Facture"},
        {"code": "recu", "libelle": "Reçu de paiement"},
        {"code": "autre", "libelle": "Autre"}
    ]


@router.get("/variables/{type_document}")
def get_variables_for_type(
    type_document: str,
    current_user: User = Depends(get_current_active_user)
):
    """Récupère les variables disponibles pour un type de document"""
    return get_variables_disponibles(type_document)


@router.get("/{template_id}", response_model=TemplateDocumentResponse)
def get_template_by_id(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un template par son ID"""
    template = template_document_repository.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    return template


@router.get("/code/{code}")
def get_template_by_code(
    code: str,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un template par son code"""
    template = template_document_repository.get_by_code(db, code, etablissement_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    return template


@router.post("/", response_model=TemplateDocumentResponse, status_code=status.HTTP_201_CREATED)
def create_template(
    template_in: TemplateDocumentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Crée un nouveau template de document (superuser uniquement)."""
    existing = template_document_repository.get_by_code(db, template_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un template avec le code '{template_in.code}' existe déjà"
        )

    template = template_document_repository.create(db, template_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="template",
        entity_id=template.id,
        new_values=fields_snapshot(template, *_TEMPLATE_FIELDS),
    )
    return template


@router.put("/{template_id}", response_model=TemplateDocumentResponse)
def update_template(
    template_id: int,
    template_in: TemplateDocumentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour un template de document (superuser uniquement)."""
    template = template_document_repository.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )

    old_snapshot = fields_snapshot(template, *_TEMPLATE_FIELDS)
    updated = template_document_repository.update(db, template, template_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="template",
        entity_id=template_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_TEMPLATE_FIELDS),
    )
    return updated


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime un template de document (superuser uniquement)."""
    template = template_document_repository.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    old_snapshot = fields_snapshot(template, *_TEMPLATE_FIELDS)
    template_document_repository.delete(db, template_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="template",
        entity_id=template_id,
        old_values=old_snapshot,
    )


@router.post("/{template_id}/preview", response_class=HTMLResponse)
def preview_template(
    template_id: int,
    preview_data: TemplatePreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère un aperçu du template avec les variables fournies"""
    html = template_document_repository.render_template(db, template_id, preview_data.variables)
    if not html:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    return html


@router.post("/{template_id}/pdf")
def export_template_pdf(
    template_id: int,
    preview_data: TemplatePreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Génère un PDF à partir du template avec les variables fournies."""
    from app.utils.pdf_generator import PDFGenerationError

    template = template_document_repository.get_by_id(db, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")

    try:
        pdf_bytes = render_document_pdf(db, template.code, preview_data.variables, template.etablissement_id)
    except PDFGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not pdf_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=template_{template.code}.pdf"},
    )


@router.post("/code/{code}/pdf")
def export_template_pdf_by_code(
    code: str,
    preview_data: TemplatePreviewRequest,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Génère un PDF à partir du code du template."""
    from app.utils.pdf_generator import PDFGenerationError

    try:
        pdf_bytes = render_document_pdf(db, code, preview_data.variables, etablissement_id)
    except PDFGenerationError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc

    if not pdf_bytes:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Template non trouvé")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=template_{code}.pdf"},
    )


@router.post("/code/{code}/render")
def render_template_by_code(
    code: str,
    preview_data: TemplatePreviewRequest,
    etablissement_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Génère le HTML à partir du code du template"""
    html = render_document(db, code, preview_data.variables, etablissement_id)
    if not html:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template non trouvé"
        )
    return {"html": html}


@router.post("/initialiser")
def initialiser_templates(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Initialise les templates par défaut (superuser uniquement)."""
    count = init_templates(db)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="template",
        entity_id="initialiser",
        new_values={"templates_crees": count},
        details="initialiser",
    )
    return {"message": "Templates initialisés", "templates_crees": count}
