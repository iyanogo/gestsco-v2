"""Tests unitaires pour les repositories."""

from app.repositories import cycle_repository, etablissement_repository, universite_repository
from app.schemas.cycle import CycleCreate
from app.schemas.etablissement import EtablissementCreate
from app.schemas.universite import UniversiteCreate, UniversiteUpdate
from tests.conftest import next_id


class TestBaseRepository:
    def test_create_entity(self, db):
        universite_in = UniversiteCreate(
            code="TEST-UNI",
            nom="Université de Test",
            sigle="UT",
        )
        universite = universite_repository.create(db, universite_in)

        assert universite.id is not None
        assert universite.code == "TEST-UNI"
        assert universite.nom == "Université de Test"
        assert universite.sigle == "UT"

    def test_get_by_id(self, db):
        universite_in = UniversiteCreate(code="GET-ID", nom="Université Get ID")
        created = universite_repository.create(db, universite_in)

        found = universite_repository.get_by_id(db, created.id)
        assert found is not None
        assert found.id == created.id
        assert found.code == "GET-ID"

    def test_get_by_id_not_found(self, db):
        found = universite_repository.get_by_id(db, 99999)
        assert found is None

    def test_get_by_code(self, db):
        universite_repository.create(
            db, UniversiteCreate(code="GET-CODE", nom="Université Get Code")
        )
        found = universite_repository.get_by_code(db, "GET-CODE")
        assert found is not None
        assert found.code == "GET-CODE"

    def test_get_by_code_not_found(self, db):
        found = universite_repository.get_by_code(db, "NON-EXISTANT")
        assert found is None

    def test_get_all(self, db):
        for i in range(5):
            universite_repository.create(
                db, UniversiteCreate(code=f"UNI-{i}", nom=f"Université {i}")
            )
        assert len(universite_repository.get_all(db)) == 5

    def test_get_all_with_pagination(self, db):
        for i in range(10):
            universite_repository.create(
                db, UniversiteCreate(code=f"UNI-PAG-{i}", nom=f"Université Pagination {i}")
            )
        page1 = universite_repository.get_all(db, skip=0, limit=5)
        page2 = universite_repository.get_all(db, skip=5, limit=5)
        assert len(page1) == 5
        assert len(page2) == 5

    def test_get_count(self, db):
        for i in range(3):
            universite_repository.create(
                db, UniversiteCreate(code=f"UNI-COUNT-{i}", nom=f"Université Count {i}")
            )
        assert universite_repository.get_count(db) == 3

    def test_update_entity(self, db):
        created = universite_repository.create(
            db,
            UniversiteCreate(code="UPDATE-TEST", nom="Université à Mettre à Jour"),
        )
        updated = universite_repository.update(
            db, created.id, UniversiteUpdate(nom="Université Mise à Jour")
        )
        assert updated is not None
        assert updated.nom == "Université Mise à Jour"
        assert updated.code == "UPDATE-TEST"

    def test_update_entity_not_found(self, db):
        updated = universite_repository.update(
            db, 99999, UniversiteUpdate(nom="Test")
        )
        assert updated is None

    def test_delete_entity_physical(self, db):
        created = universite_repository.create(
            db,
            UniversiteCreate(code="DELETE-TEST", nom="Université à Supprimer"),
        )
        assert universite_repository.delete(db, created.id) is True
        assert universite_repository.get_by_id(db, created.id) is None

    def test_delete_entity_not_found(self, db):
        assert universite_repository.delete(db, 99999) is False

    def test_hard_delete_entity(self, db):
        created = universite_repository.create(
            db,
            UniversiteCreate(code="HARD-DELETE", nom="Université à Supprimer Physiquement"),
        )
        assert universite_repository.hard_delete(db, created.id) is True
        assert universite_repository.get_by_id(db, created.id) is None

    def test_search_entity(self, db):
        universite_repository.create(
            db, UniversiteCreate(code="SEARCH-1", nom="Université de Paris")
        )
        universite_repository.create(
            db, UniversiteCreate(code="SEARCH-2", nom="Université de Lyon")
        )
        universite_repository.create(
            db, UniversiteCreate(code="PARIS-3", nom="Autre Établissement")
        )
        assert len(universite_repository.search(db, "Paris")) == 2
        assert len(universite_repository.search(db, "SEARCH")) == 2

    def test_code_exists(self, db):
        universite_repository.create(
            db, UniversiteCreate(code="EXISTS-CODE", nom="Test")
        )
        assert universite_repository.code_exists(db, "EXISTS-CODE") is True
        assert universite_repository.code_exists(db, "NOT-EXISTS") is False


class TestUniversiteRepository:
    def test_get_with_etablissements(self, db):
        universite = universite_repository.create(
            db,
            UniversiteCreate(code="UNI-ETAB", nom="Université avec Établissements"),
        )
        for i in range(3):
            etablissement_repository.create(
                db,
                EtablissementCreate(
                    code=f"ETAB-{i}",
                    nom=f"Établissement {i}",
                    universite_id=universite.id,
                ),
            )
        uni_with_etabs = universite_repository.get_with_etablissements(db, universite.id)
        assert uni_with_etabs is not None
        assert len(uni_with_etabs.etablissements) == 3


class TestCycleRepository:
    def test_get_ordered(self, db):
        cycle_repository.create(db, CycleCreate(code="M", libelle="Master"))
        cycle_repository.create(db, CycleCreate(code="D", libelle="Doctorat"))
        cycle_repository.create(db, CycleCreate(code="L", libelle="Licence"))

        cycles = cycle_repository.get_ordered(db)
        assert len(cycles) == 3
        assert [cycle.code for cycle in cycles] == ["D", "L", "M"]

    def test_get_by_id(self, db):
        cycle = cycle_repository.create(
            db, CycleCreate(code="L", libelle="Licence")
        )
        found = cycle_repository.get_by_id(db, cycle.id)
        assert found is not None
        assert found.code == "L"
