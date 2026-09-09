from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import Token, User as UserSchema, UserCreate, UserUpdate
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository
from app.utils.administration_events import record_audit_event, record_system_log
from app.utils.rbac_matrix import get_rbac_matrix_rows
from app.schemas.administration import RbacMatrixRowRead

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    request: Request,
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Authentification et obtention du token JWT.
    
    - **username**: Email de l'utilisateur
    - **password**: Mot de passe de l'utilisateur
    """
    client_ip = request.client.host if request.client else None
    try:
        result = AuthService.login(db, form_data.username, form_data.password)
    except HTTPException as exc:
        if exc.status_code == 401:
            record_system_log(
                db,
                level="WARNING",
                source="auth",
                action="login_failed",
                message=f"Échec de connexion pour {form_data.username}",
                user_email=form_data.username,
                ip_address=client_ip,
            )
            record_audit_event(
                db,
                action="login_failed",
                entity_type="user",
                entity_id=form_data.username,
                user_email=form_data.username,
                ip_address=client_ip,
                details="Identifiants invalides",
            )
            db.commit()
        raise

    user_orm = UserRepository.get_by_email(db, form_data.username)
    record_system_log(
        db,
        level="SUCCESS",
        source="auth",
        action="login",
        message=f"Connexion réussie - {form_data.username}",
        user=user_orm,
        ip_address=client_ip,
    )
    record_audit_event(
        db,
        action="login",
        entity_type="user",
        entity_id=str(user_orm.id) if user_orm else form_data.username,
        user=user_orm,
        ip_address=client_ip,
        new_values={"email": form_data.username},
    )
    db.commit()
    return {"access_token": result["access_token"], "token_type": result["token_type"]}


@router.post("/register", response_model=UserSchema, status_code=201)
async def register(
    user_in: UserCreate,
    db: Session = Depends(get_db),
) -> Any:
    """
    Inscription d'un nouvel utilisateur.
    
    - **email**: Email unique de l'utilisateur
    - **password**: Mot de passe (minimum 8 caractères)
    - **full_name**: Nom complet (optionnel)
    """
    return AuthService.register(db, user_in)


@router.get("/me", response_model=UserSchema)
async def read_current_user(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Récupère les informations de l'utilisateur connecté."""
    return current_user


@router.get("/permissions-matrix", response_model=list[RbacMatrixRowRead])
async def read_permissions_matrix(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Matrice RBAC effective (BDD ou fallback statique) - lecture pour l'UI."""
    return get_rbac_matrix_rows(db)


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Met à jour le profil de l'utilisateur connecté."""
    updated_user = UserRepository.update(db, current_user.id, user_in)
    return updated_user
