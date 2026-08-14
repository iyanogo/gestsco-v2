"""
Endpoints API pour la gestion des documents des étudiants
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories import document_etudiant_repository, etudiant_repository
from app.schemas.document_etudiant import (
    DocumentEtudiant,
    DocumentEtudiantCreate,
    DocumentEtudiantUpdate,
)

router = APIRouter(prefix="/documents-etudiant", tags=["Documents Étudiant"])


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
    """
    Récupère la liste des documents avec pagination et filtres.
    
    - **etudiant_id**: Filtrer par ID d'étudiant
    - **type_document**: Filtrer par type (Acte de naissance, Bac, Photo, etc.)
    - **statut**: Filtrer par statut (en_attente, valide, refuse)
    """
    if etudiant_id and type_document:
        return document_etudiant_repository.get_by_type(db, etudiant_id, type_document)
    
    if etudiant_id:
        return document_etudiant_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)
    
    if statut:
        return document_etudiant_repository.get_by_statut(db, statut, skip=skip, limit=limit)
    
    return document_etudiant_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{document_id}", response_model=DocumentEtudiant, summary="Détails d'un document")
async def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un document par son ID.
    """
    document = document_etudiant_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé"
        )
    return document


@router.get("/etudiant/{etudiant_id}", response_model=list[DocumentEtudiant], summary="Documents d'un étudiant")
async def get_documents_by_etudiant(
    etudiant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les documents d'un étudiant spécifique.
    """
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return document_etudiant_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)


@router.post("/", response_model=DocumentEtudiant, status_code=status.HTTP_201_CREATED, summary="Créer un document")
async def create_document(
    document_in: DocumentEtudiantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crée un nouveau document pour un étudiant.
    """
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, document_in.etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return document_etudiant_repository.create(db, document_in)


@router.put("/{document_id}", response_model=DocumentEtudiant, summary="Modifier un document")
async def update_document(
    document_id: int,
    document_in: DocumentEtudiantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Met à jour un document existant.
    """
    document = document_etudiant_repository.get_by_id(db, document_id)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé"
        )
    
    return document_etudiant_repository.update(db, document_id, document_in)


@router.patch("/{document_id}/valider", response_model=DocumentEtudiant, summary="Valider un document")
async def valider_document(
    document_id: int,
    validation_data: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Valide un document.
    
    Body optionnel: {"commentaire": "..."}
    
    Requiert les droits admin ou scolarité.
    """
    commentaire = validation_data.get("commentaire") if validation_data else None
    
    document = document_etudiant_repository.valider_document(db, document_id, commentaire)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé"
        )
    return document


@router.patch("/{document_id}/refuser", response_model=DocumentEtudiant, summary="Refuser un document")
async def refuser_document(
    document_id: int,
    refus_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Refuse un document avec un commentaire obligatoire.
    
    Body: {"commentaire": "Raison du refus"}
    
    Requiert les droits admin ou scolarité.
    """
    commentaire = refus_data.get("commentaire")
    if not commentaire:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le commentaire est obligatoire pour refuser un document"
        )
    
    document = document_etudiant_repository.refuser_document(db, document_id, commentaire)
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé"
        )
    return document


@router.delete("/{document_id}", summary="Supprimer un document")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Supprime un document.
    
    Requiert les droits admin ou scolarité.
    """
    success = document_etudiant_repository.hard_delete(db, document_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document non trouvé"
        )
    return {"message": "Document supprimé avec succès"}
