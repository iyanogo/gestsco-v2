from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserRepository:
    """Repository pour l'accès aux données des utilisateurs."""

    @staticmethod
    def get_by_id(db: Session, user_id: int) -> Optional[User]:
        """Récupère un utilisateur par son ID."""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Récupère un utilisateur par son email."""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Récupère tous les utilisateurs avec pagination."""
        return db.query(User).offset(skip).limit(limit).all()

    @staticmethod
    def get_active_by_roles(
        db: Session,
        roles: List[str],
        skip: int = 0,
        limit: int = 500,
    ) -> List[User]:
        """Utilisateurs actifs filtrés par rôle (sélection staff)."""
        if not roles:
            return []
        return (
            db.query(User)
            .filter(User.is_active.is_(True), User.role.in_(roles))
            .order_by(User.full_name, User.email)
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def create(db: Session, user_create: UserCreate) -> User:
        """Crée un nouvel utilisateur avec mot de passe hashé."""
        db_user = User(
            email=user_create.email,
            hashed_password=get_password_hash(user_create.password),
            full_name=user_create.full_name,
            role=user_create.role or "enseignant",
            is_active=user_create.is_active,
            is_superuser=user_create.is_superuser,
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update(db: Session, user_id: int, user_update: UserUpdate) -> Optional[User]:
        """Met à jour un utilisateur existant."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None
        
        update_data = user_update.model_dump(exclude_unset=True)
        if "password" in update_data and update_data["password"]:
            update_data["hashed_password"] = get_password_hash(update_data.pop("password"))
        elif "password" in update_data:
            del update_data["password"]
        
        for field, value in update_data.items():
            setattr(db_user, field, value)
        
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """Supprime un utilisateur par son ID."""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False
        db.delete(db_user)
        db.commit()
        return True

    @staticmethod
    def authenticate(db: Session, email: str, password: str) -> Optional[User]:
        """Authentifie un utilisateur avec email et mot de passe."""
        user = UserRepository.get_by_email(db, email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    def count(db: Session) -> int:
        """Compte le nombre total d'utilisateurs."""
        return db.query(User).count()
