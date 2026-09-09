"""
Vérification E2E portail enseignant - préparation compte + données de référence.

Usage (depuis backend/) :
  python scripts/e2e_portail_enseignant_verify.py setup
  python scripts/e2e_portail_enseignant_verify.py inspect
  python scripts/e2e_portail_enseignant_verify.py api
  python scripts/e2e_portail_enseignant_verify.py notes-api
  python scripts/e2e_portail_enseignant_verify.py notes-api

Prérequis : données E2E-MANUAL (e2e_manual_test_resultats.py) pour étudiant / matières / année.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import date, timedelta, time
from typing import Any

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e-portail-ens")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.annee_academique import AnneeAcademique
from app.models.creneau_horaire import CreneauHoraire
from app.models.etudiant import Etudiant
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.seance import Seance
from app.models.stage import Stage
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.session_examen import SessionExamen
from app.models.user import User

E2E_TEACHER_EMAIL = "e2e-teacher@example.com"
E2E_TEACHER_B_EMAIL = "e2e-teacher-b@example.com"
E2E_PASSWORD = "E2E-Portail-2026!"
E2E_STUDENT_MATRICULE = "E2E-MANUAL-001"
PREFIX = "E2E-PORTAIL-ENS"
E2E_MATIERE_CODE = "E2E-MANUAL-MAT-11"
E2E_SESSION_CODE = "E2E-MANUAL-S1"
E2E_TEACHER_NOTE_CC = 14.5
E2E_TYPE_EVAL_TEACHER = "controle_continu"
API_BASE = os.environ.get("API_BASE", "http://127.0.0.1:8000")


def pp(title: str, data: Any) -> None:
    print(f"\n{'=' * 60}")
    print(title)
    print("=" * 60)
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str, ensure_ascii=False))
    else:
        print(data)


def _ensure_teacher(db, email: str, full_name: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            hashed_password=get_password_hash(E2E_PASSWORD),
            full_name=full_name,
            role="enseignant",
            is_active=True,
            is_superuser=False,
        )
        db.add(user)
        db.flush()
    else:
        user.hashed_password = get_password_hash(E2E_PASSWORD)
        user.role = "enseignant"
        user.is_active = True
        user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def _ensure_creneau(db) -> CreneauHoraire:
    creneau = db.query(CreneauHoraire).filter(CreneauHoraire.code == f"{PREFIX}-AM").first()
    if not creneau:
        creneau = CreneauHoraire(
            code=f"{PREFIX}-AM",
            libelle="E2E Matin 08h-10h",
            heure_debut=time(8, 0),
            heure_fin=time(10, 0),
            periode="matin",
            ordre=1,
            duree_minutes=120,
        )
        db.add(creneau)
        db.flush()
    return creneau


def cmd_setup(db) -> None:
    teacher = _ensure_teacher(db, E2E_TEACHER_EMAIL, "Prof E2E Portail")
    teacher_b = _ensure_teacher(db, E2E_TEACHER_B_EMAIL, "Prof E2E Portail B")

    etu = db.query(Etudiant).filter(Etudiant.matricule == E2E_STUDENT_MATRICULE).first()
    if not etu:
        raise SystemExit(
            f"Étudiant {E2E_STUDENT_MATRICULE} introuvable - lancez e2e_manual_test_resultats.py d'abord."
        )

    annee = (
        db.query(AnneeAcademique)
        .filter(AnneeAcademique.code == "2025-2026")
        .first()
    )
    if not annee:
        annee = db.query(AnneeAcademique).filter(AnneeAcademique.is_current == True).first()
    if not annee:
        raise SystemExit("Aucune année académique en base.")

    niveau = db.query(Niveau).filter(Niveau.code.like("E2E-MANUAL%")).first()
    if not niveau:
        niveau = db.query(Niveau).first()
    matiere = db.query(Matiere).filter(Matiere.code == E2E_MATIERE_CODE).first()
    if not matiere:
        matiere = db.query(Matiere).filter(Matiere.code.like("E2E-MANUAL%")).first()
    if not matiere:
        matiere = db.query(Matiere).first()
    if not niveau or not matiere:
        raise SystemExit("Niveau ou matière introuvable en base.")

    insc = (
        db.query(Inscription)
        .filter(Inscription.etudiant_id == etu.id, Inscription.is_active == True)
        .first()
    )
    filiere_id = insc.filiere_id if insc else None
    if insc:
        im = (
            db.query(InscriptionMatiere)
            .filter(
                InscriptionMatiere.inscription_id == insc.id,
                InscriptionMatiere.matiere_id == matiere.id,
            )
            .first()
        )
        if not im:
            db.add(
                InscriptionMatiere(
                    inscription_id=insc.id,
                    matiere_id=matiere.id,
                    semestre=1,
                    is_active=True,
                )
            )

    creneau = _ensure_creneau(db)
    today = date.today()
    jour_semaine = today.isoweekday()

    seance = db.query(Seance).filter(Seance.code == f"{PREFIX}-SEANCE-01").first()
    if not seance:
        seance = Seance(
            code=f"{PREFIX}-SEANCE-01",
            matiere_id=matiere.id,
            niveau_id=niveau.id,
            filiere_id=filiere_id,
            enseignant_id=teacher.id,
            creneau_id=creneau.id,
            type_seance="cours",
            date_seance=today,
            jour_semaine=jour_semaine,
            semestre=1,
            annee_academique_id=annee.id,
            duree_minutes=120,
            statut="confirmee",
        )
        db.add(seance)
    else:
        seance.enseignant_id = teacher.id
        seance.date_seance = today
        seance.jour_semaine = jour_semaine
        seance.matiere_id = matiere.id
        seance.niveau_id = niveau.id
        seance.filiere_id = filiere_id
        seance.annee_academique_id = annee.id

    # Séance demain pour le dashboard « autres séances »
    demain = today + timedelta(days=1)
    seance2 = db.query(Seance).filter(Seance.code == f"{PREFIX}-SEANCE-02").first()
    if not seance2:
        seance2 = Seance(
            code=f"{PREFIX}-SEANCE-02",
            matiere_id=matiere.id,
            niveau_id=niveau.id,
            filiere_id=filiere_id,
            enseignant_id=teacher.id,
            creneau_id=creneau.id,
            type_seance="td",
            date_seance=demain,
            jour_semaine=demain.isoweekday(),
            semestre=1,
            annee_academique_id=annee.id,
            duree_minutes=120,
            statut="confirmee",
        )
        db.add(seance2)
    else:
        seance2.enseignant_id = teacher.id
        seance2.date_seance = demain
        seance2.filiere_id = filiere_id

    matiere_b = db.query(Matiere).filter(Matiere.code == f"{PREFIX}-MAT-B").first()
    if not matiere_b:
        matiere_b = Matiere(
            code=f"{PREFIX}-MAT-B",
            libelle="Matière E2E enseignant B (hors périmètre A)",
            credit=3,
            obligatoire=True,
        )
        db.add(matiere_b)
        db.flush()

    seance_b = db.query(Seance).filter(Seance.code == f"{PREFIX}-SEANCE-B").first()
    if not seance_b:
        seance_b = Seance(
            code=f"{PREFIX}-SEANCE-B",
            matiere_id=matiere_b.id,
            niveau_id=niveau.id,
            enseignant_id=teacher_b.id,
            creneau_id=creneau.id,
            type_seance="cours",
            date_seance=today,
            jour_semaine=jour_semaine,
            semestre=1,
            annee_academique_id=annee.id,
            duree_minutes=120,
            statut="confirmee",
        )
        db.add(seance_b)
    else:
        seance_b.enseignant_id = teacher_b.id
        seance_b.matiere_id = matiere_b.id
        seance_b.niveau_id = niveau.id

    stage = db.query(Stage).filter(Stage.code == f"{PREFIX}-STAGE-01").first()
    if not stage:
        stage = Stage(
            code=f"{PREFIX}-STAGE-01",
            etudiant_id=etu.id,
            matiere_id=matiere.id,
            niveau_id=niveau.id,
            annee_academique_id=annee.id,
            type_stage="professionnel",
            duree_semaines=8,
            date_debut=date(2025, 6, 1),
            date_fin=date(2025, 8, 31),
            entreprise_nom="Entreprise E2E Portail",
            maitre_stage_nom="M. Stage E2E",
            theme="Portail enseignant - stage encadré E2E",
            encadrant_academique_id=teacher.id,
            statut="en_cours",
        )
        db.add(stage)
    else:
        stage.encadrant_academique_id = teacher.id
        stage.etudiant_id = etu.id
        stage.theme = "Portail enseignant - stage encadré E2E"

    db.commit()

    pp(
        "COMPTE ENSEIGNANT E2E PRÊT",
        {
            "teacher_a": {"id": teacher.id, "email": teacher.email, "password": E2E_PASSWORD},
            "teacher_b": {"id": teacher_b.id, "email": teacher_b.email, "password": E2E_PASSWORD},
            "seance_aujourdhui": f"{PREFIX}-SEANCE-01",
            "stage_encadre": f"{PREFIX}-STAGE-01",
            "matiere_code": matiere.code,
            "session_code": E2E_SESSION_CODE,
            "etudiant_stage": E2E_STUDENT_MATRICULE,
        },
    )


def cmd_inspect(db) -> dict:
    teacher = db.query(User).filter(User.email == E2E_TEACHER_EMAIL).first()
    teacher_b = db.query(User).filter(User.email == E2E_TEACHER_B_EMAIL).first()
    if not teacher:
        raise SystemExit(f"User {E2E_TEACHER_EMAIL} introuvable - lancez setup d'abord.")

    seances = (
        db.query(Seance)
        .filter(Seance.enseignant_id == teacher.id)
        .order_by(Seance.date_seance)
        .all()
    )
    stages = (
        db.query(Stage)
        .filter(Stage.encadrant_academique_id == teacher.id)
        .all()
    )

    data = {
        "teacher": {"id": teacher.id, "email": teacher.email, "full_name": teacher.full_name},
        "teacher_b_id": teacher_b.id if teacher_b else None,
        "seances": [
            {
                "code": s.code,
                "date_seance": str(s.date_seance),
                "type_seance": s.type_seance,
                "matiere_id": s.matiere_id,
                "statut": s.statut,
            }
            for s in seances
        ],
        "stages_encadres": [
            {
                "code": st.code,
                "theme": st.theme,
                "etudiant_id": st.etudiant_id,
                "entreprise_nom": st.entreprise_nom,
                "statut": st.statut,
            }
            for st in stages
        ],
    }
    pp("DONNÉES DE RÉFÉRENCE (portail enseignant)", data)
    return data


def cmd_notes_api(db) -> None:
    """Parcours API saisie notes enseignant (sous-lot D)."""
    from fastapi.testclient import TestClient
    from app.main import app

    ctx = cmd_inspect(db)
    teacher = db.query(User).filter(User.email == E2E_TEACHER_EMAIL).first()
    teacher_b = db.query(User).filter(User.email == E2E_TEACHER_B_EMAIL).first()
    etu = db.query(Etudiant).filter(Etudiant.matricule == E2E_STUDENT_MATRICULE).first()
    matiere = db.query(Matiere).filter(Matiere.code == E2E_MATIERE_CODE).first()
    if not matiere:
        matiere = db.query(Matiere).filter(Matiere.code.like("E2E-MANUAL%")).first()
    session = db.query(SessionExamen).filter(SessionExamen.code == E2E_SESSION_CODE).first()
    insc = db.query(Inscription).filter(Inscription.etudiant_id == etu.id).first()
    im = (
        db.query(InscriptionMatiere)
        .filter(
            InscriptionMatiere.inscription_id == insc.id,
            InscriptionMatiere.matiere_id == matiere.id,
        )
        .first()
    )
    if not all([teacher, etu, matiere, session, im]):
        raise SystemExit("Données E2E incomplètes - lancez setup + e2e_manual_test_resultats.py")

    client = TestClient(app)

    def login(email: str) -> str:
        resp = client.post(
            "/api/v1/auth/login",
            data={"username": email, "password": E2E_PASSWORD},
        )
        assert resp.status_code == 200, resp.text
        return resp.json()["access_token"]

    token_a = login(E2E_TEACHER_EMAIL)
    headers_a = {"Authorization": f"Bearer {token_a}"}

    scope = client.get("/api/v1/seances/mes-matieres-enseignement", headers=headers_a)
    assert scope.status_code == 200, scope.text
    scope_ids = {row["matiere_id"] for row in scope.json()}
    assert matiere.id in scope_ids, f"Matière {matiere.code} absente du scope enseignant"

    examen_payload = {
        "session_id": session.id,
        "matiere_id": matiere.id,
        "niveau_id": insc.niveau_id,
        "type_evaluation": E2E_TYPE_EVAL_TEACHER,
    }
    create_ex = client.post(
        "/api/v1/examens/saisie-enseignant",
        json=examen_payload,
        headers=headers_a,
    )
    assert create_ex.status_code in (200, 201), create_ex.text
    examen_id = create_ex.json()["id"]

    bulk = {
        "examen_id": examen_id,
        "notes": [
            {
                "etudiant_id": etu.id,
                "inscription_matiere_id": im.id,
                "note": E2E_TEACHER_NOTE_CC,
                "statut_presence": "present",
            }
        ],
    }
    bulk_resp = client.post("/api/v1/notes/bulk", json=bulk, headers=headers_a)
    assert bulk_resp.status_code == 200, bulk_resp.text

    notes_resp = client.get(f"/api/v1/notes/examen/{examen_id}", headers=headers_a)
    assert notes_resp.status_code == 200, notes_resp.text
    notes = notes_resp.json()
    assert any(n.get("note") == E2E_TEACHER_NOTE_CC for n in notes), notes

    if teacher_b:
        token_b = login(E2E_TEACHER_B_EMAIL)
        foreign = client.post(
            "/api/v1/examens/saisie-enseignant",
            json=examen_payload,
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert foreign.status_code == 403, foreign.text

    pp(
        "PARCOURS SAISIE NOTES ENSEIGNANT (API)",
        {
            "matiere": matiere.code,
            "session": session.code,
            "examen_id": examen_id,
            "note_saisie": E2E_TEACHER_NOTE_CC,
            "etudiant": E2E_STUDENT_MATRICULE,
            "foreign_matiere_403": True,
        },
    )


def cmd_api() -> None:
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)
    login = client.post(
        "/api/v1/auth/login",
        data={"username": E2E_TEACHER_EMAIL, "password": E2E_PASSWORD},
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    endpoints = [
        ("GET", "/api/v1/seances/mes-seances"),
        ("GET", "/api/v1/stages/mes-stages-encadres"),
        ("GET", "/api/v1/seances/mes-matieres-enseignement"),
    ]
    results = {}
    for method, path in endpoints:
        resp = client.request(method, path, headers=headers)
        results[path] = {"status": resp.status_code, "count": len(resp.json()) if resp.status_code == 200 else resp.text}

    pp("PARCOURS API POST-LOGIN", results)


def main() -> None:
    parser = argparse.ArgumentParser(description="E2E portail enseignant")
    parser.add_argument("command", choices=["setup", "inspect", "api", "notes-api"])
    args = parser.parse_args()

    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    try:
        if args.command == "setup":
            cmd_setup(db)
            cmd_inspect(db)
        elif args.command == "inspect":
            cmd_inspect(db)
        elif args.command == "api":
            cmd_api()
        elif args.command == "notes-api":
            cmd_notes_api(db)
    finally:
        db.close()


if __name__ == "__main__":
    main()
