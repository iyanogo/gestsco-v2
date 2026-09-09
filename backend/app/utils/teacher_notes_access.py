"""
Contrôle d'accès saisie notes - portail enseignant.

Règle retenue (sous-lot D) :
- Pas de table d'affectation pédagogique dédiée ; source = Seance.enseignant_id + matiere_id + niveau_id.
- L'enseignant peut saisir pour toute la matière/niveau s'il a au moins une séance non annulée dessus
  (même périmètre étudiants que la saisie admin : inscriptions matières du semestre).
- Session doit être statut ``en_cours`` (aligné SaisieNotesPage admin).
"""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.permissions import is_scolarite_portal_user
from app.core.portal_access import TEACHER_ROLES
from app.models.etudiant import Etudiant
from app.models.examen import Examen
from app.models.inscription import Inscription
from app.models.inscription_matiere import InscriptionMatiere
from app.models.seance import Seance
from app.models.session_examen import SessionExamen
from app.models.user import User

# Séances ouvertes à l'émargement (aligné chantier EDT)
SEANCE_STATUTS_EMARGEMENT = frozenset({"confirmee", "en_cours", "terminee"})


def _is_teacher(user: User) -> bool:
    return getattr(user, "role", None) in TEACHER_ROLES


def teacher_teaches_matiere_niveau(
    db: Session,
    enseignant_id: int,
    matiere_id: int,
    niveau_id: int,
) -> bool:
    """True si l'enseignant a au moins une séance active sur matière + niveau."""
    return (
        db.query(Seance.id)
        .filter(
            Seance.enseignant_id == enseignant_id,
            Seance.matiere_id == matiere_id,
            Seance.niveau_id == niveau_id,
            Seance.statut != "annulee",
        )
        .first()
        is not None
    )


def assert_session_en_cours(db: Session, session_id: int) -> SessionExamen:
    """Garde-fou session - identique au frontend admin (statut en_cours uniquement)."""
    session = db.query(SessionExamen).filter(SessionExamen.id == session_id).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session d'examen non trouvée",
        )
    if session.statut != "en_cours":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"La session n'est pas ouverte à la saisie (statut : {session.statut!r}). "
                "Seules les sessions en_cours acceptent la saisie."
            ),
        )
    return session


def assert_teacher_can_saisie_matiere_niveau(
    db: Session,
    user: User,
    matiere_id: int,
    niveau_id: int,
) -> None:
    if is_scolarite_portal_user(user):
        return
    if not _is_teacher(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits insuffisants pour saisir des notes",
        )
    if not teacher_teaches_matiere_niveau(db, user.id, matiere_id, niveau_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès refusé : vous n'enseignez pas cette matière à ce niveau",
        )


def assert_can_read_or_write_examen_notes(
    db: Session,
    user: User,
    examen: Examen,
    *,
    require_session_open: bool = True,
) -> None:
    """Vérifie lecture/écriture notes pour un examen."""
    if is_scolarite_portal_user(user):
        return

    if _is_teacher(user):
        if require_session_open:
            assert_session_en_cours(db, examen.session_id)
        if examen.enseignant_id == user.id:
            return
        assert_teacher_can_saisie_matiere_niveau(
            db, user, examen.matiere_id, examen.niveau_id
        )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Droits insuffisants pour accéder aux notes de cet examen",
    )


def get_teacher_enseignement_scope(db: Session, enseignant_id: int) -> list[dict]:
    """Triplets matière/niveau/filière dédupliés depuis les séances de l'enseignant."""
    seances = (
        db.query(Seance)
        .filter(
            Seance.enseignant_id == enseignant_id,
            Seance.statut != "annulee",
        )
        .all()
    )
    seen: set[tuple[int, int, int | None]] = set()
    rows: list[dict] = []
    for seance in seances:
        key = (seance.matiere_id, seance.niveau_id, seance.filiere_id)
        if key in seen:
            continue
        seen.add(key)
        matiere = seance.matiere
        niveau = seance.niveau
        filiere = seance.filiere
        rows.append(
            {
                "matiere_id": seance.matiere_id,
                "niveau_id": seance.niveau_id,
                "filiere_id": seance.filiere_id,
                "matiere_code": matiere.code if matiere else None,
                "matiere_libelle": matiere.libelle if matiere else None,
                "niveau_code": niveau.code if niveau else None,
                "niveau_libelle": niveau.libelle if niveau else None,
                "filiere_code": filiere.code if filiere else None,
                "filiere_libelle": filiere.libelle if filiere else None,
            }
        )
    rows.sort(key=lambda r: (r.get("matiere_libelle") or "", r.get("niveau_libelle") or ""))
    return rows


def get_teacher_etudiants(
    db: Session,
    enseignant_id: int,
    *,
    matiere_id: int | None = None,
    niveau_id: int | None = None,
) -> list[dict]:
    """Étudiants inscrits aux matières/niveaux enseignés par l'enseignant."""
    scope = get_teacher_enseignement_scope(db, enseignant_id)
    if matiere_id is not None and niveau_id is not None:
        scope = [
            row
            for row in scope
            if row["matiere_id"] == matiere_id and row["niveau_id"] == niveau_id
        ]

    if not scope:
        return []

    seen: dict[int, dict] = {}
    for row in scope:
        mid = row["matiere_id"]
        nid = row["niveau_id"]
        fid = row["filiere_id"]

        query = (
            db.query(InscriptionMatiere, Inscription, Etudiant)
            .join(Inscription, InscriptionMatiere.inscription_id == Inscription.id)
            .join(Etudiant, Inscription.etudiant_id == Etudiant.id)
            .filter(
                InscriptionMatiere.matiere_id == mid,
                Inscription.niveau_id == nid,
                InscriptionMatiere.is_active.is_(True),
                Inscription.is_active.is_(True),
            )
        )
        if fid is not None:
            query = query.filter(Inscription.filiere_id == fid)

        for _im, insc, etu in query.all():
            if etu.id not in seen:
                seen[etu.id] = {
                    "etudiant_id": etu.id,
                    "matricule": etu.matricule,
                    "nom": etu.nom,
                    "prenom": etu.prenom,
                    "email": etu.email,
                    "niveau_id": insc.niveau_id,
                    "niveau_libelle": row.get("niveau_libelle"),
                    "filiere_id": insc.filiere_id,
                    "filiere_libelle": row.get("filiere_libelle"),
                    "matieres": [],
                }
            matieres = seen[etu.id]["matieres"]
            if not any(m["matiere_id"] == mid for m in matieres):
                matieres.append(
                    {
                        "matiere_id": mid,
                        "matiere_code": row.get("matiere_code"),
                        "matiere_libelle": row.get("matiere_libelle"),
                    }
                )

    rows = list(seen.values())
    rows.sort(key=lambda r: (r.get("nom") or "", r.get("prenom") or ""))
    return rows


def assert_seance_emargement_ouverte(seance: Seance) -> None:
    """Garde-fou séance - pas d'émargement sur séance annulée ou reportée."""
    if seance.statut in ("annulee", "reportee"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Émargement impossible : séance {seance.statut!r}. "
                "Seules les séances confirmées, en cours ou terminées acceptent l'appel."
            ),
        )
    if seance.statut not in SEANCE_STATUTS_EMARGEMENT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Émargement impossible pour le statut {seance.statut!r}. "
                f"Statuts autorisés : {', '.join(sorted(SEANCE_STATUTS_EMARGEMENT))}."
            ),
        )


def assert_teacher_can_manage_seance_presence(
    db: Session,
    user: User,
    seance: Seance,
) -> None:
    """Vérifie qu'un enseignant peut émarger une séance (propriétaire ou matière/niveau enseignés)."""
    if is_scolarite_portal_user(user):
        return

    if not _is_teacher(user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Droits insuffisants pour gérer les présences de cette séance",
        )

    assert_seance_emargement_ouverte(seance)

    if seance.enseignant_id == user.id:
        return

    assert_teacher_can_saisie_matiere_niveau(
        db, user, seance.matiere_id, seance.niveau_id
    )
