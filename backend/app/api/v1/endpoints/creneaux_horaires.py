"""
Endpoints API pour la gestion des créneaux horaires
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.creneau_horaire_repository import creneau_horaire_repository
from app.schemas.creneau_horaire import (
    CreneauHoraire,
    CreneauHoraireCreate,
    CreneauHoraireUpdate,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter(prefix="/creneaux-horaires", tags=["Créneaux Horaires"])

_CRENEAU_FIELDS = ("code", "libelle", "heure_debut", "heure_fin", "periode", "ordre", "is_active")


@router.get("/", response_model=List[CreneauHoraire])
def get_creneaux_horaires(
    periode: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Liste tous les créneaux horaires"""
    if periode:
        return creneau_horaire_repository.get_by_periode(db, periode)
    return creneau_horaire_repository.get_ordered(db)


@router.get("/{creneau_id}", response_model=CreneauHoraire)
def get_creneau_horaire(
    creneau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Récupère un créneau horaire par ID"""
    creneau = creneau_horaire_repository.get_by_id(db, creneau_id)
    if not creneau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Créneau horaire non trouvé"
        )
    return creneau


@router.post("/", response_model=CreneauHoraire, status_code=status.HTTP_201_CREATED)
def create_creneau_horaire(
    creneau_in: CreneauHoraireCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt_creneaux", "create"))
):
    """Crée un nouveau créneau horaire"""
    # Vérifier si le code existe déjà
    existing = creneau_horaire_repository.get_by_code(db, creneau_in.code)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un créneau avec ce code existe déjà"
        )
    
    # Calculer la durée en minutes
    from app.utils.emploi_temps_utils import calculer_duree_creneau
    duree = calculer_duree_creneau(creneau_in.heure_debut, creneau_in.heure_fin)
    
    # Créer le créneau avec la durée calculée
    creneau_data = creneau_in.model_dump()
    creneau_data["duree_minutes"] = duree
    
    from app.models.creneau_horaire import CreneauHoraire as CreneauModel
    creneau = CreneauModel(**creneau_data)
    db.add(creneau)
    db.flush()
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="creneau_horaire",
        entity_id=creneau.id,
        new_values=fields_snapshot(creneau, *_CRENEAU_FIELDS),
    )
    db.refresh(creneau)
    return creneau


@router.put("/{creneau_id}", response_model=CreneauHoraire)
def update_creneau_horaire(
    creneau_id: int,
    creneau_in: CreneauHoraireUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt_creneaux", "update"))
):
    """Met à jour un créneau horaire"""
    creneau = creneau_horaire_repository.get_by_id(db, creneau_id)
    if not creneau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Créneau horaire non trouvé"
        )
    
    # Vérifier unicité du code si modifié
    if creneau_in.code and creneau_in.code != creneau.code:
        existing = creneau_horaire_repository.get_by_code(db, creneau_in.code)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un créneau avec ce code existe déjà"
            )
    
    old_snapshot = fields_snapshot(creneau, *_CRENEAU_FIELDS)

    # Recalculer la durée si les heures changent
    if creneau_in.heure_debut or creneau_in.heure_fin:
        from app.utils.emploi_temps_utils import calculer_duree_creneau
        heure_debut = creneau_in.heure_debut or creneau.heure_debut
        heure_fin = creneau_in.heure_fin or creneau.heure_fin
        duree = calculer_duree_creneau(heure_debut, heure_fin)
        
        # Mettre à jour manuellement
        update_data = creneau_in.model_dump(exclude_unset=True)
        update_data["duree_minutes"] = duree
        
        for key, value in update_data.items():
            setattr(creneau, key, value)
    else:
        creneau = creneau_horaire_repository.update(db, creneau_id, creneau_in)

    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="creneau_horaire",
        entity_id=creneau_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(creneau, *_CRENEAU_FIELDS),
    )
    db.refresh(creneau)
    return creneau


@router.delete("/{creneau_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_creneau_horaire(
    creneau_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("edt_creneaux", "delete"))
):
    """Supprime un créneau horaire"""
    creneau = creneau_horaire_repository.get_by_id(db, creneau_id)
    if not creneau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Créneau horaire non trouvé"
        )
    old_snapshot = fields_snapshot(creneau, *_CRENEAU_FIELDS)
    creneau_horaire_repository.delete(db, creneau_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="creneau_horaire",
        entity_id=creneau_id,
        old_values=old_snapshot,
    )
    return None
