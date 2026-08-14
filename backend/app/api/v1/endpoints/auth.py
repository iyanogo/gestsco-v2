from typing import Any

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User
from app.schemas.user import Token, User as UserSchema, UserCreate, UserUpdate
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    db: Session = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    Authentification et obtention du token JWT.
    
    - **username**: Email de l'utilisateur
    - **password**: Mot de passe de l'utilisateur
    """
    result = AuthService.login(db, form_data.username, form_data.password)
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


@router.put("/me", response_model=UserSchema)
async def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """Met à jour le profil de l'utilisateur connecté."""
    updated_user = UserRepository.update(db, current_user.id, user_in)
    return updated_user
