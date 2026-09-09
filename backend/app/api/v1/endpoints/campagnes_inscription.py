"""
Endpoints API pour la gestion des campagnes d'inscription
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.campagne_inscription_repository import campagne_inscription_repository
from app.schemas.campagne_inscription import (
    CampagneInscription,
    CampagneInscriptionCreate,
    CampagneInscriptionUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/campagnes-inscription", tags=["Campagnes d'Inscription"])

_CAMPAGNE_FIELDS = ("code", "libelle", "statut", "annee_academique_id", "cycle_id")


@router.get("/", response_model=list[CampagneInscription])
def list_campagnes(
    skip: int = 0,
    limit: int = 100,
    annee_id: int = Query(None, description="Filtrer par année académique"),
    cycle_id: int = Query(None, description="Filtrer par cycle"),
    statut: str = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste toutes les campagnes d'inscription."""
    if annee_id:
        return campagne_inscription_repository.get_by_annee(db, annee_id)
    if cycle_id:
        return campagne_inscription_repository.get_by_cycle(db, cycle_id)
    
    campagnes = campagne_inscription_repository.get_all(db, skip=skip, limit=limit)
    if statut:
        campagnes = [c for c in campagnes if c.statut == statut]
    return campagnes


@router.get("/ouvertes", response_model=list[CampagneInscription])
def list_campagnes_ouvertes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les campagnes ouvertes."""
    return campagne_inscription_repository.get_ouvertes(db)


@router.get("/{campagne_id}", response_model=CampagneInscription)
def get_campagne(
    campagne_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une campagne par son ID."""
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    return campagne


@router.get("/{campagne_id}/statistiques")
def get_campagne_statistiques(
    campagne_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère les statistiques d'une campagne."""
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    return campagne_inscription_repository.get_statistiques(db, campagne_id)


@router.get("/{campagne_id}/places-restantes")
def get_campagne_places_restantes(
    campagne_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère le nombre de places restantes d'une campagne."""
    campagne = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not campagne:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    
    places_restantes = campagne_inscription_repository.get_places_restantes(db, campagne_id)
    stats = campagne_inscription_repository.get_statistiques(db, campagne_id)
    
    return {
        "places_totales": campagne.nombre_places,
        "places_occupees": stats["admis"],
        "places_restantes": places_restantes
    }


@router.post("/", response_model=CampagneInscription, status_code=status.HTTP_201_CREATED)
def create_campagne(
    campagne_in: CampagneInscriptionCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "create")),
):
    """Crée une nouvelle campagne d'inscription."""
    # Vérifier si le code existe déjà
    existing = campagne_inscription_repository.get_by_code(db, campagne_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une campagne avec ce code existe déjà"
        )
    campagne = campagne_inscription_repository.create(db, campagne_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="campagne_inscription",
        entity_id=campagne.id,
        new_values=fields_snapshot(campagne, *_CAMPAGNE_FIELDS),
    )
    return campagne


@router.put("/{campagne_id}", response_model=CampagneInscription)
def update_campagne(
    campagne_id: int,
    campagne_in: CampagneInscriptionUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "update")),
):
    """Met à jour une campagne d'inscription."""
    existing = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_CAMPAGNE_FIELDS)
    campagne = campagne_inscription_repository.update(db, campagne_id, campagne_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="campagne_inscription",
        entity_id=campagne_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(campagne, *_CAMPAGNE_FIELDS),
    )
    return campagne


@router.patch("/{campagne_id}/ouvrir", response_model=CampagneInscription)
def ouvrir_campagne(
    campagne_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "update")),
):
    """Ouvre une campagne d'inscription."""
    existing = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_CAMPAGNE_FIELDS)
    campagne = campagne_inscription_repository.ouvrir_campagne(db, campagne_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="campagne_inscription",
        entity_id=campagne_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(campagne, *_CAMPAGNE_FIELDS),
        details="ouvrir",
    )
    return campagne


@router.patch("/{campagne_id}/cloturer", response_model=CampagneInscription)
def cloturer_campagne(
    campagne_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "update")),
):
    """Clôture une campagne d'inscription."""
    existing = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_CAMPAGNE_FIELDS)
    campagne = campagne_inscription_repository.cloturer_campagne(db, campagne_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="campagne_inscription",
        entity_id=campagne_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(campagne, *_CAMPAGNE_FIELDS),
        details="cloturer",
    )
    return campagne


@router.delete("/{campagne_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_campagne(
    campagne_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("inscriptions", "delete")),
):
    """Supprime une campagne d'inscription."""
    existing = campagne_inscription_repository.get_by_id(db, campagne_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    old_snapshot = fields_snapshot(existing, *_CAMPAGNE_FIELDS)
    success = campagne_inscription_repository.delete(db, campagne_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campagne non trouvée"
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="campagne_inscription",
        entity_id=campagne_id,
        old_values=old_snapshot,
    )
    return None
