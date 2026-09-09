"""
Test manuel utilisateurs - RBAC superuser (dev PostgreSQL).

Usage (depuis backend/) :
  python scripts/e2e_manual_test_users.py
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e")

from fastapi.testclient import TestClient

from app.main import app


def pp(title: str, data) -> None:
    print(f"\n{'='*60}\n{title}\n{'='*60}")
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str, ensure_ascii=False))
    else:
        print(data)


def login(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/api/v1/auth/login", data={"username": email, "password": password})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def main() -> None:
    client = TestClient(app)

    pp("1. Sans auth → 401", client.get("/api/v1/users/").status_code)

    admin_token = login(client, "admin@gestsco.com", "Admin@123")
    list_resp = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    pp("2. Superuser GET /users", {"status": list_resp.status_code, "count": len(list_resp.json())})

    scolarite_token = login(client, "scolarite@gestsco.com", "Scolarite@123")
    forbidden = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {scolarite_token}"},
    )
    pp("3. Scolarité GET /users → 403", forbidden.status_code)

    select_resp = client.get(
        "/api/v1/users/select",
        headers={"Authorization": f"Bearer {scolarite_token}"},
    )
    pp(
        "3b. Scolarité GET /users/select",
        {"status": select_resp.status_code, "count": len(select_resp.json())},
    )

    create_resp = client.post(
        "/api/v1/users/",
        json={
            "email": "e2e.manual.user@test.com",
            "password": "E2E-Manual-2026!",
            "full_name": "E2E Manual User",
            "role": "enseignant",
            "is_active": True,
            "is_superuser": False,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    pp("4. Superuser POST /users", {"status": create_resp.status_code, "body": create_resp.json()})

    if create_resp.status_code == 201:
        user_id = create_resp.json()["id"]
        delete_resp = client.delete(
            f"/api/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        pp("5. Cleanup DELETE", delete_resp.status_code)

    print("\n✅ Vérification manuelle utilisateurs terminée.")


if __name__ == "__main__":
    main()
