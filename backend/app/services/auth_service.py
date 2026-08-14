from datetime import timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.models.user import User
from app.schemas.user import UserCreate, User as UserSchema
from app.repositories.user_repository import UserRepository


class AuthService:
    """Service pour l'authentification des utilisateurs."""

    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        """
        Authentifie un utilisateur et retourne un token JWT.
        
        Raises:
            HTTPException 401: Si les identifiants sont invalides
            HTTPException 400: Si l'utilisateur est inactif
        """
        user = UserRepository.authenticate(db, email, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Email ou mot de passe incorrect",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Utilisateur inactif",
            )
        
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": UserSchema.model_validate(user),
        }

    @staticmethod
    def register(db: Session, user_create: UserCreate) -> User:
        """
        Enregistre un nouvel utilisateur.
        
        Raises:
            HTTPException 400: Si l'email existe déjà
        """
        existing_user = UserRepository.get_by_email(db, user_create.email)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un utilisateur avec cet email existe déjà",
            )
        return UserRepository.create(db, user_create)

    @staticmethod
    def get_current_user(db: Session, token: str) -> User:
        """
        Récupère l'utilisateur courant à partir du token JWT.
        
        Raises:
            HTTPException 401: Si le token est invalide ou l'utilisateur non trouvé
        """
        token_data = decode_access_token(token)
        user = UserRepository.get_by_email(db, token_data.email)
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur non trouvé",
                headers={"WWW-Authenticate": "Bearer"},
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Utilisateur inactif",
                headers={"WWW-Authenticate": "Bearer"},
            )
        return user
