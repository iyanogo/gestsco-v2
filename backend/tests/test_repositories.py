"""
Tests unitaires pour les repositories.
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models import Universite, Etablissement, Cycle, Niveau
from app.schemas.universite import UniversiteCreate, UniversiteUpdate
from app.schemas.cycle import CycleCreate
from app.repositories import (
    universite_repository,
    etablissement_repository,
    cycle_repository,
)

# Base de données de test en mémoire
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def setup_database():
    """Crée les tables avant chaque test et les supprime après."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """Fournit une session de base de données pour les tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


class TestBaseRepository:
    """Tests pour BaseRepository via UniversiteRepository."""

    def test_create_entity(self, db):
        """Test de création d'une entité."""
        universite_in = UniversiteCreate(
            code="TEST-UNI",
            libelle="Université de Test",
            sigle="UT",
        )
        universite = universite_repository.create(db, universite_in)

        assert universite.id is not None
        assert universite.code == "TEST-UNI"
        assert universite.libelle == "Université de Test"
        assert universite.sigle == "UT"
        assert universite.is_active is True
        assert universite.created_at is not None

    def test_get_by_id(self, db):
        """Test de récupération par ID."""
        universite_in = UniversiteCreate(
            code="GET-ID",
            libelle="Université Get ID",
        )
        created = universite_repository.create(db, universite_in)

        found = universite_repository.get_by_id(db, created.id)
        assert found is not None
        assert found.id == created.id
        assert found.code == "GET-ID"

    def test_get_by_id_not_found(self, db):
        """Test de récupération par ID non existant."""
        found = universite_repository.get_by_id(db, 99999)
        assert found is None

    def test_get_by_code(self, db):
        """Test de récupération par code."""
        universite_in = UniversiteCreate(
            code="GET-CODE",
            libelle="Université Get Code",
        )
        universite_repository.create(db, universite_in)

        found = universite_repository.get_by_code(db, "GET-CODE")
        assert found is not None
        assert found.code == "GET-CODE"

    def test_get_by_code_not_found(self, db):
        """Test de récupération par code non existant."""
        found = universite_repository.get_by_code(db, "NON-EXISTANT")
        assert found is None

    def test_get_all(self, db):
        """Test de récupération de toutes les entités."""
        for i in range(5):
            universite_in = UniversiteCreate(
                code=f"UNI-{i}",
                libelle=f"Université {i}",
            )
            universite_repository.create(db, universite_in)

        all_unis = universite_repository.get_all(db)
        assert len(all_unis) == 5

    def test_get_all_with_pagination(self, db):
        """Test de récupération avec pagination."""
        for i in range(10):
            universite_in = UniversiteCreate(
                code=f"UNI-PAG-{i}",
                libelle=f"Université Pagination {i}",
            )
            universite_repository.create(db, universite_in)

        page1 = universite_repository.get_all(db, skip=0, limit=5)
        page2 = universite_repository.get_all(db, skip=5, limit=5)

        assert len(page1) == 5
        assert len(page2) == 5

    def test_get_count(self, db):
        """Test du comptage des entités."""
        for i in range(3):
            universite_in = UniversiteCreate(
                code=f"UNI-COUNT-{i}",
                libelle=f"Université Count {i}",
            )
            universite_repository.create(db, universite_in)

        count = universite_repository.get_count(db)
        assert count == 3

    def test_update_entity(self, db):
        """Test de mise à jour d'une entité."""
        universite_in = UniversiteCreate(
            code="UPDATE-TEST",
            libelle="Université à Mettre à Jour",
        )
        created = universite_repository.create(db, universite_in)

        update_data = UniversiteUpdate(libelle="Université Mise à Jour")
        updated = universite_repository.update(db, created.id, update_data)

        assert updated is not None
        assert updated.libelle == "Université Mise à Jour"
        assert updated.code == "UPDATE-TEST"  # Non modifié

    def test_update_entity_not_found(self, db):
        """Test de mise à jour d'une entité non existante."""
        update_data = UniversiteUpdate(libelle="Test")
        updated = universite_repository.update(db, 99999, update_data)
        assert updated is None

    def test_delete_entity_logical(self, db):
        """Test de suppression logique d'une entité."""
        universite_in = UniversiteCreate(
            code="DELETE-TEST",
            libelle="Université à Supprimer",
        )
        created = universite_repository.create(db, universite_in)

        result = universite_repository.delete(db, created.id)
        assert result is True

        # Vérifier que l'entité est inactive
        found = universite_repository.get_by_id(db, created.id)
        assert found is not None
        assert found.is_active is False

    def test_delete_entity_not_found(self, db):
        """Test de suppression d'une entité non existante."""
        result = universite_repository.delete(db, 99999)
        assert result is False

    def test_hard_delete_entity(self, db):
        """Test de suppression physique d'une entité."""
        universite_in = UniversiteCreate(
            code="HARD-DELETE",
            libelle="Université à Supprimer Physiquement",
        )
        created = universite_repository.create(db, universite_in)

        result = universite_repository.hard_delete(db, created.id)
        assert result is True

        # Vérifier que l'entité n'existe plus
        found = universite_repository.get_by_id(db, created.id)
        assert found is None

    def test_search_entity(self, db):
        """Test de recherche d'entités."""
        universite_repository.create(
            db,
            UniversiteCreate(code="SEARCH-1", libelle="Université de Paris"),
        )
        universite_repository.create(
            db,
            UniversiteCreate(code="SEARCH-2", libelle="Université de Lyon"),
        )
        universite_repository.create(
            db,
            UniversiteCreate(code="PARIS-3", libelle="Autre Établissement"),
        )

        # Recherche par libelle
        results = universite_repository.search(db, "Paris")
        assert len(results) == 2

        # Recherche par code
        results = universite_repository.search(db, "SEARCH")
        assert len(results) == 2

    def test_code_exists(self, db):
        """Test de vérification d'existence de code."""
        universite_repository.create(
            db,
            UniversiteCreate(code="EXISTS-CODE", libelle="Test"),
        )

        assert universite_repository.code_exists(db, "EXISTS-CODE") is True
        assert universite_repository.code_exists(db, "NOT-EXISTS") is False


class TestUniversiteRepository:
    """Tests spécifiques pour UniversiteRepository."""

    def test_get_with_etablissements(self, db):
        """Test de récupération d'une université avec ses établissements."""
        # Créer une université
        universite_in = UniversiteCreate(
            code="UNI-ETAB",
            libelle="Université avec Établissements",
        )
        universite = universite_repository.create(db, universite_in)

        # Créer des établissements
        from app.schemas.etablissement import EtablissementCreate

        for i in range(3):
            etab_in = EtablissementCreate(
                code=f"ETAB-{i}",
                libelle=f"Établissement {i}",
                universite_id=universite.id,
            )
            etablissement_repository.create(db, etab_in)

        # Récupérer l'université avec ses établissements
        uni_with_etabs = universite_repository.get_with_etablissements(db, universite.id)

        assert uni_with_etabs is not None
        assert len(uni_with_etabs.etablissements) == 3


class TestCycleRepository:
    """Tests spécifiques pour CycleRepository."""

    def test_get_ordered(self, db):
        """Test de récupération des cycles triés par ordre."""
        # Créer les cycles dans le désordre
        cycle_repository.create(
            db,
            CycleCreate(code="M", libelle="Master", duree_annees=2, ordre=2),
        )
        cycle_repository.create(
            db,
            CycleCreate(code="D", libelle="Doctorat", duree_annees=3, ordre=3),
        )
        cycle_repository.create(
            db,
            CycleCreate(code="L", libelle="Licence", duree_annees=3, ordre=1),
        )

        # Récupérer les cycles triés
        cycles = cycle_repository.get_ordered(db)

        assert len(cycles) == 3
        assert cycles[0].code == "L"
        assert cycles[1].code == "M"
        assert cycles[2].code == "D"

    def test_get_with_niveaux(self, db):
        """Test de récupération d'un cycle avec ses niveaux."""
        from app.schemas.niveau import NiveauCreate
        from app.repositories import niveau_repository

        # Créer un cycle
        cycle = cycle_repository.create(
            db,
            CycleCreate(code="L", libelle="Licence", duree_annees=3, ordre=1),
        )

        # Créer des niveaux
        for i in range(1, 4):
            niveau_repository.create(
                db,
                NiveauCreate(
                    code=f"L{i}",
                    libelle=f"Licence {i}",
                    cycle_id=cycle.id,
                    annee=i,
                    ordre=i,
                ),
            )

        # Récupérer le cycle avec ses niveaux
        cycle_with_niveaux = cycle_repository.get_with_niveaux(db, cycle.id)

        assert cycle_with_niveaux is not None
        assert len(cycle_with_niveaux.niveaux) == 3
