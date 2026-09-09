"""
Endpoints API pour la gestion des présences
"""
from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import is_scolarite_portal_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, resolve_etudiant_id
from app.models.user import User
from app.repositories.presence_repository import presence_repository
from app.repositories.seance_repository import seance_repository
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.utils.teacher_notes_access import assert_teacher_can_manage_seance_presence

_PRESENCE_FIELDS = ("seance_id", "etudiant_id", "statut", "justificatif_url")
from app.schemas.presence import (
    Presence,
    PresenceCreate,
    PresenceUpdate,
    PresenceWithEtudiant,
    PresenceBulkCreate,
    StatistiquesPresence,
)

router = APIRouter(prefix="/presences", tags=["Présences"])


@router.get("/", response_model=List[Presence])
def get_presences(
    skip: int = 0,
    limit: int = 100,
    seance_id: Optional[int] = None,
    etudiant_id: Optional[int] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    statut: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste toutes les présences avec filtres"""
    if not is_scolarite_portal_user(current_user):
        if not seance_id and not etudiant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Précisez seance_id ou etudiant_id (portail enseignant/étudiant)",
            )

    if seance_id:
        seance = seance_repository.get_by_id(db, seance_id)
        if not seance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Séance non trouvée",
            )
        assert_teacher_can_manage_seance_presence(db, current_user, seance)
        return presence_repository.get_by_seance(db, seance_id)
    
    if etudiant_id:
        assert_etudiant_owner(current_user, etudiant_id, db)
        return presence_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    
    return presence_repository.get_all(db, skip=skip, limit=limit)


@router.get("/mes-presences")
def get_mes_presences(
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    matiere_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Présences de l'étudiant connecté (portail)."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    presences = presence_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    if matiere_id:
        presences = [p for p in presences if p.seance and p.seance.matiere_id == matiere_id]
    return presences


@router.get("/mes-presences/taux", response_model=StatistiquesPresence)
def get_mes_presences_taux(
    matiere_id: Optional[int] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Taux de présence de l'étudiant connecté (portail)."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return presence_repository.calculer_taux_presence_etudiant(
        db, etudiant_id, matiere_id, date_debut, date_fin
    )


@router.get("/seance/{seance_id}")
def get_presences_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Feuille d'appel d'une séance (étudiants attendus + présences déjà saisies)."""
    seance = seance_repository.get_by_id(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée",
        )
    assert_teacher_can_manage_seance_presence(db, current_user, seance)
    feuille = presence_repository.get_feuille_appel_seance(db, seance_id)
    if feuille is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée",
        )
    return feuille


@router.get("/etudiant/{etudiant_id}")
def get_presences_etudiant(
    etudiant_id: int,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    matiere_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Présences d'un étudiant"""
    assert_etudiant_owner(current_user, etudiant_id, db)
    presences = presence_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    
    # Filtrer par matière si spécifié
    if matiere_id:
        presences = [p for p in presences if p.seance and p.seance.matiere_id == matiere_id]
    
    return presences


@router.get("/etudiant/{etudiant_id}/taux", response_model=StatistiquesPresence)
def get_taux_presence_etudiant(
    etudiant_id: int,
    matiere_id: Optional[int] = None,
    date_debut: Optional[date] = None,
    date_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Taux de présence d'un étudiant"""
    assert_etudiant_owner(current_user, etudiant_id, db)
    return presence_repository.calculer_taux_presence_etudiant(
        db, etudiant_id, matiere_id, date_debut, date_fin
    )


@router.get("/statistiques/seance/{seance_id}")
def get_statistiques_seance(
    seance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Statistiques de présence d'une séance"""
    seance = seance_repository.get_by_id(db, seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée",
        )
    assert_teacher_can_manage_seance_presence(db, current_user, seance)
    return presence_repository.get_statistiques_seance(db, seance_id)


@router.get("/absents-frequents")
def get_absents_frequents(
    niveau_id: int = Query(...),
    seuil_absence: int = Query(3),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "read"))
):
    """Étudiants avec absences fréquentes"""
    return presence_repository.get_etudiants_absents_frequents(db, niveau_id, seuil_absence)


@router.post("/", response_model=Presence, status_code=status.HTTP_201_CREATED)
def create_presence(
    presence_in: PresenceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Crée une présence"""
    seance = seance_repository.get_by_id(db, presence_in.seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée",
        )
    assert_teacher_can_manage_seance_presence(db, current_user, seance)
    presence = presence_repository.create(db, presence_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="presence",
        entity_id=presence.id,
        new_values=fields_snapshot(presence, *_PRESENCE_FIELDS),
    )
    return presence


@router.post("/bulk", status_code=status.HTTP_201_CREATED)
def create_presences_bulk(
    presences_data: PresenceBulkCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Saisie en masse des présences"""
    seance = seance_repository.get_by_id(db, presences_data.seance_id)
    if not seance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Séance non trouvée",
        )
    assert_teacher_can_manage_seance_presence(db, current_user, seance)
    presences = presence_repository.create_bulk(db, presences_data, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="presence",
        entity_id=presences_data.seance_id,
        new_values={"count": len(presences), "seance_id": presences_data.seance_id},
        details="bulk",
    )
    return {
        "message": f"{len(presences)} présences enregistrées",
        "presences": presences
    }


@router.put("/{presence_id}", response_model=Presence)
def update_presence(
    presence_id: int,
    presence_in: PresenceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Met à jour une présence"""
    presence = presence_repository.get_by_id(db, presence_id)
    if not presence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Présence non trouvée"
        )
    seance = seance_repository.get_by_id(db, presence.seance_id)
    if seance:
        assert_teacher_can_manage_seance_presence(db, current_user, seance)
    old_snapshot = fields_snapshot(presence, *_PRESENCE_FIELDS)
    updated = presence_repository.update(db, presence_id, presence_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="presence",
        entity_id=presence_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_PRESENCE_FIELDS),
    )
    return updated


@router.delete("/{presence_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_presence(
    presence_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt", "delete"))
):
    """Supprime une présence"""
    presence = presence_repository.get_by_id(db, presence_id)
    if not presence:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Présence non trouvée"
        )
    old_snapshot = fields_snapshot(presence, *_PRESENCE_FIELDS)
    presence_repository.delete(db, presence_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="presence",
        entity_id=presence_id,
        old_values=old_snapshot,
    )
    return None
