from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.validators import EmailEtablissement, OptionalEmailEtablissement


class UserBase(BaseModel):
    email: EmailEtablissement
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str
    role: str = "enseignant"
    is_active: bool = True
    is_superuser: bool = False

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class UserUpdate(BaseModel):
    email: OptionalEmailEtablissement = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[str] = None
    is_superuser: Optional[bool] = None

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and len(v) < 8:
            raise ValueError("Le mot de passe doit contenir au moins 8 caractères")
        return v


class UserInDB(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_superuser: bool
    role: str
    created_at: datetime
    updated_at: datetime


class User(UserInDB):
    pass


class UserSummary(BaseModel):
    """Projection minimale pour listes déroulantes (stages, examens, jury)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailEtablissement
    full_name: Optional[str] = None
    role: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
