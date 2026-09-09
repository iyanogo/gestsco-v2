"""Tests d'intégration pour les endpoints API des filières."""

from app.models.etablissement import Etablissement
from tests.conftest import next_id


def _sample_etablissement(db, universite_id: int) -> Etablissement:
    etab = Etablissement(
        id=next_id(),
        code="ETB-TEST",
        nom="Établissement test",
        universite_id=universite_id,
    )
    db.add(etab)
    db.commit()
    db.refresh(etab)
    return etab


class TestCreateFiliere:
    def test_create_filiere_with_etablissement(self, client, admin_token, db, sample_universite):
        etab = _sample_etablissement(db, sample_universite.id)
        response = client.post(
            "/api/v1/filieres/",
            json={
                "code": "FIL-NEW",
                "libelle": "Filière test",
                "etablissement_id": etab.id,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["code"] == "FIL-NEW"
        assert data["etablissement_id"] == etab.id

    def test_create_filiere_invalid_etablissement(self, client, admin_token):
        response = client.post(
            "/api/v1/filieres/",
            json={"code": "FIL-BAD", "libelle": "Sans établissement", "etablissement_id": 99999},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 400
        assert "Établissement" in response.json()["detail"]

    def test_create_filiere_without_etablissement_ok(self, client, admin_token):
        response = client.post(
            "/api/v1/filieres/",
            json={"code": "FIL-ORPHAN", "libelle": "Filière autonome"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201


class TestGetFilieres:
    def test_filter_by_etablissement(self, client, admin_token, db, sample_universite):
        from app.models.filiere import Filiere

        etab = _sample_etablissement(db, sample_universite.id)
        db.add(
            Filiere(
                id=next_id(),
                code="FIL-FILTER",
                libelle="Filière filtrée",
                etablissement_id=etab.id,
            )
        )
        db.commit()

        response = client.get(
            f"/api/v1/filieres/?etablissement_id={etab.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        codes = {f["code"] for f in response.json()}
        assert "FIL-FILTER" in codes
