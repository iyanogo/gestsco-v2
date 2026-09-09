"""Tests unitaires - logique backfill etudiant.user_id (sans base)."""

from app.core.security import get_password_hash
from app.models.etudiant import Etudiant
from app.models.user import User
from app.utils.etudiant_user_link import (
    BackfillReport,
    build_etudiant_email_conflicts,
    build_user_index,
    normalize_email,
    run_backfill,
)
from tests.conftest import next_id


class TestNormalizeEmail:
    def test_lowercase_and_trim(self):
        assert normalize_email("  User@Test.COM  ") == "user@test.com"

    def test_none_and_empty(self):
        assert normalize_email(None) is None
        assert normalize_email("") is None
        assert normalize_email("   ") is None


class TestBuildUserIndex:
    def test_groups_by_normalized_email(self):
        class FakeUser:
            def __init__(self, email):
                self.email = email

        index = build_user_index([FakeUser("A@x.com"), FakeUser(" a@X.COM ")])
        assert len(index["a@x.com"]) == 2


class TestDuplicateEtudiantEmails:
    def test_detects_duplicates(self):
        class FakeEtu:
            def __init__(self, email):
                self.email = email

        dupes = build_etudiant_email_conflicts(
            [FakeEtu("a@x.com"), FakeEtu("A@X.COM"), FakeEtu("b@y.com")]
        )
        assert dupes == {"a@x.com"}


class TestBackfillReport:
    def test_empty_report(self):
        report = BackfillReport()
        assert report.would_link == []
        assert report.linked == []


class TestRunBackfillIntegration:
    def test_links_by_normalized_email(self, db):
        user = User(
            email="Student@Test.COM",
            hashed_password=get_password_hash("password123"),
            full_name="Student Test",
            is_active=True,
            role="etudiant",
        )
        db.add(user)
        db.flush()
        etu = Etudiant(
            id=next_id(),
            matricule="BACKFILL-001",
            nom="TEST",
            prenom="Student",
            email=" student@test.com ",
            is_active=True,
        )
        db.add(etu)
        db.commit()

        dry_report = run_backfill(db, dry_run=True)
        assert len(dry_report.would_link) == 1
        assert dry_report.would_link[0]["user_id"] == user.id

        apply_report = run_backfill(db, dry_run=False)
        assert len(apply_report.linked) == 1
        db.refresh(etu)
        assert etu.user_id == user.id

        again = run_backfill(db, dry_run=False)
        assert len(again.linked) == 0
        assert len(again.already_linked) == 1

    def test_does_not_overwrite_existing_link(self, db):
        user = User(
            email="linked@test.com",
            hashed_password=get_password_hash("password123"),
            full_name="Linked",
            is_active=True,
            role="etudiant",
        )
        db.add(user)
        db.flush()
        etu = Etudiant(
            id=next_id(),
            user_id=user.id,
            matricule="LINKED-001",
            nom="A",
            prenom="B",
            email="linked@test.com",
            is_active=True,
        )
        db.add(etu)
        db.commit()

        report = run_backfill(db, dry_run=False)
        assert report.linked == []
        assert len(report.already_linked) == 1
