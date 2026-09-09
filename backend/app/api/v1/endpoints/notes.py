"""
Endpoints API pour la gestion des notes
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, resolve_etudiant_id
from app.models.user import User
from app.repositories import note_repository, examen_repository, etudiant_repository
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import note_snapshot
from app.utils.teacher_notes_access import assert_can_read_or_write_examen_notes
from app.schemas.note import (
    Note,
    NoteCreate,
    NoteUpdate,
    NoteBulkCreate,
)

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("/", response_model=list[Note], summary="Liste des notes")
async def list_notes(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    examen_id: Optional[int] = Query(None, description="Filtrer par examen"),
    etudiant_id: Optional[int] = Query(None, description="Filtrer par étudiant"),
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des notes avec pagination et filtres.
    """
    if examen_id:
        return note_repository.get_by_examen(db, examen_id, skip=skip, limit=limit)
    
    if etudiant_id:
        return note_repository.get_by_etudiant(db, etudiant_id, session_id=session_id)
    
    return note_repository.get_all(db, skip=skip, limit=limit)


@router.get("/mes-notes", response_model=list[Note], summary="Mes notes (portail étudiant)")
async def get_mes_notes(
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Notes de l'étudiant connecté."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return note_repository.get_by_etudiant(db, etudiant_id, session_id=session_id)


@router.get("/examen/{examen_id}", summary="Notes d'un examen")
async def get_notes_examen(
    examen_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les notes d'un examen avec les informations des étudiants.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )

    assert_can_read_or_write_examen_notes(
        db, current_user, examen, require_session_open=False
    )
    
    notes = note_repository.get_by_examen_with_etudiant(db, examen_id)
    
    # Formater la réponse avec les infos étudiant
    result = []
    for note in notes:
        note_dict = {
            "id": note.id,
            "examen_id": note.examen_id,
            "etudiant_id": note.etudiant_id,
            "inscription_matiere_id": note.inscription_matiere_id,
            "note": note.note,
            "note_sur": note.note_sur,
            "note_sur_20": note.note_sur_20,
            "statut_presence": note.statut_presence,
            "numero_anonymat": note.numero_anonymat,
            "observation": note.observation,
            "is_valide": note.is_valide,
            "date_saisie": note.date_saisie,
            "date_validation": note.date_validation,
        }
        if note.etudiant:
            note_dict["etudiant"] = {
                "id": note.etudiant.id,
                "matricule": note.etudiant.matricule,
                "nom": note.etudiant.nom,
                "prenom": note.etudiant.prenom,
            }
        result.append(note_dict)
    
    return result


@router.get("/etudiant/{etudiant_id}", response_model=list[Note], summary="Notes d'un étudiant")
async def get_notes_etudiant(
    etudiant_id: int,
    session_id: Optional[int] = Query(None, description="Filtrer par session"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère les notes d'un étudiant.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )

    assert_etudiant_owner(current_user, etudiant_id, db)
    
    return note_repository.get_by_etudiant(db, etudiant_id, session_id=session_id)


@router.get("/non-validees", response_model=list[Note], summary="Notes non validées")
async def get_notes_non_validees(
    examen_id: Optional[int] = Query(None, description="Filtrer par examen"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "read")),
):
    """
    Récupère les notes non validées.
    
    Requiert les droits admin ou scolarité.
    """
    return note_repository.get_notes_non_validees(db, examen_id=examen_id)


@router.get("/{note_id}", response_model=Note, summary="Détails d'une note")
async def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une note par son ID.
    """
    note = note_repository.get_by_id(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )
    examen = examen_repository.get_by_id(db, note.examen_id)
    if examen:
        assert_can_read_or_write_examen_notes(
            db, current_user, examen, require_session_open=False
        )
    return note


@router.post("/", response_model=Note, status_code=status.HTTP_201_CREATED, summary="Créer une note")
async def create_note(
    note_in: NoteCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crée une nouvelle note.
    """
    examen = examen_repository.get_by_id(db, note_in.examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    assert_can_read_or_write_examen_notes(db, current_user, examen)

    # Vérifier si une note existe déjà pour cet examen et cet étudiant
    existing = note_repository.get_note_examen_etudiant(
        db, note_in.examen_id, note_in.etudiant_id
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une note existe déjà pour cet étudiant et cet examen"
        )

    # Créer la note avec l'ID de l'utilisateur courant
    notes = note_repository.create_bulk(db, [note_in.model_dump()], current_user.id)
    created = notes[0] if notes else None
    if created:
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="note",
            entity_id=created.id,
            new_values=note_snapshot(created),
        )
    return created


@router.post("/bulk", summary="Créer plusieurs notes")
async def create_notes_bulk(
    bulk_data: NoteBulkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Crée plusieurs notes en une fois.
    """
    examen = examen_repository.get_by_id(db, bulk_data.examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé",
        )
    assert_can_read_or_write_examen_notes(db, current_user, examen)

    # Préparer les données
    notes_data = []
    for item in bulk_data.notes:
        note_dict = item.model_dump()
        note_dict["examen_id"] = bulk_data.examen_id
        notes_data.append(note_dict)
    
    # Créer les notes
    created_notes = note_repository.create_bulk(db, notes_data, current_user.id)
    if created_notes:
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="create",
            entity_type="note",
            entity_id=bulk_data.examen_id,
            new_values={"count": len(created_notes), "examen_id": bulk_data.examen_id},
            details="bulk",
        )

    return {
        "message": f"{len(created_notes)} notes créées avec succès",
        "count": len(created_notes),
        "notes": created_notes
    }


@router.put("/{note_id}", response_model=Note, summary="Modifier une note")
async def update_note(
    note_id: int,
    note_in: NoteUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Met à jour une note existante.
    """
    note = note_repository.get_by_id(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )

    examen = examen_repository.get_by_id(db, note.examen_id)
    if examen:
        assert_can_read_or_write_examen_notes(db, current_user, examen)
    
    # Si la note est validée, seul un admin peut la modifier
    if note.is_valide and current_user.role not in ("admin", "superuser"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette note est validée et ne peut plus être modifiée"
        )
    
    old_snapshot = note_snapshot(note)
    if note_in.note is not None:
        updated = note_repository.update_note(db, note_id, note_in.note, current_user.id)
    else:
        updated = note_repository.update(db, note_id, note_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="note",
        entity_id=note_id,
        old_values=old_snapshot,
        new_values=note_snapshot(updated),
    )
    return updated


@router.patch("/examen/{examen_id}/valider", summary="Valider les notes d'un examen")
async def valider_notes_examen(
    examen_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "validate")),
):
    """
    Valide toutes les notes d'un examen.
    
    Requiert les droits admin ou scolarité.
    """
    examen = examen_repository.get_by_id(db, examen_id)
    if not examen:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Examen non trouvé"
        )
    
    notes_validees = note_repository.valider_notes_examen(db, examen_id, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="note",
        entity_id=examen_id,
        new_values={"count": len(notes_validees), "examen_id": examen_id},
        details="examen",
    )

    return {
        "message": f"{len(notes_validees)} notes validées avec succès",
        "count": len(notes_validees)
    }


@router.delete("/{note_id}", summary="Supprimer une note")
async def delete_note(
    note_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("evaluations_notes", "delete")),
):
    """
    Supprime une note.
    
    Requiert les droits admin ou scolarité.
    """
    note = note_repository.get_by_id(db, note_id)
    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )
    
    # Ne pas permettre la suppression d'une note validée
    if note.is_valide:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cette note est validée et ne peut pas être supprimée"
        )
    
    old_snapshot = note_snapshot(note)
    success = note_repository.hard_delete(db, note_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note non trouvée"
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="note",
        entity_id=note_id,
        old_values=old_snapshot,
    )
    return {"message": "Note supprimée avec succès"}
