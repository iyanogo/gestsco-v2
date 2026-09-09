"""
Endpoints API pour la gestion des séances
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import (
    assert_encadrant_owner,
    assert_etudiant_owner,
    resolve_etudiant_id,
    TEACHER_ROLES,
)
from app.utils.teacher_notes_access import get_teacher_enseignement_scope, get_teacher_etudiants
from app.models.user import User
from app.models.seance import Seance
from app.repositories import inscription_repository
from app.repositories.seance_repository import seance_repository
from app.schemas.seance import (
    Seance as SeanceSchema,
    SeanceCreate,
    SeanceUpdate,
    SeanceWithDetails,
    SeanceRecurrenteCreate,
)
from app.utils.emploi_temps_utils import get_jour_semaine_label
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/seances", tags=["Séances"])

_SEANCE_FIELDS = (
    "matiere_id",
    "niveau_id",
    "filiere_id",
    "enseignant_id",
    "salle_id",
    "creneau_id",
    "date_seance",
    "statut",
    "type_seance",
)


class AnnulerSeanceRequest(BaseModel):
    motif: str


class ReporterSeanceRequest(BaseModel):
    nouvelle_date: date
    nouveau_creneau_id: int


@router.get("/", response_model=List[SeanceSchema])
def get_seances(
    skip: int = 0,
    limit: int = 100,
    date_seance: Optional[date] = Query(None, alias="date"),
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    niveau_id: Optional[int] = None,
    filiere_id: Optional[int] = None,
    enseignant_id: Optional[int] = None,
    salle_id: Optional[int] = None,
    matiere_id: Optional[int] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste toutes les séances avec filtres"""
    if date_seance:
        return seance_repository.get_by_date(db, date_seance, niveau_id, filiere_id)
    
    if date_debut and date_fin:
        return seance_repository.get_by_periode(db, date_debut, date_fin, niveau_id, filiere_id)
    
    if enseignant_id:
        return seance_repository.get_by_enseignant(db, enseignant_id, date_debut, date_fin)
    
    if salle_id:
        return seance_repository.get_by_salle(db, salle_id, date_seance)
    
    if matiere_id:
        return seance_repository.get_by_matiere(db, matiere_id, niveau_id)
    
    # Filtre par statut si spécifié
    query = db.query(Seance)
    if statut:
        query = query.filter(Seance.statut == statut)
    if niveau_id:
        query = query.filter(Seance.niveau_id == niveau_id)
    if filiere_id:
        query = query.filter(Seance.filiere_id == filiere_id)
    
    return query.offset(skip).limit(limit).all()


@router.get("/mes-seances", response_model=List[SeanceSchema])
def get_mes_seances(
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Séances du portail connecté.

    - Enseignant : ses séances (enseignant_id = user.id)
    - Étudiant : séances de son niveau/filière (inscription active)
    """
    role = getattr(current_user, "role", None)
    if role in TEACHER_ROLES:
        return seance_repository.get_by_enseignant(
            db, current_user.id, date_debut, date_fin
        )

    etudiant_id = resolve_etudiant_id(db, current_user)
    inscription = inscription_repository.get_current_inscription(db, etudiant_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune inscription active - emploi du temps indisponible",
        )
    if date_debut and date_fin:
        return seance_repository.get_by_periode(
            db, date_debut, date_fin, inscription.niveau_id, inscription.filiere_id
        )
    return seance_repository.get_by_periode(
        db,
        date_debut or date.today(),
        date_fin or date_debut or date.today(),
        inscription.niveau_id,
        inscription.filiere_id,
    )


@router.get("/mes-matieres-enseignement", summary="Matières enseignées (portail saisie notes)")
def get_mes_matieres_enseignement(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Triplets matière/niveau/filière déduits des séances de l'enseignant connecté.
    """
    role = getattr(current_user, "role", None)
    if role not in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux enseignants",
        )
    return get_teacher_enseignement_scope(db, current_user.id)


@router.get("/mes-etudiants", summary="Étudiants des matières enseignées (portail enseignant)")
def get_mes_etudiants(
    matiere_id: Optional[int] = Query(None, description="Filtrer par matière"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste nominative des étudiants inscrits aux matières/niveaux enseignés."""
    role = getattr(current_user, "role", None)
    if role not in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux enseignants",
        )
    if (matiere_id is None) ^ (niveau_id is None):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="matiere_id et niveau_id doivent être fournis ensemble",
        )
    return get_teacher_etudiants(
        db,
        current_user.id,
        matiere_id=matiere_id,
        niveau_id=niveau_id,
    )


@router.get("/semaine")
def get_seances_semaine(
    date_debut: date = Query(...),
    niveau_id: int = Query(...),
    filiere_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Séances d'une semaine organisées par jour"""
    seances = seance_repository.get_semaine(db, date_debut, niveau_id, filiere_id)
    
    # Organiser par jour
    jours = {}
    for i in range(1, 8):
        jours[i] = {
            "jour": i,
            "jour_libelle": get_jour_semaine_label(i),
            "seances": []
        }
    
    for seance in seances:
        jour = seance.jour_semaine
        if jour in jours:
            jours[jour]["seances"].append(seance)
    
    return list(jours.values())


@router.get("/enseignant/{enseignant_id}")
def get_seances_enseignant(
    enseignant_id: int,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Emploi du temps d'un enseignant"""
    assert_encadrant_owner(current_user, enseignant_id)
    return seance_repository.get_by_enseignant(db, enseignant_id, date_debut, date_fin)


@router.get("/salle/{salle_id}")
def get_seances_salle(
    salle_id: int,
    date_seance: Optional[date] = Query(None, alias="date"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Planning d'une salle"""
    return seance_repository.get_by_salle(db, salle_id, date_seance)


@router.get("/conflits")
def get_conflits(
    date_seance: date = Query(..., alias="date"),
    creneau_id: int = Query(...),
    salle_id: Optional[int] = None,
    enseignant_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Vérifie les conflits pour un créneau"""
    return seance_repository.get_conflits(db, date_seance, creneau_id, salle_id, enseignant_id)


@router.get("/{seance_id}", response_model=SeanceSchema)
def get_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère une séance par ID"""
    seance = seance_repository.get_by_id(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    return seance


@router.post("/", response_model=SeanceSchema, status_code=status.HTTP_201_CREATED)
def create_seance(
    seance_in: SeanceCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "create")),
):
    """Crée une nouvelle séance avec vérification des disponibilités"""
    result = seance_repository.create_with_verification(db, seance_in)
    
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"]
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="create",
        entity_type="seance",
        entity_id=result.id,
        new_values=fields_snapshot(result, *_SEANCE_FIELDS),
    )
    return result


@router.post("/recurrente", response_model=List[SeanceSchema], status_code=status.HTTP_201_CREATED)
def create_seances_recurrentes(
    seance_recurrente: SeanceRecurrenteCreate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "create")),
):
    """Crée des séances récurrentes"""
    seances = seance_repository.create_recurrente(db, seance_recurrente, current_user.id)
    
    if not seances:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucune séance n'a pu être créée"
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="create",
        entity_type="seance",
        entity_id=seances[0].id,
        new_values={"count": len(seances), "ids": [s.id for s in seances[:20]]},
        details="recurrent_create",
    )
    return seances


@router.put("/{seance_id}", response_model=SeanceSchema)
def update_seance(
    seance_id: int,
    seance_in: SeanceUpdate,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "update")),
):
    """Met à jour une séance"""
    seance = seance_repository.get_by_id(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    old_snapshot = fields_snapshot(seance, *_SEANCE_FIELDS)
    result = seance_repository.update_with_verification(db, seance_id, seance_in)
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"],
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="update",
        entity_type="seance",
        entity_id=seance_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(result, *_SEANCE_FIELDS),
    )
    return result


@router.patch("/{seance_id}/confirmer", response_model=SeanceSchema)
def confirmer_seance(
    seance_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "validate")),
):
    """Confirme une séance"""
    existing = seance_repository.get_by_id(db, seance_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_SEANCE_FIELDS)
    seance = seance_repository.confirmer_seance(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="validate",
        entity_type="seance",
        entity_id=seance_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(seance, *_SEANCE_FIELDS),
    )
    return seance


@router.patch("/{seance_id}/annuler", response_model=SeanceSchema)
def annuler_seance(
    seance_id: int,
    request: AnnulerSeanceRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "update")),
):
    """Annule une séance"""
    existing = seance_repository.get_by_id(db, seance_id)
    old_snapshot = fields_snapshot(existing, *_SEANCE_FIELDS) if existing else {}
    seance = seance_repository.annuler_seance(db, seance_id, request.motif)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="cancel",
        entity_type="seance",
        entity_id=seance_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(seance, *_SEANCE_FIELDS),
        details=request.motif,
    )
    return seance


@router.patch("/{seance_id}/reporter", response_model=SeanceSchema)
def reporter_seance(
    seance_id: int,
    request: ReporterSeanceRequest,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "update")),
):
    """Reporte une séance"""
    existing = seance_repository.get_by_id(db, seance_id)
    old_snapshot = fields_snapshot(existing, *_SEANCE_FIELDS) if existing else {}
    result = seance_repository.reporter_seance(
        db, seance_id, request.nouvelle_date, request.nouveau_creneau_id
    )
    
    if isinstance(result, dict) and "errors" in result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["errors"]
        )
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="update",
        entity_type="seance",
        entity_id=seance_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(result, *_SEANCE_FIELDS),
        details="reporter",
    )
    return result


@router.delete("/{seance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seance(
    seance_id: int,
    http_request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "delete")),
):
    """Supprime une séance"""
    seance = seance_repository.get_by_id(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée"
        )
    old_snapshot = fields_snapshot(seance, *_SEANCE_FIELDS)
    seance_repository.delete(db, seance_id)
    audit_and_commit(
        db,
        request=http_request,
        user=current_user,
        action="delete",
        entity_type="seance",
        entity_id=seance_id,
        old_values=old_snapshot,
    )
    return None
