"""
Endpoints API pour la gestion des factures
"""

from datetime import date
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import assert_etudiant_owner, resolve_etudiant_id
from app.utils.finance_access import assert_finances_staff_list
from app.models.user import User
from app.repositories.facture_repository import facture_repository
from app.repositories.etudiant_repository import etudiant_repository
from app.services.inscription_finance_service import generer_facture_automatique_for_etudiant
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import facture_snapshot
from app.schemas.facture import (
    Facture,
    FactureCreate,
    FactureUpdate,
    FactureWithDetails,
    FactureAnnuler,
)
router = APIRouter()


class FactureStatistiques(BaseModel):
    total_factures: int
    montant_total: float
    montant_paye: float
    montant_restant: float
    taux_recouvrement: float


class FactureAutoCreate(BaseModel):
    etudiant_id: int
    annee_id: int
    type_facture: str = "scolarite"
    niveau_id: int | None = None
    filiere_id: int | None = None


@router.get("/", response_model=list[Facture])
def get_factures(
    skip: int = 0,
    limit: int = 100,
    etudiant_id: int = None,
    annee_id: int = None,
    statut: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste toutes les factures avec filtres optionnels."""
    if etudiant_id:
        assert_etudiant_owner(current_user, etudiant_id, db)
        return facture_repository.get_by_etudiant(db, etudiant_id, annee_id)
    assert_finances_staff_list(current_user)
    if statut:
        return facture_repository.get_by_statut(db, statut, skip, limit)
    return facture_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/impayees", response_model=list[Facture])
def get_factures_impayees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les factures impayées."""
    return facture_repository.get_impayees(db, skip, limit)


@router.get("/expirees", response_model=list[Facture])
def get_factures_expirees(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les factures expirées."""
    return facture_repository.get_expirees(db)


@router.get("/statistiques", response_model=FactureStatistiques)
def get_statistiques_factures(
    annee_id: int = None,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Calcule les statistiques des factures."""
    return facture_repository.calculer_statistiques(db, annee_id, date_debut, date_fin)


@router.get("/mes-factures", response_model=list[Facture])
def get_mes_factures(
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Factures de l'étudiant connecté (portail)."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    return facture_repository.get_by_etudiant(db, etudiant_id, annee_id)


@router.get("/etudiant/{etudiant_id}", response_model=list[Facture])
def get_factures_etudiant(
    etudiant_id: int,
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les factures d'un étudiant."""
    assert_etudiant_owner(current_user, etudiant_id, db)
    return facture_repository.get_by_etudiant(db, etudiant_id, annee_id)


@router.get("/{facture_id}", response_model=FactureWithDetails)
def get_facture(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère une facture par son ID avec tous les détails."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    assert_etudiant_owner(current_user, facture.etudiant_id, db)
    return facture


@router.get("/{facture_id}/pdf")
def get_facture_pdf(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Génère le PDF de la facture."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")

    assert_etudiant_owner(current_user, facture.etudiant_id, db)
    
    from app.services.facture_service import generer_facture_pdf
    pdf_bytes = generer_facture_pdf(db, facture_id)
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=facture_{facture.numero_facture}.pdf"}
    )


@router.post("/", response_model=Facture, status_code=status.HTTP_201_CREATED)
def create_facture(
    facture_in: FactureCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Crée une nouvelle facture avec ses lignes."""
    facture = facture_repository.create_with_lignes(db, facture_in, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="facture",
        entity_id=facture.id,
        new_values=facture_snapshot(facture),
    )
    return facture


@router.post("/generer-automatique", response_model=Facture, status_code=status.HTTP_201_CREATED)
def generer_facture_automatique(
    data: FactureAutoCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Génère automatiquement une facture avec les frais obligatoires."""
    etudiant = etudiant_repository.get_by_id(db, data.etudiant_id)
    if not etudiant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Étudiant non trouvé")

    facture = generer_facture_automatique_for_etudiant(
        db,
        data.etudiant_id,
        data.annee_id,
        current_user.id,
        type_facture=data.type_facture,
        niveau_id=data.niveau_id,
        filiere_id=data.filiere_id,
    )
    if not facture:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Aucun frais applicable ou facture déjà existante pour cet étudiant",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="facture",
        entity_id=facture.id,
        new_values=facture_snapshot(facture),
        details="generer-automatique",
    )
    return facture


@router.put("/{facture_id}", response_model=Facture)
def update_facture(
    facture_id: int,
    facture_in: FactureUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour une facture."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    if facture.statut in ["payee", "annulee"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de modifier cette facture")
    old_snapshot = facture_snapshot(facture)
    updated = facture_repository.update(db, facture_id, facture_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="facture",
        entity_id=facture_id,
        old_values=old_snapshot,
        new_values=facture_snapshot(updated),
    )
    return updated


@router.patch("/{facture_id}/valider", response_model=Facture)
def valider_facture(
    facture_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "validate")),
):
    """Valide une facture."""
    existing = facture_repository.get_by_id(db, facture_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    old_snapshot = facture_snapshot(existing)
    facture = facture_repository.valider_facture(db, facture_id, current_user.id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="validate",
        entity_type="facture",
        entity_id=facture_id,
        old_values=old_snapshot,
        new_values=facture_snapshot(facture),
    )
    return facture


@router.patch("/{facture_id}/annuler", response_model=Facture)
def annuler_facture(
    facture_id: int,
    data: FactureAnnuler,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Annule une facture."""
    existing = facture_repository.get_by_id(db, facture_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    old_snapshot = facture_snapshot(existing)
    facture = facture_repository.annuler_facture(db, facture_id, current_user.id, data.motif_annulation)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="cancel",
        entity_type="facture",
        entity_id=facture_id,
        old_values=old_snapshot,
        new_values=facture_snapshot(facture),
        details=data.motif_annulation,
    )
    return facture


@router.delete("/{facture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facture(
    facture_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """Supprime une facture."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    old_snapshot = facture_snapshot(facture)
    facture_repository.hard_delete(db, facture_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="facture",
        entity_id=facture_id,
        old_values=old_snapshot,
    )
    return None
