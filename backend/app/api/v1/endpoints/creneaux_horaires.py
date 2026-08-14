"""
Endpoints API pour la gestion des créneaux horaires
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.deps import get_current_active_user
from app.core.permissions import get_current_superuser
from app.models.user import User
from app.repositories.creneau_horaire_repository import creneau_horaire_repository
from app.schemas.creneau_horaire import (
    CreneauHoraire,
    CreneauHoraireCreate,
    CreneauHoraireUpdate,
)

router = APIRouter(prefix="/creneaux-horaires", tags=["Créneaux Horaires"])


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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
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
    db.commit()
    db.refresh(creneau)
    
    return creneau


@router.put("/{creneau_id}", response_model=CreneauHoraire)
def update_creneau_horaire(
    creneau_id: int,
    creneau_in: CreneauHoraireUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
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
        
        db.commit()
        db.refresh(creneau)
        return creneau
    
    return creneau_horaire_repository.update(db, creneau_id, creneau_in)


@router.delete("/{creneau_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_creneau_horaire(
    creneau_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    """Supprime un créneau horaire"""
    creneau = creneau_horaire_repository.get_by_id(db, creneau_id)
    if not creneau:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Créneau horaire non trouvé"
        )
    creneau_horaire_repository.delete(db, creneau_id)
    return None
