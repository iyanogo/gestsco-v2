"""
Endpoints API pour la gestion des paiements
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, get_current_superuser, get_current_scolarite_user
from app.models.user import User
from app.repositories.paiement_repository import paiement_repository
from app.schemas.paiement import (
    Paiement,
    PaiementCreate,
    PaiementUpdate,
)

router = APIRouter(prefix="/paiements", tags=["Paiements"])


class ValidationRequest(BaseModel):
    numero_recu: str | None = None


class RefusRequest(BaseModel):
    commentaire: str


@router.get("/", response_model=list[Paiement])
def list_paiements(
    skip: int = 0,
    limit: int = 100,
    statut: str = Query(None, description="Filtrer par statut"),
    dossier_id: int = Query(None, description="Filtrer par dossier"),
    inscrit_id: int = Query(None, description="Filtrer par inscription"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste tous les paiements."""
    if dossier_id:
        return paiement_repository.get_by_dossier(db, dossier_id)
    if inscrit_id:
        return paiement_repository.get_by_inscrit(db, inscrit_id)
    if statut:
        return paiement_repository.get_by_statut(db, statut, skip=skip, limit=limit)
    return paiement_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/en-attente", response_model=list[Paiement])
def list_paiements_en_attente(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les paiements en attente de validation."""
    return paiement_repository.get_en_attente(db, skip=skip, limit=limit)


@router.get("/{paiement_id}", response_model=Paiement)
def get_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un paiement par son ID."""
    paiement = paiement_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    return paiement


@router.get("/transaction/{numero}", response_model=Paiement)
def get_paiement_by_transaction(
    numero: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un paiement par son numéro de transaction."""
    paiement = paiement_repository.get_by_numero_transaction(db, numero)
    if not paiement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    return paiement


@router.get("/dossier/{dossier_id}", response_model=list[Paiement])
def list_paiements_by_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les paiements d'un dossier."""
    return paiement_repository.get_by_dossier(db, dossier_id)


@router.get("/dossier/{dossier_id}/total")
def get_total_paiements_dossier(
    dossier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère le montant total des paiements validés pour un dossier."""
    total = paiement_repository.get_montant_total_by_dossier(db, dossier_id)
    return {"dossier_id": dossier_id, "montant_total": total}


@router.post("/", response_model=Paiement, status_code=status.HTTP_201_CREATED)
def create_paiement(
    paiement_in: PaiementCreate,
    db: Session = Depends(get_db),
):
    """
    Enregistre un nouveau paiement.
    Endpoint public - pas d'authentification requise.
    Génère automatiquement le numéro de transaction.
    """
    return paiement_repository.create_with_numero(db, paiement_in)


@router.patch("/{paiement_id}/valider", response_model=Paiement)
def valider_paiement(
    paiement_id: int,
    request: ValidationRequest = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Valide un paiement."""
    numero_recu = request.numero_recu if request else None
    paiement = paiement_repository.valider_paiement(
        db, paiement_id, current_user.id, numero_recu
    )
    if not paiement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    return paiement


@router.patch("/{paiement_id}/refuser", response_model=Paiement)
def refuser_paiement(
    paiement_id: int,
    request: RefusRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Refuse un paiement."""
    paiement = paiement_repository.refuser_paiement(db, paiement_id, request.commentaire)
    if not paiement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    return paiement


@router.delete("/{paiement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime un paiement."""
    success = paiement_repository.hard_delete(db, paiement_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paiement non trouvé"
        )
    return None
