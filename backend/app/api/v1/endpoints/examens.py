"""
Endpoints API pour la gestion des examens
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import examen_repository, note_repository
from app.schemas.examen import (
    Examen,
    ExamenCreate,
    ExamenUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import examen_snapshot
from app.utils.teacher_notes_access import (
    assert_can_read_or_write_examen_notes,
    assert_session_en_cours,
    assert_teacher_can_saisie_matiere_niveau,
)
from app.core.portal_access import TEACHER_ROLES

router = APIRouter(prefix="/examens", tags=["Examens"])


@router.get("/", response_model=list[Examen], summary="Liste des examens")
async def list_examens(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    matiere_id: Optional[int] = Query(None, description="Filtrer par matière"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    type_evaluation: Optional[str] = Query(None, description="Filtrer par type (controle_continu, tp, examen_final, …)"),
    enseignant_id: Optional[int] = Query(None, description="Filtrer par enseignant"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des examens avec pagination et filtres.
    """
    if any(
        v is not None
        for v in (session_id, matiere_id, niveau_id, type_evaluation, enseignant_id, statut)
    ):
        return examen_repository.search(
            db,
            session_id=session_id,
            matiere_id=matiere_id,
            niveau_id=niveau_id,
            type_evaluation=type_evaluation,
            enseignant_id=enseignant_id,
            statut=statut,
            skip=skip,
            limit=limit,
        )

    return examen_repository.get_all(db, skip=skip, limit=limit)


@router.get("/match", response_model=Examen, summary="Examen par critères de saisie")
async def get_examen_match(
    session_id: int = Query(...),
    matiere_id: int = Query(...),
    niveau_id: int = Query(...),
    type_evaluation: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Retourne l'examen unique pour session/matière/niveau/type (404 si absent)."""
    examen = examen_repository.find_by_criteria(
        db, session_id, matiere_id, niveau_id, type_evaluation
    )
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucun examen pour ces critères",
        )
    assert_can_read_or_write_examen_notes(
        db, current_user, examen, require_session_open=False
    )
    return examen


@router.get("/{examen_id}", response_model=Examen, summary="Détails d'un examen")
async def get_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un examen par son ID.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    return examen


@router.get("/{examen_id}/statistiques", summary="Statistiques d'un examen")
async def get_statistiques_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les statistiques d'un examen.
    
    Retourne :
    - **moyenne**: Moyenne des notes
    - **min**: Note minimale
    - **max**: Note maximale
    - **nombre_presents**: Nombre d'étudiants présents
    - **nombre_absents**: Nombre d'étudiants absents
    - **taux_reussite**: Pourcentage de réussite (note >= 10)
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    return note_repository.get_statistiques_examen(db, examen_id)


@router.post("/", response_model=Examen, status_code=status.HTTP_201_CREATED, summary="Créer un examen")
async def create_examen(
    examen_in: ExamenCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "create")),
):
    """
    Crée un nouvel examen.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.create(db, examen_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="examen",
        entity_id=examen.id,
        new_values=examen_snapshot(examen),
    )
    return examen


@router.post(
    "/saisie-enseignant",
    response_model=Examen,
    status_code=status.HTTP_201_CREATED,
    summary="Créer un examen (portail enseignant)",
)
async def create_examen_enseignant(
    examen_in: ExamenCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crée un examen pour la saisie enseignant (même schéma que scolarité).

    Garde-fous : session ``en_cours``, matière/niveau enseignés par l'utilisateur.
    """
    if getattr(current_user, "role", None) not in TEACHER_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Réservé aux enseignants",
        )
    assert_session_en_cours(db, examen_in.session_id)
    assert_teacher_can_saisie_matiere_niveau(
        db, current_user, examen_in.matiere_id, examen_in.niveau_id
    )
    existing = examen_repository.find_by_criteria(
        db,
        examen_in.session_id,
        examen_in.matiere_id,
        examen_in.niveau_id,
        examen_in.type_evaluation,
    )
    if existing:
        return existing

    payload = examen_in.model_copy(update={"enseignant_id": current_user.id})
    examen = examen_repository.create(db, payload)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="examen",
        entity_id=examen.id,
        new_values=examen_snapshot(examen),
        details="enseignant",
    )
    return examen


@router.put("/{examen_id}", response_model=Examen, summary="Modifier un examen")
async def update_examen(
    examen_id: int,
    examen_in: ExamenUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "update")),
):
    """
    Met à jour un examen existant.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    old_snapshot = examen_snapshot(examen)
    updated = examen_repository.update(db, examen_id, examen_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="examen",
        entity_id=examen_id,
        old_values=old_snapshot,
        new_values=examen_snapshot(updated),
    )
    return updated


@router.patch("/{examen_id}/terminer", response_model=Examen, summary="Terminer un examen")
async def terminer_examen(
    examen_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "update")),
):
    """
    Marque un examen comme terminé.
    
    Requiert les droits admin ou scolarité.
    """
    existing = examen_repository.get_by_id(db, examen_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen non trouvé")
    old_snapshot = examen_snapshot(existing)
    examen = examen_repository.terminer_examen(db, examen_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="examen",
        entity_id=examen_id,
        old_values=old_snapshot,
        new_values=examen_snapshot(examen),
        details="terminer",
    )
    return examen


@router.patch("/{examen_id}/notes-saisies", response_model=Examen, summary="Marquer notes saisies")
async def marquer_notes_saisies(
    examen_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Marque les notes d'un examen comme saisies.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    assert_can_read_or_write_examen_notes(db, current_user, examen)
    old_snapshot = examen_snapshot(examen)
    updated = examen_repository.marquer_notes_saisies(db, examen_id)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="examen",
        entity_id=examen_id,
        old_values=old_snapshot,
        new_values=examen_snapshot(updated),
        details="notes_saisies",
    )
    return updated


@router.patch("/{examen_id}/valider", response_model=Examen, summary="Valider un examen")
async def valider_examen(
    examen_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "validate")),
):
    """
    Valide un examen.
    
    Requiert les droits admin ou scolarité.
    """
    existing = examen_repository.get_by_id(db, examen_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Examen non trouvé")
    old_snapshot = examen_snapshot(existing)
    examen = examen_repository.valider_examen(db, examen_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="examen",
        entity_id=examen_id,
        old_values=old_snapshot,
        new_values=examen_snapshot(examen),
    )
    return examen


@router.delete("/{examen_id}", summary="Supprimer un examen")
async def delete_examen(
    examen_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "delete")),
):
    """
    Supprime un examen.
    
    Requiert les droits admin ou scolarité.
    """
    existing = examen_repository.get_by_id(db, examen_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    old_snapshot = examen_snapshot(existing)
    success = examen_repository.delete(db, examen_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="examen",
        entity_id=examen_id,
        old_values=old_snapshot,
    )
    return {"message": "Examen supprimé avec succès"}
