"""
Endpoints API pour la gestion des matières.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.api.deps import get_db, get_current_active_user
from app.models.user import User
from app.repositories import matiere_repository, module_repository
from app.schemas.matiere import Matiere, MatiereCreate, MatiereUpdate
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.utils.rbac_resolver import require_permission

router = APIRouter(prefix="/matieres", tags=["Matières"])

_MATIERE_FIELDS = ("code", "libelle", "module_id", "credit", "obligatoire")


@router.get(
    "/",
    response_model=list[Matiere],
    summary="Liste des matières",
    description="Récupère la liste de toutes les matières avec pagination et filtres.",
)
def get_matieres(
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    module_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des matières.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Terme de recherche optionnel
    - **module_id**: Filtrer par module
    """
    if module_id:
        return matiere_repository.get_by_module(db, module_id, skip=skip, limit=limit)
    if search:
        return matiere_repository.search(db, search, skip=skip, limit=limit)
    return matiere_repository.get_all(db, skip=skip, limit=limit)


@router.get(
    "/count",
    response_model=dict,
    summary="Nombre de matières",
    description="Retourne le nombre total de matières actives.",
)
def get_matieres_count(
    module_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne le nombre total de matières."""
    if module_id:
        return {"total": matiere_repository.count_by_module(db, module_id)}
    return {"total": matiere_repository.get_count(db)}


@router.get(
    "/{matiere_id}",
    response_model=Matiere,
    summary="Détails d'une matière",
    description="Récupère les détails d'une matière par son ID.",
)
def get_matiere(
    matiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une matière par son ID."""
    matiere = matiere_repository.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée",
        )
    return matiere


@router.get(
    "/{matiere_id}/volume-horaire",
    response_model=dict,
    summary="Volume horaire total",
    description="Calcule le volume horaire total (CM + TD + TP) d'une matière.",
)
def get_matiere_volume_horaire(
    matiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Calcule le volume horaire total d'une matière."""
    matiere = matiere_repository.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée",
        )
    total = matiere_repository.get_volume_horaire_total(db, matiere_id)
    return {
        "matiere_id": matiere_id,
        "volume_horaire_cm": matiere.volume_horaire_cm or 0,
        "volume_horaire_td": matiere.volume_horaire_td or 0,
        "volume_horaire_tp": matiere.volume_horaire_tp or 0,
        "volume_horaire_total": total,
    }


@router.post(
    "/",
    response_model=Matiere,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une matière",
    description="Crée une nouvelle matière. Réservé aux administrateurs.",
)
def create_matiere(
    matiere_in: MatiereCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "create")),
):
    """Crée une nouvelle matière."""
    if not module_repository.exists(db, matiere_in.module_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module non trouvé",
        )
    if matiere_repository.code_exists(db, matiere_in.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le code '{matiere_in.code}' existe déjà",
        )
    try:
        matiere = matiere_repository.create(db, matiere_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="matiere",
            entity_id=matiere.id,
            new_values=fields_snapshot(matiere, *_MATIERE_FIELDS),
        )
        return matiere
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la création de la matière",
        )


@router.put(
    "/{matiere_id}",
    response_model=Matiere,
    summary="Modifier une matière",
    description="Met à jour une matière existante. Réservé aux administrateurs.",
)
def update_matiere(
    matiere_id: int,
    matiere_in: MatiereUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "update")),
):
    """Met à jour une matière."""
    matiere = matiere_repository.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée",
        )
    
    if matiere_in.module_id and not module_repository.exists(db, matiere_in.module_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Module non trouvé",
        )
    
    if matiere_in.code and matiere_in.code != matiere.code:
        if matiere_repository.code_exists(db, matiere_in.code, exclude_id=matiere_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le code '{matiere_in.code}' existe déjà",
            )
    
    old_snapshot = fields_snapshot(matiere, *_MATIERE_FIELDS)
    try:
        updated = matiere_repository.update(db, matiere_id, matiere_in)
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="matiere",
            entity_id=matiere_id,
            old_values=old_snapshot,
            new_values=fields_snapshot(updated, *_MATIERE_FIELDS),
        )
        return updated
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Erreur lors de la mise à jour de la matière",
        )


@router.delete(
    "/{matiere_id}",
    response_model=dict,
    summary="Supprimer une matière",
    description="Supprime une matière (suppression logique). Réservé aux administrateurs.",
)
def delete_matiere(
    matiere_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("referentiel", "delete")),
):
    """Supprime une matière (suppression logique)."""
    matiere = matiere_repository.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée",
        )
    old_snapshot = fields_snapshot(matiere, *_MATIERE_FIELDS)
    if not matiere_repository.delete(db, matiere_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matière non trouvée",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="matiere",
        entity_id=matiere_id,
        old_values=old_snapshot,
    )
    return {"message": "Matière supprimée avec succès"}
