"""Tests API Administration - superuser uniquement."""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.security import get_password_hash
from app.models.audit_event import AuditEvent
from app.models.system_log import SystemLog
from app.models.user import User
from app.utils.administration_events import record_audit_event, record_system_log


def _login(client: TestClient, email: str, password: str) -> str:
    response = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def scolarite_token(client: TestClient, db: Session) -> str:
    user = User(
        email="scolarite-admin@test.com",
        hashed_password=get_password_hash("password123"),
        full_name="Scolarité",
        is_active=True,
        is_superuser=False,
        role="scolarite",
    )
    db.add(user)
    db.commit()
    return _login(client, "scolarite-admin@test.com", "password123")


class TestAdministrationRbac:
    def test_unauthenticated_logs_401(self, client: TestClient):
        assert client.get("/api/v1/administration/logs").status_code == 401

    def test_non_superuser_forbidden(self, client: TestClient, scolarite_token: str):
        headers = {"Authorization": f"Bearer {scolarite_token}"}
        assert client.get("/api/v1/administration/logs", headers=headers).status_code == 403
        assert client.get("/api/v1/administration/audit", headers=headers).status_code == 403
        assert client.get("/api/v1/administration/backups", headers=headers).status_code == 403

    def test_superuser_can_list_logs(self, client: TestClient, admin_token: str, db: Session):
        record_system_log(
            db,
            level="INFO",
            source="test",
            message="Log de test",
            action="test_action",
        )
        db.commit()

        response = client.get(
            "/api/v1/administration/logs",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
        assert any(item["message"] == "Log de test" for item in data)

    def test_logs_summary(self, client: TestClient, admin_token: str, db: Session):
        record_system_log(db, level="ERROR", source="test", message="Erreur test")
        db.commit()
        response = client.get(
            "/api/v1/administration/logs/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total"] >= 1
        assert body["error"] >= 1

    def test_audit_events(self, client: TestClient, admin_token: str, db: Session):
        record_audit_event(
            db,
            action="update",
            entity_type="user",
            entity_id="1",
            user_email="admin@test.com",
            new_values={"role": "admin"},
        )
        db.commit()
        response = client.get(
            "/api/v1/administration/audit",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert any(item["action"] == "update" for item in response.json())

    def test_permissions_matrix(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/administration/permissions/matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        rows = response.json()
        assert len(rows) > 0
        assert any(row["module"] == "finances" for row in rows)

    def test_permissions_summary(self, client: TestClient, admin_token: str, admin_user: User):
        response = client.get(
            "/api/v1/administration/permissions/summary",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["total_users"] >= 1
        assert body["superuser_count"] >= 1

    def test_login_creates_log_and_audit(self, client: TestClient, admin_user: User, db: Session):
        client.post(
            "/api/v1/auth/login",
            data={"username": "admin@test.com", "password": "adminpassword123"},
        )
        logs = client.get(
            "/api/v1/administration/logs",
            headers={"Authorization": f"Bearer {_login(client, 'admin@test.com', 'adminpassword123')}"},
        ).json()
        assert any(item["source"] == "auth" and item["action"] == "login" for item in logs)

        audit = client.get(
            "/api/v1/administration/audit",
            headers={"Authorization": f"Bearer {_login(client, 'admin@test.com', 'adminpassword123')}"},
        ).json()
        assert any(item["action"] == "login" for item in audit)

    def test_list_backups_empty(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/administration/backups",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestAdministrationRetention:
    def test_purge_logs_requires_confirm(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/administration/logs/purge",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"older_than_days": 90, "confirm_phrase": "wrong"},
        )
        assert response.status_code == 400

    def test_purge_logs_deletes_old_entries(self, client: TestClient, admin_token: str, db: Session):
        old = SystemLog(
            level="INFO",
            source="test",
            message="Log ancien à purger",
            created_at=datetime.utcnow() - timedelta(days=120),
        )
        recent = SystemLog(
            level="INFO",
            source="test",
            message="Log récent à conserver",
            created_at=datetime.utcnow() - timedelta(days=1),
        )
        db.add_all([old, recent])
        db.commit()

        response = client.post(
            "/api/v1/administration/logs/purge",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"older_than_days": 90, "confirm_phrase": "PURGER"},
        )
        assert response.status_code == 200
        body = response.json()
        assert body["deleted_count"] >= 1

        remaining = db.query(SystemLog).filter(SystemLog.message.like("Log %")).all()
        assert any(item.message == "Log récent à conserver" for item in remaining)
        assert not any(item.message == "Log ancien à purger" for item in remaining)

    def test_purge_audit_requires_confirm(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/administration/audit/purge",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"older_than_days": 365, "confirm_phrase": "wrong"},
        )
        assert response.status_code == 400

    def test_purge_audit_deletes_old_entries(self, client: TestClient, admin_token: str, db: Session):
        old = AuditEvent(
            action="update",
            entity_type="user",
            entity_id="old",
            user_email="admin@test.com",
            created_at=datetime.utcnow() - timedelta(days=400),
        )
        recent = AuditEvent(
            action="update",
            entity_type="user",
            entity_id="recent",
            user_email="admin@test.com",
            created_at=datetime.utcnow() - timedelta(days=1),
        )
        db.add_all([old, recent])
        db.commit()

        response = client.post(
            "/api/v1/administration/audit/purge",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"older_than_days": 365, "confirm_phrase": "PURGER"},
        )
        assert response.status_code == 200
        assert response.json()["deleted_count"] >= 1
        assert db.query(AuditEvent).filter(AuditEvent.entity_id == "old").count() == 0
        assert db.query(AuditEvent).filter(AuditEvent.entity_id == "recent").count() == 1


class TestAdministrationRestore:
    def test_restore_requires_confirm(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/administration/backups/999/restore",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"confirm_phrase": "wrong"},
        )
        assert response.status_code == 400

    def test_restore_not_found(self, client: TestClient, admin_token: str):
        response = client.post(
            "/api/v1/administration/backups/999/restore",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"confirm_phrase": "RESTAURER"},
        )
        assert response.status_code == 404


class TestRbacMatrixEditable:
    def test_matrix_seeds_from_static(self, client: TestClient, admin_token: str):
        response = client.get(
            "/api/v1/administration/permissions/matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        rows = response.json()
        assert len(rows) > 0
        assert any(r["module"] == "finances" and r["action"] == "read" for r in rows)

    def test_update_matrix_persists(self, client: TestClient, admin_token: str):
        matrix = client.get(
            "/api/v1/administration/permissions/matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
        ).json()
        users_read = next(
            r for r in matrix if r["module"] == "utilisateurs" and r["action"] == "read"
        )
        assert users_read["roles"] == ["superadmin"]
        updated_roles = ["superadmin", "admin"]
        payload = {
            "rows": [
                {"module": r["module"], "action": r["action"], "roles": r["roles"]}
                if not (r["module"] == "utilisateurs" and r["action"] == "read")
                else {"module": "utilisateurs", "action": "read", "roles": updated_roles}
                for r in matrix
            ]
        }
        put = client.put(
            "/api/v1/administration/permissions/matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
            json=payload,
        )
        assert put.status_code == 200
        users_row = next(
            r for r in put.json() if r["module"] == "utilisateurs" and r["action"] == "read"
        )
        assert set(users_row["roles"]) == set(updated_roles)

        audit = client.get(
            "/api/v1/administration/audit",
            headers={"Authorization": f"Bearer {admin_token}"},
            params={"entity_type": "rbac_permission"},
        ).json()
        assert any(e["action"] == "update" for e in audit)

    def test_update_matrix_rejects_unknown_module(self, client: TestClient, admin_token: str):
        response = client.put(
            "/api/v1/administration/permissions/matrix",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"rows": [{"module": "unknown", "action": "read", "roles": ["admin"]}]},
        )
        assert response.status_code == 400
