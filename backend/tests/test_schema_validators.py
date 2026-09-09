"""Tests des validateurs Pydantic partagés (email, année académique)."""

from datetime import date, datetime

import pytest
from pydantic import ValidationError

from app.schemas.annee_academique import AnneeAcademiqueCreate
from app.schemas.inscription import InscriptionCreate
from app.schemas.user import User, UserCreate
from app.schemas.validators import validate_email_etablissement


class TestEmailEtablissement:
    def test_accepts_local_domain(self):
        assert validate_email_etablissement("etudiant@univ.test.local") == "etudiant@univ.test.local"

    def test_accepts_test_domain(self):
        assert validate_email_etablissement("e2e-manual@test.local") == "e2e-manual@test.local"

    def test_rejects_invalid_format(self):
        with pytest.raises(ValueError, match="invalide"):
            validate_email_etablissement("invalid-email")

    def test_user_schema_accepts_local_on_login_response(self):
        now = datetime(2025, 1, 1)
        user = User(
            id=1,
            email="user@test.local",
            full_name="Test",
            is_active=True,
            is_superuser=False,
            role="etudiant",
            created_at=now,
            updated_at=now,
        )
        assert user.email == "user@test.local"

    def test_user_create_accepts_local(self):
        payload = UserCreate(
            email="nouveau@test.local",
            password="password123",
            role="etudiant",
        )
        assert payload.email == "nouveau@test.local"


class TestAnneeAcademiqueFormat:
    def _base_annee_kwargs(self, *, code: str = "2025-2026"):
        return {
            "code": code,
            "libelle": "2025-2026",
            "date_debut": date(2025, 9, 1),
            "date_fin": date(2026, 8, 31),
            "date_debut_inscriptions": date(2025, 6, 1),
            "date_fin_inscriptions": date(2025, 10, 31),
        }

    def test_annee_academique_create_rejects_legacy_code(self):
        with pytest.raises(ValidationError):
            AnneeAcademiqueCreate(**self._base_annee_kwargs(code="E2E-MANUAL-2025"))

    def test_annee_academique_create_rejects_non_consecutive_years(self):
        with pytest.raises(ValidationError, match="année de fin"):
            AnneeAcademiqueCreate(**self._base_annee_kwargs(code="2025-2027"))

    def test_inscription_create_rejects_bad_annee(self):
        with pytest.raises(ValidationError):
            InscriptionCreate(
                etudiant_id=1,
                filiere_id=1,
                niveau_id=1,
                annee_academique="E2E-MANUAL-2025",
                type_inscription="nouvelle",
            )

    def test_inscription_create_accepts_valid_annee(self):
        payload = InscriptionCreate(
            etudiant_id=1,
            filiere_id=1,
            niveau_id=1,
            annee_academique="2025-2026",
            type_inscription="nouvelle",
        )
        assert payload.annee_academique == "2025-2026"
