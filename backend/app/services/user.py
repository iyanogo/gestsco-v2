from typing import Optional, List

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.repositories.user import UserRepository
from app.core.security import verify_password


class UserService:
    def __init__(self, db: Session):
        self.repository = UserRepository(db)

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.repository.get_by_id(user_id)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.repository.get_by_email(email)

    def get_all(self, skip: int = 0, limit: int = 100) -> List[User]:
        return self.repository.get_all(skip=skip, limit=limit)

    def create(self, user_in: UserCreate) -> User:
        return self.repository.create(user_in)

    def update(self, user: User, user_in: UserUpdate) -> User:
        return self.repository.update(user, user_in)

    def delete(self, user: User) -> None:
        self.repository.delete(user)

    def authenticate(self, email: str, password: str) -> Optional[User]:
        user = self.repository.get_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def is_active(self, user: User) -> bool:
        return user.is_active

    def is_superuser(self, user: User) -> bool:
        return user.is_superuser
