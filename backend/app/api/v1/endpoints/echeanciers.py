"""
Endpoints API pour la gestion des échéanciers
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories.echeancier_repository import echeancier_repository
from app.schemas.echeancier import (
    Echeancier,
    EcheancierCreate,
    EcheancierUpdate,
    EcheancierWithDetails,
)

router = APIRouter()


class MiseAJourStatutsResponse(BaseModel):
    echeances_mises_a_jour: int


@router.get("/", response_model=list[Echeancier])
def get_echeanciers(
    skip: int = 0,
    limit: int = 100,
    etudiant_id: int = None,
    facture_id: int = None,
    statut: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste tous les échéanciers avec filtres optionnels."""
    if facture_id:
        return echeancier_repository.get_by_facture(db, facture_id)
    if etudiant_id:
        return echeancier_repository.get_by_etudiant(db, etudiant_id, statut)
    return echeancier_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/proches", response_model=list[Echeancier])
def get_echeances_proches(
    jours: int = 7,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les échéances dans les X prochains jours."""
    return echeancier_repository.get_echeances_proches(db, jours)


@router.get("/retard", response_model=list[Echeancier])
def get_echeances_retard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les échéances en retard."""
    return echeancier_repository.get_echeances_retard(db)


@router.get("/facture/{facture_id}", response_model=list[Echeancier])
def get_echeancier_facture(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les échéances d'une facture."""
    return echeancier_repository.get_by_facture(db, facture_id)


@router.get("/etudiant/{etudiant_id}", response_model=list[Echeancier])
def get_echeances_etudiant(
    etudiant_id: int,
    statut: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les échéances d'un étudiant."""
    return echeancier_repository.get_by_etudiant(db, etudiant_id, statut)


@router.post("/", response_model=list[Echeancier], status_code=status.HTTP_201_CREATED)
def create_echeancier(
    echeancier_in: EcheancierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Crée un échéancier pour une facture."""
    try:
        echeances_data = [
            {"date_echeance": e.date_echeance, "montant_echeance": e.montant_echeance}
            for e in echeancier_in.echeances
        ]
        return echeancier_repository.create_echeancier(db, echeancier_in.facture_id, echeances_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{echeancier_id}", response_model=Echeancier)
def update_echeance(
    echeancier_id: int,
    echeancier_in: EcheancierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour une échéance."""
    echeance = echeancier_repository.get_by_id(db, echeancier_id)
    if not echeance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Échéance non trouvée")
    return echeancier_repository.update(db, echeancier_id, echeancier_in)


@router.patch("/mettre-a-jour-statuts", response_model=MiseAJourStatutsResponse)
def mettre_a_jour_statuts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour les statuts des échéances en retard."""
    count = echeancier_repository.mettre_a_jour_statuts(db)
    return {"echeances_mises_a_jour": count}


@router.delete("/{echeancier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_echeance(
    echeancier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Supprime une échéance."""
    echeance = echeancier_repository.get_by_id(db, echeancier_id)
    if not echeance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Échéance non trouvée")
    echeancier_repository.hard_delete(db, echeancier_id)
    return None
