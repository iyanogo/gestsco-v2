"""
Endpoints API pour la gestion des documents des étudiants
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, can_access_any_etudiant, resolve_etudiant_id
from app.models.user import User
from app.repositories import document_etudiant_repository, etudiant_repository
from app.schemas.document_etudiant import (
    DocumentEtudiant,
    DocumentEtudiantCreate,
    DocumentEtudiantUpdate,
)
from app.utils.document_access import (
    assert_documents_staff_list,
    assert_student_can_create_document,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/documents-etudiant", tags=["Documents Étudiant"])

_DOC_FIELDS = ("etudiant_id", "type_document", "libelle", "statut", "fichier_url")


@router.get("/", response_model=list[DocumentEtudiant], summary="Liste des documents")
async def list_documents(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    etudiant_id: Optional[int] = Query(None, description="Filtrer par étudiant"),
    type_document: Optional[str] = Query(None, description="Filtrer par type de document"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste des documents avec pagination et filtres."""
    if etudiant_id:
        assert_etudiant_owner(current_user, etudiant_id, db)
        if type_document:
            return document_etudiant_repository.get_by_type(db, etudiant_id, type_document)
        return document_etudiant_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)

    assert_documents_staff_list(current_user)
    if statut:
        return document_etudiant_repository.get_by_statut(db, statut, skip=skip, limit=limit)
    return document_etudiant_repository.get_all(db, skip=skip, limit=limit)


@router.get("/mes-documents", response_model=list[DocumentEtudiant], summary="Mes documents (portail)")
async def get_mes_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Documents administratifs de l'étudiant connecté."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return document_etudiant_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)


@router.get("/etudiant/{etudiant_id}", response_model=list[DocumentEtudiant], summary="Documents d'un étudiant")
async def get_documents_by_etudiant(
    etudiant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les documents d'un étudiant spécifique."""
    assert_etudiant_owner(current_user, etudiant_id, db)
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )
    return document_etudiant_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentEtudiant, summary="Détails d'un document")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un document par son ID."""
    document = document_etudiant_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    assert_etudiant_owner(current_user, document.etudiant_id, db)
    return document


@router.post("/", response_model=DocumentEtudiant, status_code=status.HTTP_201_CREATED, summary="Créer un document")
async def create_document(
    document_in: DocumentEtudiantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Crée un nouveau document pour un étudiant."""
    etudiant = etudiant_repository.get_by_id(db, document_in.etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )

    if can_access_any_etudiant(current_user):
        pass
    else:
        owned_id = resolve_etudiant_id(db, current_user)
        assert_student_can_create_document(current_user, document_in.etudiant_id, owned_id)

    document = document_etudiant_repository.create(db, document_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="document_etudiant",
        entity_id=document.id,
        new_values=fields_snapshot(document, *_DOC_FIELDS),
    )
    return document


@router.put("/{document_id}", response_model=DocumentEtudiant, summary="Modifier un document")
async def update_document(
    document_id: int,
    document_in: DocumentEtudiantUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "update")),
):
    """Met à jour un document existant (scolarité / admin)."""
    document = document_etudiant_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    old_snapshot = fields_snapshot(document, *_DOC_FIELDS)
    updated = document_etudiant_repository.update(db, document_id, document_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="document_etudiant",
        entity_id=document_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_DOC_FIELDS),
    )
    return updated


@router.patch("/{document_id}/valider", response_model=DocumentEtudiant, summary="Valider un document")
async def valider_document(
    document_id: int,
    request: Request,
    validation_data: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "validate")),
):
    """Valide un document."""
    existing = document_etudiant_repository.get_by_id(db, document_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document non trouvé")
    old_snapshot = fields_snapshot(existing, *_DOC_FIELDS)
    commentaire = validation_data.get("commentaire") if validation_data else None
    document = document_etudiant_repository.valider_document(db, document_id, commentaire)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="document_etudiant",
        entity_id=document_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(document, *_DOC_FIELDS),
    )
    return document


@router.patch("/{document_id}/refuser", response_model=DocumentEtudiant, summary="Refuser un document")
async def refuser_document(
    document_id: int,
    refus_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "validate")),
):
    """Refuse un document avec un commentaire obligatoire."""
    commentaire = refus_data.get("commentaire")
    if not commentaire:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le commentaire est obligatoire pour refuser un document",
        )
    existing = document_etudiant_repository.get_by_id(db, document_id)
    old_snapshot = fields_snapshot(existing, *_DOC_FIELDS) if existing else {}
    document = document_etudiant_repository.refuser_document(db, document_id, commentaire)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="reject",
        entity_type="document_etudiant",
        entity_id=document_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(document, *_DOC_FIELDS),
    )
    return document


@router.delete("/{document_id}", summary="Supprimer un document")
async def delete_document(
    document_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "delete")),
):
    """Supprime un document."""
    existing = document_etudiant_repository.get_by_id(db, document_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    old_snapshot = fields_snapshot(existing, *_DOC_FIELDS)
    success = document_etudiant_repository.hard_delete(db, document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="document_etudiant",
        entity_id=document_id,
        old_values=old_snapshot,
    )
    return {"message": "Document supprimé avec succès"}
