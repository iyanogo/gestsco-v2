"""
Fixtures partagées pour la suite de tests backend.
"""
import itertools
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import BigInteger, create_engine, event
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.core.security import get_password_hash

# Import de tous les modèles pour enregistrer les tables dans Base.metadata
import app.models  # noqa: F401
from app.models import User, Universite


@compiles(BigInteger, "sqlite")
def _compile_bigint_sqlite(type_, compiler, **kw):
    """Compatibilité SQLite : BigInteger → INTEGER autoincrement."""
    return "INTEGER"


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

_id_counter = itertools.count(1)


def _override_get_db() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def _configure_app_db():
    """Override les deux stacks get_db (deps + dependencies + core.database)."""
    from app.main import app
    from app.api import deps, dependencies
    from app.core import database as core_database

    app.dependency_overrides[deps.get_db] = _override_get_db
    app.dependency_overrides[dependencies.get_db] = _override_get_db
    app.dependency_overrides[core_database.get_db] = _override_get_db
    yield
    app.dependency_overrides.clear()


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db() -> Generator[Session, None, None]:
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    return TestClient(app)


@pytest.fixture
def admin_user(db: Session) -> User:
    user = User(
        email="admin@test.com",
        hashed_password=get_password_hash("adminpassword123"),
        full_name="Admin Test",
        is_active=True,
        is_superuser=True,
        role="admin",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def normal_user(db: Session) -> User:
    user = User(
        email="user@test.com",
        hashed_password=get_password_hash("userpassword123"),
        full_name="User Test",
        is_active=True,
        is_superuser=False,
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(client: TestClient, admin_user: User) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "admin@test.com", "password": "adminpassword123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def user_token(client: TestClient, normal_user: User) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "user@test.com", "password": "userpassword123"},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def sample_universite(db: Session) -> Universite:
    universite = Universite(
        id=next(_id_counter),
        code="UO",
        nom="Université de Ouagadougou",
        sigle="UO",
    )
    db.add(universite)
    db.commit()
    db.refresh(universite)
    return universite


def next_id() -> int:
    return next(_id_counter)
