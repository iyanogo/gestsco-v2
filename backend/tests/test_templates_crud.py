"""Tests CRUD templates - mapping en_tete_html et preview HTML."""

import pytest
from fastapi.testclient import TestClient


TEMPLATE_PAYLOAD = {
    "code": "TPL_CRUD_TEST",
    "libelle": "Template test CRUD",
    "type_document": "autre",
    "template_html": "<p>Bonjour {{ nom }}</p>",
    "en_tete_html": "<header>En-tête {{ nom }}</header>",
    "pied_page_html": "<footer>Pied de page</footer>",
}


class TestTemplatesCrud:
    def test_superuser_can_create_template_with_en_tete_html(
        self, client: TestClient, admin_token: str
    ):
        response = client.post(
            "/api/v1/templates/",
            json=TEMPLATE_PAYLOAD,
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 201, response.text
        data = response.json()
        assert data["en_tete_html"] == TEMPLATE_PAYLOAD["en_tete_html"]
        assert data["pied_page_html"] == TEMPLATE_PAYLOAD["pied_page_html"]

    def test_template_preview_renders_en_tete_html(
        self, client: TestClient, admin_token: str
    ):
        create = client.post(
            "/api/v1/templates/",
            json={**TEMPLATE_PAYLOAD, "code": "TPL_PREVIEW_TEST"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert create.status_code == 201, create.text
        template_id = create.json()["id"]

        preview = client.post(
            f"/api/v1/templates/{template_id}/preview",
            json={"variables": {"nom": "Dupont"}},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert preview.status_code == 200, preview.text
        html = preview.text
        assert "En-tête Dupont" in html
        assert "Bonjour Dupont" in html
        assert "Pied de page" in html


class TestBaremesMentionCrud:
    def test_superuser_can_create_bareme_and_mention(
        self, client: TestClient, admin_token: str
    ):
        bareme_resp = client.post(
            "/api/v1/baremes/",
            json={
                "code": "BAREME_MENTION_TEST",
                "libelle": "Barème mention test",
                "note_min": "0",
                "note_max": "20",
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert bareme_resp.status_code == 201, bareme_resp.text
        bareme_id = bareme_resp.json()["id"]

        mention_resp = client.post(
            f"/api/v1/baremes/{bareme_id}/mentions",
            json={
                "bareme_id": bareme_id,
                "code": "TB",
                "libelle": "Très Bien",
                "note_min": 16,
                "note_max": 20,
                "couleur": "#4CAF50",
                "ordre": 1,
            },
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert mention_resp.status_code == 201, mention_resp.text
        assert mention_resp.json()["libelle"] == "Très Bien"

        get_resp = client.get(
            f"/api/v1/baremes/{bareme_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert get_resp.status_code == 200
        mentions = get_resp.json().get("mentions", [])
        assert any(m["code"] == "TB" for m in mentions)
