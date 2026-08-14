"""
Endpoints API pour la gestion des paiements de factures
"""

from datetime import date
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user, get_current_superuser
from app.models.user import User
from app.repositories.paiement_facture_repository import paiement_facture_repository
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
        return paiement_facture_repository.get_by_facture(db, facture_id)
    if etudiant_id:
        return paiement_facture_repository.get_by_etudiant(db, etudiant_id, date_debut, date_fin)
    if statut:
        return paiement_facture_repository.get_by_statut(db, statut)
    return paiement_facture_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/en-attente", response_model=list[PaiementFacture])
def get_paiements_en_attente(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les paiements en attente de validation."""
    return paiement_facture_repository.get_en_attente_validation(db)


@router.get("/statistiques", response_model=PaiementStatistiques)
def get_statistiques_paiements(
    annee_id: int = None,
    mode_paiement: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Calcule les statistiques des paiements."""
    return paiement_facture_repository.calculer_statistiques(db, annee_id, mode_paiement)


@router.get("/etudiant/{etudiant_id}", response_model=list[PaiementFacture])
def get_paiements_etudiant(
    etudiant_id: int,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les paiements d'un étudiant."""
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Crée un nouveau paiement."""
    return paiement_facture_repository.create_paiement(db, paiement_in, current_user.id)


@router.post("/enregistrer", response_model=PaiementFacture, status_code=status.HTTP_201_CREATED)
def enregistrer_paiement(
    paiement_in: PaiementFactureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Enregistre un paiement (scolarité)."""
    return paiement_facture_repository.create_paiement(db, paiement_in, current_user.id)


@router.put("/{paiement_id}", response_model=PaiementFacture)
def update_paiement(
    paiement_id: int,
    paiement_in: PaiementFactureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour un paiement."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    if paiement.statut != "en_attente":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Paiement déjà traité")
    return paiement_facture_repository.update(db, paiement_id, paiement_in)


@router.patch("/{paiement_id}/valider", response_model=PaiementFacture)
def valider_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Valide un paiement."""
    paiement = paiement_facture_repository.valider_paiement(db, paiement_id, current_user.id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé ou déjà traité")
    return paiement


@router.patch("/{paiement_id}/rejeter", response_model=PaiementFacture)
def rejeter_paiement(
    paiement_id: int,
    data: PaiementFactureRejeter,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Rejette un paiement."""
    paiement = paiement_facture_repository.rejeter_paiement(db, paiement_id, current_user.id, data.motif_rejet)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    return paiement


@router.patch("/{paiement_id}/annuler", response_model=PaiementFacture)
def annuler_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Annule un paiement."""
    paiement = paiement_facture_repository.annuler_paiement(db, paiement_id, current_user.id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    return paiement


@router.delete("/{paiement_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_paiement(
    paiement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime un paiement."""
    paiement = paiement_facture_repository.get_by_id(db, paiement_id)
    if not paiement:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Paiement non trouvé")
    paiement_facture_repository.hard_delete(db, paiement_id)
    return None
