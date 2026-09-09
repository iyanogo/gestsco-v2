"""
Endpoints API pour la gestion des paiements de factures
"""

from datetime import date
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, resolve_etudiant_id
from app.models.user import User
from app.repositories.facture_repository import facture_repository
from app.repositories.paiement_facture_repository import paiement_facture_repository
from app.utils.finance_access import assert_finances_staff_list
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import paiement_snapshot
from app.schemas.paiement_facture import (
    PaiementFacture,
    PaiementFactureCreate,
    PaiementFactureUpdate,
    PaiementFactureWithDetails,
    PaiementFactureValider,
    PaiementFactureRejeter,
)

router = APIRouter()


class PaiementStatistiques(BaseModel):
    total_paiements: int
    montant_total: float
    par_mode_paiement: dict
    par_mois: dict


@router.get("/", response_model=list[PaiementFacture])
def get_paiements(
    skip: int = 0,
    limit: int = 100,
    facture_id: int = None,
    etudiant_id: int = None,
    date_debut: date = None,
    date_fin: date = None,
    statut: str = None,
    mode_paiement: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste tous les paiements avec filtres optionnels."""
    if facture_id:
        facture = facture_repository.get_by_id(db, facture_id)
        if not facture:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
        assert_etudiant_owner(current_user, facture.etudiant_id, db)
        return paiement_facture_repository.get_by_facture(db, facture_id)
    if etudiant_id:
        assert_etudiant_owner(current_user, etudiant_id, db)
        return paiement_facture_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    assert_finances_staff_list(current_user)
    if statut:
        return paiement_facture_repository.get_by_statut(db, statut)
    return paiement_facture_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/en-attente", response_model=list[PaiementFacture])
def get_paiements_en_attente(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les paiements en attente de validation."""
    return paiement_facture_repository.get_en_attente_validation(db)


@router.get("/statistiques", response_model=PaiementStatistiques)
def get_statistiques_paiements(
    annee_id: int = None,
    mode_paiement: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Calcule les statistiques des paiements."""
    return paiement_facture_repository.calculer_statistiques(db, annee_id, mode_paiement)


@router.get("/mes-paiements", response_model=list[PaiementFacture])
def get_mes_paiements(
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Paiements de l'étudiant connecté (portail, lecture seule)."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return paiement_facture_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)


@router.get("/etudiant/{etudiant_id}", response_model=list[PaiementFacture])
def get_paiements_etudiant(
    etudiant_id: int,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les paiements d'un étudiant."""
    assert_etudiant_owner(current_user, etudiant_id, db)
    return paiement_facture_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)


@router.get("/{paiement_id}", response_model=PaiementFactureWithDetails)
def get_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère un paiement par son ID."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    assert_etudiant_owner(current_user, paiement.etudiant_id, db)
    return paiement


@router.get("/{paiement_id}/recu")
def get_recu_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Génère le reçu de paiement PDF."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    assert_etudiant_owner(current_user, paiement.etudiant_id, db)
    if paiement.statut != "valide":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paiement non validé")
    
    from app.services.paiement_service import generer_recu_pdf
    pdf_bytes = generer_recu_pdf(db, paiement_id)
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=recu_{paiement.numero_recu}.pdf"}
    )


@router.post("/", response_model=PaiementFacture, status_code=status.HTTP_201_CREATED)
def create_paiement(
    paiement_in: PaiementFactureCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Crée un nouveau paiement (staff finances)."""
    paiement = paiement_facture_repository.create_paiement(db, paiement_in, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="paiement",
        entity_id=paiement.id,
        new_values=paiement_snapshot(paiement),
    )
    return paiement


@router.post("/enregistrer", response_model=PaiementFacture, status_code=status.HTTP_201_CREATED)
def enregistrer_paiement(
    paiement_in: PaiementFactureCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Enregistre un paiement (scolarité)."""
    paiement = paiement_facture_repository.create_paiement(db, paiement_in, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="paiement",
        entity_id=paiement.id,
        new_values=paiement_snapshot(paiement),
        details="enregistrer",
    )
    return paiement


@router.put("/{paiement_id}", response_model=PaiementFacture)
def update_paiement(
    paiement_id: int,
    paiement_in: PaiementFactureUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour un paiement."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    if paiement.statut != "en_attente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paiement déjà traité")
    old_snapshot = paiement_snapshot(paiement)
    updated = paiement_facture_repository.update(db, paiement_id, paiement_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="paiement",
        entity_id=paiement_id,
        old_values=old_snapshot,
        new_values=paiement_snapshot(updated),
    )
    return updated


@router.patch("/{paiement_id}/valider", response_model=PaiementFacture)
def valider_paiement(
    paiement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "validate")),
):
    """Valide un paiement."""
    existing = paiement_facture_repository.get_by_id(db, paiement_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    old_snapshot = paiement_snapshot(existing)
    paiement = paiement_facture_repository.valider_paiement(db, paiement_id, current_user.id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé ou déjà traité")
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="paiement",
        entity_id=paiement_id,
        old_values=old_snapshot,
        new_values=paiement_snapshot(paiement),
    )
    return paiement


@router.patch("/{paiement_id}/rejeter", response_model=PaiementFacture)
def rejeter_paiement(
    paiement_id: int,
    data: PaiementFactureRejeter,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Rejette un paiement."""
    existing = paiement_facture_repository.get_by_id(db, paiement_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    old_snapshot = paiement_snapshot(existing)
    paiement = paiement_facture_repository.rejeter_paiement(db, paiement_id, current_user.id, data.motif_rejet)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="reject",
        entity_type="paiement",
        entity_id=paiement_id,
        old_values=old_snapshot,
        new_values=paiement_snapshot(paiement),
        details=data.motif_rejet,
    )
    return paiement


@router.patch("/{paiement_id}/annuler", response_model=PaiementFacture)
def annuler_paiement(
    paiement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Annule un paiement."""
    existing = paiement_facture_repository.get_by_id(db, paiement_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    old_snapshot = paiement_snapshot(existing)
    paiement = paiement_facture_repository.annuler_paiement(db, paiement_id, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="cancel",
        entity_type="paiement",
        entity_id=paiement_id,
        old_values=old_snapshot,
        new_values=paiement_snapshot(paiement),
    )
    return paiement


@router.delete("/{paiement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paiement(
    paiement_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """Supprime un paiement."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    old_snapshot = paiement_snapshot(paiement)
    paiement_facture_repository.hard_delete(db, paiement_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="paiement",
        entity_id=paiement_id,
        old_values=old_snapshot,
    )
    return None
