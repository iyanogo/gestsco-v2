"""
Endpoints API pour la gestion des dossiers de candidature
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.dossier_candidature_repository import dossier_candidature_repository
from app.schemas.dossier_candidature import (
    DossierCandidature,
    DossierCandidatureCreate,
    DossierCandidatureUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/dossiers-candidature", tags=["Dossiers de Candidature"])

_DOSSIER_FIELDS = (
    "numero_dossier",
    "campagne_id",
    "statut_dossier",
    "filiere_souhaitee_1",
)


class CommentaireRequest(BaseModel):
    commentaire: str | None = None


class RefusRequest(BaseModel):
    commentaire: str


class AdmissionRequest(BaseModel):
    filiere_id: int


@router.get("/", response_model=list[DossierCandidature])
def list_dossiers(
    skip: int = 0,
    limit: int = 100,
    campagne_id: int = Query(None, description="Filtrer par campagne"),
    statut: str = Query(None, description="Filtrer par statut"),
    nom: str = Query(None, description="Rechercher par nom"),
    email: str = Query(None, description="Rechercher par email"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "read")),
):
    """Liste tous les dossiers de candidature."""
    return dossier_candidature_repository.search_advanced(
        db,
        nom=nom,
        email=email,
        campagne_id=campagne_id,
        statut=statut,
        skip=skip,
        limit=limit
    )


@router.get("/count")
def count_dossiers(
    campagne_id: int = Query(None, description="Filtrer par campagne"),
    statut: str = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "read")),
):
    """Compte les dossiers de candidature."""
    if campagne_id:
        count = dossier_candidature_repository.count_by_campagne(db, campagne_id, statut)
    else:
        count = dossier_candidature_repository.get_count(db)
    return {"count": count}


@router.get("/{dossier_id}", response_model=DossierCandidature)
def get_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un dossier par son ID."""
    dossier = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    return dossier


@router.get("/numero/{numero}", response_model=DossierCandidature)
def get_dossier_by_numero(
    numero: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un dossier par son numéro."""
    dossier = dossier_candidature_repository.get_by_numero(db, numero)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    return dossier


@router.get("/{dossier_id}/details", response_model=DossierCandidature)
def get_dossier_details(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un dossier avec ses détails complets (pièces jointes et paiements)."""
    dossier = dossier_candidature_repository.get_with_details(db, dossier_id)
    if not dossier:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    return dossier


@router.post("/", response_model=DossierCandidature, status_code=status.HTTP_201_CREATED)
def create_dossier(
    dossier_in: DossierCandidatureCreate,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Crée un nouveau dossier de candidature (inscription en ligne).
    Endpoint public - pas d'authentification requise.
    """
    dossier = dossier_candidature_repository.create_with_numero(db, dossier_in)
    audit_and_commit(
        db,
        request=http_request,
        user=None,
        action="create",
        entity_type="dossier_candidature",
        entity_id=dossier.id,
        new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
    )
    return dossier


@router.put("/{dossier_id}", response_model=DossierCandidature)
def update_dossier(
    dossier_id: int,
    dossier_in: DossierCandidatureUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Met à jour un dossier de candidature."""
    existing = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
    dossier = dossier_candidature_repository.update(db, dossier_id, dossier_in)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="update",
        entity_type="dossier_candidature",
        entity_id=dossier_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
    )
    return dossier


@router.patch("/{dossier_id}/soumettre", response_model=DossierCandidature)
def soumettre_dossier(
    dossier_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
):
    """
    Soumet un dossier de candidature.
    Vérifie que toutes les pièces requises sont fournies.
    Endpoint public - pas d'authentification requise.
    """
    try:
        existing = dossier_candidature_repository.get_by_id(db, dossier_id)
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dossier non trouvé"
            )
        old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
        dossier = dossier_candidature_repository.soumettre_dossier(db, dossier_id)
        audit_and_commit(
            db,
            request=http_request,
            user=None,
            action="update",
            entity_type="dossier_candidature",
            entity_id=dossier_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
            details="soumettre",
        )
        return dossier
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{dossier_id}/valider", response_model=DossierCandidature)
def valider_dossier(
    dossier_id: int,
    http_request: Request,
    body: CommentaireRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "validate")),
):
    """Valide un dossier de candidature."""
    existing = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
    commentaire = body.commentaire if body else None
    dossier = dossier_candidature_repository.valider_dossier(db, dossier_id, commentaire)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="validate",
        entity_type="dossier_candidature",
        entity_id=dossier_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
    )
    return dossier


@router.patch("/{dossier_id}/refuser", response_model=DossierCandidature)
def refuser_dossier(
    dossier_id: int,
    body: RefusRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "validate")),
):
    """Refuse un dossier de candidature."""
    existing = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
    dossier = dossier_candidature_repository.refuser_dossier(db, dossier_id, body.commentaire)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="validate",
        entity_type="dossier_candidature",
        entity_id=dossier_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
        details="refuser",
    )
    return dossier


@router.patch("/{dossier_id}/admettre", response_model=DossierCandidature)
def admettre_candidat(
    dossier_id: int,
    body: AdmissionRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "validate")),
):
    """
    Admet un candidat dans une filière.
    Crée automatiquement un étudiant si admis.
    """
    from app.services.admission_service import create_etudiant_from_dossier
    
    existing = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
    dossier = dossier_candidature_repository.admettre_candidat(db, dossier_id, body.filiere_id)
    
    # Créer l'étudiant automatiquement
    try:
        create_etudiant_from_dossier(db, dossier_id)
    except Exception as e:
        # Log l'erreur mais ne pas bloquer l'admission
        print(f"Erreur lors de la création de l'étudiant: {e}")
    
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="validate",
        entity_type="dossier_candidature",
        entity_id=dossier_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(dossier, *_DOSSIER_FIELDS),
        details="admettre",
    )
    return dossier


@router.delete("/{dossier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dossier(
    dossier_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "delete")),
):
    """Supprime un dossier de candidature."""
    existing = dossier_candidature_repository.get_by_id(db, dossier_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    old_snapshot = fields_snapshot(existing, *_DOSSIER_FIELDS)
    success = dossier_candidature_repository.hard_delete(db, dossier_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dossier non trouvé"
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="delete",
        entity_type="dossier_candidature",
        entity_id=dossier_id,
        old_values=old_snapshot,
    )
    return None
