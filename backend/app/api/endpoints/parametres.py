from typing import List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.schemas.parametre_systeme import (
    ParametreSystemeCreate,
    ParametreSystemeUpdate,
    ParametreSystemeResponse,
    ParametreSystemeUpdateValeur
)
from app.repositories.parametre_repository import parametre_repository
from app.services.parametre_service import (
    get_parametre,
    set_parametre,
    get_parametres_par_categorie,
    initialiser_parametres_defaut
)

router = APIRouter()

_PARAM_FIELDS = ("cle", "categorie", "valeur", "type_valeur", "libelle", "est_modifiable")


@router.get("/", response_model=List[ParametreSystemeResponse])
def get_all_parametres(
    categorie: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère tous les paramètres système"""
    if categorie:
        return parametre_repository.get_by_categorie(db, categorie)
    return parametre_repository.get_all(db)


@router.get("/par-categorie")
def get_parametres_groupes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère les paramètres groupés par catégorie"""
    return get_parametres_par_categorie(db)


@router.get("/valeur/{cle}")
def get_parametre_valeur(
    cle: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère la valeur d'un paramètre par sa clé"""
    valeur = get_parametre(db, cle)
    if valeur is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paramètre '{cle}' non trouvé"
        )
    return {"cle": cle, "valeur": valeur}


@router.get("/{parametre_id}", response_model=ParametreSystemeResponse)
def get_parametre_by_id(
    parametre_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un paramètre par son ID"""
    parametre = parametre_repository.get_by_id(db, parametre_id)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )
    return parametre


@router.post("/", response_model=ParametreSystemeResponse, status_code=status.HTTP_201_CREATED)
def create_parametre(
    parametre_in: ParametreSystemeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Crée un nouveau paramètre système (superuser uniquement)."""
    existing = parametre_repository.get_by_cle(db, parametre_in.cle)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un paramètre avec la clé '{parametre_in.cle}' existe déjà"
        )

    parametre = parametre_repository.create(db, parametre_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="parametre",
        entity_id=parametre.id,
        new_values=fields_snapshot(parametre, *_PARAM_FIELDS),
    )
    return parametre


@router.put("/{parametre_id}", response_model=ParametreSystemeResponse)
def update_parametre(
    parametre_id: int,
    parametre_in: ParametreSystemeUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour un paramètre système (superuser uniquement)."""
    parametre = parametre_repository.get_by_id(db, parametre_id)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )

    old_snapshot = fields_snapshot(parametre, *_PARAM_FIELDS)
    updated = parametre_repository.update(db, parametre, parametre_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="parametre",
        entity_id=parametre_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_PARAM_FIELDS),
    )
    return updated


@router.patch("/valeur/{cle}")
def update_parametre_valeur(
    cle: str,
    data: ParametreSystemeUpdateValeur,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "update")),
):
    """Met à jour uniquement la valeur d'un paramètre (superuser uniquement)."""
    parametre = parametre_repository.get_by_cle(db, cle)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Paramètre '{cle}' non trouvé",
        )
    old_snapshot = fields_snapshot(parametre, *_PARAM_FIELDS)
    success = set_parametre(db, cle, data.valeur, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de mettre à jour le paramètre"
        )
    updated = parametre_repository.get_by_cle(db, cle)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="parametre",
        entity_id=updated.id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_PARAM_FIELDS),
    )
    return {"message": "Paramètre mis à jour", "cle": cle, "valeur": data.valeur}


@router.delete("/{parametre_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_parametre(
    parametre_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "delete")),
):
    """Supprime un paramètre système (superuser uniquement)."""
    parametre = parametre_repository.get_by_id(db, parametre_id)
    if not parametre:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paramètre non trouvé"
        )
    old_snapshot = fields_snapshot(parametre, *_PARAM_FIELDS)
    parametre_repository.delete(db, parametre_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="parametre",
        entity_id=parametre_id,
        old_values=old_snapshot,
    )


@router.post("/initialiser")
def initialiser_parametres(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("parametrage", "create")),
):
    """Initialise les paramètres par défaut (superuser uniquement)."""
    result = initialiser_parametres_defaut(db)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="parametre",
        entity_id="initialiser",
        new_values=result,
        details="initialiser",
    )
    return {"message": "Paramètres initialisés", **result}
