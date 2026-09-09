from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.schemas.user import User as UserSchema, UserCreate, UserSummary, UserUpdate
from app.repositories.user_repository import UserRepository
from app.utils.administration_events import record_audit_event, user_audit_snapshot

router = APIRouter()

STAFF_SELECT_ROLES = ("enseignant", "teacher", "admin", "administrateur", "scolarite")


@router.get("/", response_model=List[UserSchema])
async def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_permission("utilisateurs", "read")),
) -> Any:
    """
    Récupère la liste des utilisateurs (admin uniquement).
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    """
    users = UserRepository.get_all(db, skip=skip, limit=limit)
    return users


@router.get("/select", response_model=List[UserSummary])
async def read_users_for_select(
    roles: Optional[str] = Query(
        None,
        description="Rôles CSV (ex. enseignant,admin). Défaut : staff pédagogique.",
    ),
    skip: int = 0,
    limit: int = Query(500, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "read")),
) -> Any:
    """
    Liste réduite pour sélecteurs (examens, stages, jury).

    Accès admin/scolarité/superadmin - sans exposer la gestion complète des comptes.
    """
    role_list = (
        [r.strip() for r in roles.split(",") if r.strip()]
        if roles
        else list(STAFF_SELECT_ROLES)
    )
    return UserRepository.get_active_by_roles(db, role_list, skip=skip, limit=limit)


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("utilisateurs", "create")),
) -> Any:
    """Crée un nouvel utilisateur (admin uniquement)."""
    existing_user = UserRepository.get_by_email(db, user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur avec cet email existe déjà",
        )
    user = UserRepository.create(db, user_in)
    record_audit_event(
        db,
        action="create",
        entity_type="user",
        entity_id=str(user.id),
        user=current_user,
        ip_address=request.client.host if request.client else None,
        new_values=user_audit_snapshot(user),
    )
    db.commit()
    return user


@router.get("/{user_id}", response_model=UserSchema)
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("utilisateurs", "read")),
) -> Any:
    """Récupère un utilisateur par son ID (admin uniquement)."""
    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )
    return user


@router.put("/{user_id}", response_model=UserSchema)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("utilisateurs", "update")),
) -> Any:
    """Met à jour un utilisateur (admin uniquement)."""
    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )
    old_snapshot = user_audit_snapshot(user)
    if user_in.email and user_in.email != user.email:
        existing_user = UserRepository.get_by_email(db, user_in.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà",
            )
    if user_in.is_superuser is False and user.is_superuser:
        remaining = (
            db.query(User)
            .filter(User.is_superuser.is_(True), User.id != user_id)
            .count()
        )
        if remaining == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de retirer le dernier super-utilisateur",
            )
    updated_user = UserRepository.update(db, user_id, user_in)
    record_audit_event(
        db,
        action="update",
        entity_type="user",
        entity_id=str(user_id),
        user=current_user,
        ip_address=request.client.host if request.client else None,
        old_values=old_snapshot,
        new_values=user_audit_snapshot(updated_user),
    )
    db.commit()
    return updated_user


@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("utilisateurs", "delete")),
) -> Any:
    """Supprime un utilisateur (admin uniquement)."""
    user = UserRepository.get_by_id(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utilisateur non trouvé",
        )
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de supprimer votre propre compte",
        )
    old_snapshot = user_audit_snapshot(user)
    UserRepository.delete(db, user_id)
    record_audit_event(
        db,
        action="delete",
        entity_type="user",
        entity_id=str(user_id),
        user=current_user,
        ip_address=request.client.host if request.client else None,
        old_values=old_snapshot,
    )
    db.commit()
    return {"message": "Utilisateur supprimé avec succès"}
