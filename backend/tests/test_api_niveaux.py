"""Tests d'intégration pour les endpoints API des niveaux."""


class TestCreateNiveau:
    def test_create_niveau_without_cycle(self, client, admin_token):
        response = client.post(
            "/api/v1/niveaux/",
            json={"code": "NIV-TEST", "libelle": "Niveau test"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201
        assert response.json()["code"] == "NIV-TEST"
