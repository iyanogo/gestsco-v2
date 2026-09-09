"""
Test manuel bout en bout - résultats + délibération (dev PostgreSQL).

Usage (depuis backend/) :
  set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gestscov2
  set SECRET_KEY=dev-secret
  python scripts/e2e_manual_test_resultats.py
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date, datetime
from typing import Any

# Allow imports from app
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

os.environ.setdefault(
    "DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/gestscov2"
)
os.environ.setdefault("SECRET_KEY", "dev-secret-e2e")

from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine

from app.core.config import settings
from app.models.annee_academique import AnneeAcademique
from app.models.configuration_deliberation import ConfigurationDeliberation
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.models.filiere import Filiere
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.matiere import Matiere
from app.models.niveau import Niveau
from app.models.deliberation import Deliberation
from app.models.session_examen import SessionExamen
from app.repositories.configuration_deliberation_repository import (
    configuration_deliberation_repository,
)
from app.repositories.deliberation_repository import deliberation_repository
from app.repositories.note_repository import note_repository
from app.repositories.resultat_annuel_repository import resultat_annuel_repository
from app.repositories.resultat_matiere_repository import resultat_matiere_repository
from app.repositories.resultat_semestre_repository import resultat_semestre_repository
from app.schemas.configuration_deliberation import ConfigurationDeliberationCreate
from app.schemas.note import NoteCreate
from app.services.deliberation_service import DeliberationService
from app.utils.configuration_deliberation_resolver import resolve_config_snapshot

PREFIX = "E2E-MANUAL"
E2E_ANNEE_CODE = "2025-2026"


def pp(title: str, data: Any) -> None:
    print(f"\n{'='*60}")
    print(title)
    print("=" * 60)
    if isinstance(data, (dict, list)):
        print(json.dumps(data, indent=2, default=str, ensure_ascii=False))
    else:
        print(data)


def matiere_result_dict(r) -> dict:
    return {
        "id": r.id,
        "matiere_id": r.matiere_id,
        "moyenne_matiere": r.moyenne_matiere,
        "statut": r.statut,
        "decision": r.decision,
        "credit_obtenu": r.credit_obtenu,
        "note_cc": r.note_cc,
        "note_tp": r.note_tp,
        "note_examen": r.note_examen,
    }


def semestre_result_dict(r) -> dict:
    return {
        "id": r.id,
        "semestre": r.semestre,
        "moyenne_generale": r.moyenne_generale,
        "decision": r.decision,
        "statut": r.statut,
        "total_credits_obtenus": r.total_credits_obtenus,
        "total_credits_inscrits": r.total_credits_inscrits,
        "nombre_matieres_validees": r.nombre_matieres_validees,
        "nombre_matieres": r.nombre_matieres,
    }


def annuel_result_dict(r) -> dict:
    return {
        "id": r.id,
        "moyenne_semestre1": r.moyenne_semestre1,
        "moyenne_semestre2": r.moyenne_semestre2,
        "moyenne_annuelle": r.moyenne_annuelle,
        "decision": r.decision,
        "passage_niveau_superieur": r.passage_niveau_superieur,
        "total_credits_obtenus": r.total_credits_obtenus,
        "total_credits_inscrits": r.total_credits_inscrits,
    }


def ensure_deliberation_semestrielle(
    db: Session,
    *,
    session_id: int,
    niveau_id: int,
    filiere_id: int,
    semestre: int,
) -> Deliberation:
    """Crée ou réutilise une délibération semestrielle (idempotent pour re-runs E2E)."""
    existing = (
        db.query(Deliberation)
        .filter(
            Deliberation.session_id == session_id,
            Deliberation.niveau_id == niveau_id,
            Deliberation.filiere_id == filiere_id,
            Deliberation.semestre == semestre,
        )
        .first()
    )
    if existing:
        DeliberationService(db).executer_deliberation_semestrielle(
            session_id, niveau_id, filiere_id, semestre
        )
        updated = deliberation_repository.actualiser_statistiques(db, existing.id)
        assert updated is not None
        return updated
    return deliberation_repository.creer_deliberation(
        db,
        session_id=session_id,
        niveau_id=niveau_id,
        filiere_id=filiere_id,
        type_deliberation="semestrielle",
        semestre=semestre,
    )


def seed_base(db: Session) -> dict:
    """Crée la chaîne référentielle minimale si absente."""
    annee = (
        db.query(AnneeAcademique)
        .filter(AnneeAcademique.code == E2E_ANNEE_CODE)
        .first()
    )
    if not annee:
        annee = AnneeAcademique(
            code=E2E_ANNEE_CODE,
            libelle="E2E 2025-2026",
            date_debut=date(2025, 9, 1),
            date_fin=date(2026, 8, 31),
            date_debut_inscriptions=date(2025, 6, 1),
            date_fin_inscriptions=date(2025, 10, 31),
            is_active=True,
            is_current=True,
            statut="en_cours",
        )
        db.add(annee)
        db.flush()

    niveau = db.query(Niveau).filter(Niveau.code == f"{PREFIX}-L1").first()
    if not niveau:
        niveau = Niveau(code=f"{PREFIX}-L1", libelle="E2E Licence 1")
        db.add(niveau)
        db.flush()

    filiere = db.query(Filiere).filter(Filiere.code == f"{PREFIX}-INFO").first()
    if not filiere:
        filiere = Filiere(code=f"{PREFIX}-INFO", libelle="E2E Informatique")
        db.add(filiere)
        db.flush()

    etu = db.query(Etudiant).filter(Etudiant.matricule == f"{PREFIX}-001").first()
    if not etu:
        etu = Etudiant(
            matricule=f"{PREFIX}-001",
            nom="TestE2E",
            prenom="Etudiant",
            email=f"{PREFIX.lower()}@test.local",
        )
        db.add(etu)
        db.flush()

    insc = (
        db.query(Inscription)
        .filter(
            Inscription.etudiant_id == etu.id,
            Inscription.annee_academique == annee.code,
        )
        .first()
    )
    if not insc:
        insc = Inscription(
            etudiant_id=etu.id,
            filiere_id=filiere.id,
            niveau_id=niveau.id,
            annee_academique=annee.code,
            date_inscription=date.today(),
            type_inscription="normale",
            is_active=True,
        )
        db.add(insc)
        db.flush()

    def session_for(sem: int) -> SessionExamen:
        code = f"{PREFIX}-S{sem}"
        s = db.query(SessionExamen).filter(SessionExamen.code == code).first()
        if not s:
            s = SessionExamen(
                code=code,
                libelle=f"Session E2E semestre {sem}",
                annee_academique_id=annee.id,
                type_session="normale",
                semestre=sem,
                date_debut=date(2025, 9 if sem == 1 else 2, 1),
                date_fin=date(2025, 12 if sem == 1 else 6, 30),
                date_limite_saisie_notes=date(2026, 1, 15),
                statut="en_cours",
            )
            db.add(s)
            db.flush()
        return s

    session_s1 = session_for(1)
    session_s2 = session_for(2)
    db.commit()

    return {
        "annee": annee,
        "niveau": niveau,
        "filiere": filiere,
        "etudiant": etu,
        "inscription": insc,
        "session_s1": session_s1,
        "session_s2": session_s2,
    }


def ensure_matiere_examen(
    db: Session,
    ctx: dict,
    code: str,
    semestre: int,
    credit: int = 3,
) -> tuple[Matiere, InscriptionMatiere, Examen, SessionExamen]:
    mat = db.query(Matiere).filter(Matiere.code == code).first()
    if not mat:
        mat = Matiere(code=code, libelle=f"Matière {code}", credit=credit, obligatoire=True)
        db.add(mat)
        db.flush()

    im = (
        db.query(InscriptionMatiere)
        .filter(
            InscriptionMatiere.inscription_id == ctx["inscription"].id,
            InscriptionMatiere.matiere_id == mat.id,
        )
        .first()
    )
    if not im:
        im = InscriptionMatiere(
            inscription_id=ctx["inscription"].id,
            matiere_id=mat.id,
            semestre=semestre,
        )
        db.add(im)
        db.flush()

    session = ctx["session_s1"] if semestre == 1 else ctx["session_s2"]
    ex = (
        db.query(Examen)
        .filter(
            Examen.session_id == session.id,
            Examen.matiere_id == mat.id,
            Examen.type_evaluation == "examen_final",
        )
        .first()
    )
    if not ex:
        ex = Examen(
            session_id=session.id,
            matiere_id=mat.id,
            niveau_id=ctx["niveau"].id,
            type_evaluation="examen_final",
            coefficient=1.0,
            note_sur=20.0,
            bareme=20.0,
            statut="planifie",
        )
        db.add(ex)
        db.flush()

    db.commit()
    return mat, im, ex, session


def saisir_et_valider_note(
    db: Session, examen: Examen, im: InscriptionMatiere, etu: Etudiant, note: float, user_id: int = 1
) -> dict:
    existing = note_repository.get_note_examen_etudiant(db, examen.id, etu.id)
    if existing:
        note_repository.update_note(db, existing.id, note, user_id)
        db.commit()
        db.refresh(existing)
        note_obj = existing
    else:
        created = note_repository.create_bulk(
            db,
            [
                {
                    "examen_id": examen.id,
                    "inscription_matiere_id": im.id,
                    "etudiant_id": etu.id,
                    "note": note,
                    "statut_presence": "present",
                }
            ],
            user_id,
        )
        note_obj = created[0]

    validated = note_repository.valider_notes_examen(db, examen.id, user_id)
    db.commit()
    return {
        "note_id": note_obj.id,
        "note": note_obj.note,
        "note_sur_20": note_obj.note_sur_20,
        "is_valide": note_obj.is_valide,
        "notes_validees_count": len(validated),
    }


def run_test_seuil_12(db: Session, ctx: dict) -> None:
    pp("ÉTAPE 1 - ConfigurationDeliberation moyenne_validation = 12", "…")
    annee_id = ctx["annee"].id
    niveau_id = ctx["niveau"].id

    existing = configuration_deliberation_repository.find_by_annee_niveau(
        db, annee_id, niveau_id
    )
    payload = ConfigurationDeliberationCreate(
        annee_academique_id=annee_id,
        niveau_id=niveau_id,
        moyenne_validation=12,
        moyenne_passage_conditionnel=8,
        compensation_semestres=True,
        nombre_matieres_dette_max=2,
    )
    if existing:
        from app.schemas.configuration_deliberation import ConfigurationDeliberationUpdate

        config = configuration_deliberation_repository.update(
            db,
            existing.id,
            ConfigurationDeliberationUpdate(**payload.model_dump()),
        )
    else:
        config = configuration_deliberation_repository.create(db, payload)

    snapshot = resolve_config_snapshot(db, annee_id, niveau_id)
    pp(
        "ÉTAPE 1 - Résultat config",
        {
            "config_id": config.id,
            "annee_academique_id": config.annee_academique_id,
            "niveau_id": config.niveau_id,
            "moyenne_validation": float(config.moyenne_validation),
            "snapshot_moyenne_validation": snapshot.moyenne_validation,
        },
    )

    mat, im, ex, session = ensure_matiere_examen(
        db, ctx, f"{PREFIX}-MAT-11", semestre=1, credit=3
    )

    pp("ÉTAPE 2 - Saisie note 11/20 (examen final)", "…")
    note_info = saisir_et_valider_note(db, ex, im, ctx["etudiant"], 11.0)
    pp("ÉTAPE 2 - Note enregistrée", note_info)

    pp("ÉTAPE 3 - Calcul résultats (session + semestre)", "…")
    n_session = resultat_matiere_repository.calculer_resultats_session(db, session.id)
    n_sem = resultat_semestre_repository.calculer_resultat_semestre(
        db, ctx["inscription"].id, session.id, semestre=1
    )
    rm = resultat_matiere_repository.get_by_inscription_matiere(db, im.id)
    pp(
        "ÉTAPE 3 - Résultat matière après calcul",
        {
            "matiere_code": mat.code,
            **matiere_result_dict(rm),
            "config_seuil": snapshot.moyenne_validation,
            "attendu_statut": "non_valide",
            "attendu_decision": "ajourne",
        },
    )
    pp(
        "ÉTAPE 3 - Résultat semestre après calcul (avant délibération)",
        semestre_result_dict(n_sem),
    )

    if rm.statut != "non_valide" or rm.decision != "ajourne":
        raise SystemExit(
            f"ÉCHEC étape 3 : matière statut={rm.statut} decision={rm.decision}, attendu non_valide/ajourne"
        )

    decision_avant = n_sem.decision

    pp("ÉTAPE 4 - Délibération semestrielle", "…")
    deliberation = ensure_deliberation_semestrielle(
        db,
        session_id=session.id,
        niveau_id=ctx["niveau"].id,
        filiere_id=ctx["filiere"].id,
        semestre=1,
    )
    rs_after = (
        db.query(resultat_semestre_repository.model)
        .filter(
            resultat_semestre_repository.model.inscription_id == ctx["inscription"].id,
            resultat_semestre_repository.model.session_id == session.id,
            resultat_semestre_repository.model.semestre == 1,
        )
        .first()
    )
    pp(
        "ÉTAPE 4 - Délibération créée + résultat semestre après délibération",
        {
            "deliberation_id": deliberation.id,
            "deliberation_statut": deliberation.statut,
            "nombre_ajournes": deliberation.nombre_ajournes,
            "resultat_semestre": semestre_result_dict(rs_after),
        },
    )

    pp("ÉTAPE 5 - Vérification cohérence", "…")
    coherent = (
        rm.statut == "non_valide"
        and rm.decision == "ajourne"
        and rs_after.decision in ("ajourne", "admis_avec_dette", "exclus")
        and rs_after.moyenne_generale is not None
        and rs_after.moyenne_generale < snapshot.moyenne_validation
    )
    pp(
        "ÉTAPE 5 - Synthèse test seuil 12",
        {
            "matiere_statut": rm.statut,
            "matiere_decision": rm.decision,
            "moyenne_matiere": rm.moyenne_matiere,
            "semestre_decision_avant_delib": decision_avant,
            "semestre_decision_apres_delib": rs_after.decision,
            "semestre_moyenne": rs_after.moyenne_generale,
            "seuil_config": snapshot.moyenne_validation,
            "coherent_non_valide": coherent,
            "verdict": "OK" if coherent else "ÉCHEC",
        },
    )
    if not coherent:
        raise SystemExit("ÉCHEC étape 5 : incohérence résultats / délibération")


def run_test_compensation(db: Session, ctx: dict) -> None:
    pp("BONUS - Préparation test compensation S1=9 / S2=11", "…")
    annee_id = ctx["annee"].id
    niveau_id = ctx["niveau"].id

    payload = ConfigurationDeliberationCreate(
        annee_academique_id=annee_id,
        niveau_id=None,
        moyenne_validation=10,
        moyenne_passage_conditionnel=8,
        compensation_semestres=True,
        nombre_matieres_dette_max=5,
    )
    payload_niveau = ConfigurationDeliberationCreate(
        annee_academique_id=annee_id,
        niveau_id=niveau_id,
        moyenne_validation=10,
        moyenne_passage_conditionnel=8,
        compensation_semestres=True,
        nombre_matieres_dette_max=5,
    )
    from app.schemas.configuration_deliberation import ConfigurationDeliberationUpdate

    for niveau_filter, data in ((None, payload), (niveau_id, payload_niveau)):
        existing = configuration_deliberation_repository.find_by_annee_niveau(
            db, annee_id, niveau_filter
        )
        if existing:
            configuration_deliberation_repository.update(
                db,
                existing.id,
                ConfigurationDeliberationUpdate(**data.model_dump()),
            )
        else:
            configuration_deliberation_repository.create(db, data)

    # S1 : 1 matière 10 cr, note 9
    _, im_s1, ex_s1, sess_s1 = ensure_matiere_examen(
        db, ctx, f"{PREFIX}-COMP-S1", semestre=1, credit=10
    )
    saisir_et_valider_note(db, ex_s1, im_s1, ctx["etudiant"], 9.0)

    # S2 : 5 matières 10 cr, note 11 → 50/60 crédits (>70% de 60)
    for i in range(1, 6):
        _, im_s2, ex_s2, sess_s2 = ensure_matiere_examen(
            db, ctx, f"{PREFIX}-COMP-S2-{i}", semestre=2, credit=10
        )
        saisir_et_valider_note(db, ex_s2, im_s2, ctx["etudiant"], 11.0)

    resultat_matiere_repository.calculer_resultats_session(db, sess_s1.id)
    resultat_matiere_repository.calculer_resultats_session(db, sess_s2.id)
    rs1 = resultat_semestre_repository.calculer_resultat_semestre(
        db, ctx["inscription"].id, sess_s1.id, semestre=1
    )
    rs2 = resultat_semestre_repository.calculer_resultat_semestre(
        db, ctx["inscription"].id, sess_s2.id, semestre=2
    )

    # Calcul annuel - passer annee_id via attribut temporaire si absent
    insc = ctx["inscription"]
    if not hasattr(insc, "annee_academique_id"):
        insc.annee_academique_id = annee_id  # type: ignore[attr-defined]

    ra = resultat_annuel_repository.calculer_resultat_annuel(db, insc.id)

    pp(
        "BONUS - Résultats semestres + annuel (compensation)",
        {
            "semestre_1": semestre_result_dict(rs1),
            "semestre_2": semestre_result_dict(rs2),
            "annuel": annuel_result_dict(ra),
            "moyenne_compensee_attendue": round((rs1.moyenne_generale + rs2.moyenne_generale) / 2, 2)
            if rs1.moyenne_generale and rs2.moyenne_generale
            else None,
            "attendu_decision_annuelle": "admis (compensation)",
        },
    )

    moy_comp = (rs1.moyenne_generale + rs2.moyenne_generale) / 2
    if moy_comp >= 10 and ra.decision not in ("admis", "admis_avec_dette"):
        raise SystemExit(
            f"ÉCHEC compensation : moyenne compensée={moy_comp}, decision annuelle={ra.decision}"
        )


def main() -> None:
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    try:
        pp("ENV", {"DATABASE_URL": settings.DATABASE_URL.split("@")[-1]})
        ctx = seed_base(db)
        pp(
            "Contexte seed",
            {
                "annee_id": ctx["annee"].id,
                "niveau_id": ctx["niveau"].id,
                "filiere_id": ctx["filiere"].id,
                "etudiant_id": ctx["etudiant"].id,
                "inscription_id": ctx["inscription"].id,
                "session_s1_id": ctx["session_s1"].id,
            },
        )
        run_test_seuil_12(db, ctx)
        run_test_compensation(db, ctx)
        pp("FIN", "Tous les tests manuels E2E terminés avec succès.")
    except Exception as exc:
        db.rollback()
        pp("ERREUR", str(exc))
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
