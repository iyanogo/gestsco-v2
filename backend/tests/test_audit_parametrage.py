"""Tests d'intégration audit - paramétrage."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent


def test_create_parametre_records_audit_event(
    client: TestClient, admin_token: str, db: Session
):
    response = client.post(
        "/api/v1/parametres/",
        json={
            "categorie": "general",
            "cle": "audit_test_param",
            "valeur": "42",
            "type_valeur": "integer",
            "libelle": "Param audit test",
            "est_modifiable": True,
            "est_visible": True,
            "ordre_affichage": 1,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201, response.text
    parametre_id = response.json()["id"]

    event = (
        db.query(AuditEvent)
        .filter(
            AuditEvent.entity_type == "parametre",
            AuditEvent.entity_id == str(parametre_id),
            AuditEvent.action == "create",
        )
        .first()
    )
    assert event is not None
    assert event.new_values["cle"] == "audit_test_param"
    assert event.user_email == "admin@test.com"
