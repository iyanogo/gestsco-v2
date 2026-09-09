"""
Endpoints API pour la gestion des échéanciers
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories.echeancier_repository import echeancier_repository
from app.schemas.echeancier import (
    Echeancier,
    EcheancierCreate,
    EcheancierUpdate,
    EcheancierWithDetails,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot

router = APIRouter()

_ECHEANCIER_FIELDS = (
    "facture_id",
    "etudiant_id",
    "numero_echeance",
    "date_echeance",
    "montant_echeance",
    "statut",
)


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
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les échéances dans les X prochains jours."""
    return echeancier_repository.get_echeances_proches(db, jours)


@router.get("/retard", response_model=list[Echeancier])
def get_echeances_retard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Crée un échéancier pour une facture."""
    try:
        echeances_data = [
            {"date_echeance": e.date_echeance, "montant_echeance": e.montant_echeance}
            for e in echeancier_in.echeances
        ]
        created = echeancier_repository.create_echeancier(db, echeancier_in.facture_id, echeances_data)
        if created:
            audit_and_commit(
                db,
                request=request,
                user=current_user,
                action="create",
                entity_type="echeancier",
                entity_id=created[0].id,
                new_values={
                    "facture_id": echeancier_in.facture_id,
                    "echeances_count": len(created),
                },
            )
        return created
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{echeancier_id}", response_model=Echeancier)
def update_echeance(
    echeancier_id: int,
    echeancier_in: EcheancierUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour une échéance."""
    echeance = echeancier_repository.get_by_id(db, echeancier_id)
    if not echeance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Échéance non trouvée")
    old_snapshot = fields_snapshot(echeance, *_ECHEANCIER_FIELDS)
    updated = echeancier_repository.update(db, echeancier_id, echeancier_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="echeancier",
        entity_id=echeancier_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_ECHEANCIER_FIELDS),
    )
    return updated


@router.patch("/mettre-a-jour-statuts", response_model=MiseAJourStatutsResponse)
def mettre_a_jour_statuts(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour les statuts des échéances en retard."""
    count = echeancier_repository.mettre_a_jour_statuts(db)
    if count:
        audit_and_commit(
            db,
            request=request,
            user=current_user,
            action="update",
            entity_type="echeancier",
            entity_id="batch",
            new_values={"echeances_mises_a_jour": count},
            details="mettre_a_jour_statuts",
        )
    return {"echeances_mises_a_jour": count}


@router.delete("/{echeancier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_echeance(
    echeancier_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """Supprime une échéance."""
    echeance = echeancier_repository.get_by_id(db, echeancier_id)
    if not echeance:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Échéance non trouvée")
    old_snapshot = fields_snapshot(echeance, *_ECHEANCIER_FIELDS)
    echeancier_repository.hard_delete(db, echeancier_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="echeancier",
        entity_id=echeancier_id,
        old_values=old_snapshot,
    )
    return None
