"""
Endpoints API pour la gestion des factures
"""

from datetime import date, timedelta
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user, get_current_superuser
from app.models.user import User
from app.repositories.facture_repository import facture_repository
from app.repositories.frais_scolarite_repository import frais_scolarite_repository
from app.repositories.etudiant_repository import etudiant_repository
from app.schemas.facture import (
    Facture,
    FactureCreate,
    FactureUpdate,
    FactureWithDetails,
    FactureAnnuler,
)
from app.schemas.ligne_facture import LigneFactureCreate

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
        return facture_repository.get_by_etudiant(db, etudiant_id, annee_id)
    if statut:
        return facture_repository.get_by_statut(db, statut, skip, limit)
    return facture_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/impayees", response_model=list[Facture])
def get_factures_impayees(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les factures impayées."""
    return facture_repository.get_impayees(db, skip, limit)


@router.get("/expirees", response_model=list[Facture])
def get_factures_expirees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les factures expirées."""
    return facture_repository.get_expirees(db)


@router.get("/statistiques", response_model=FactureStatistiques)
def get_statistiques_factures(
    annee_id: int = None,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Calcule les statistiques des factures."""
    return facture_repository.calculer_statistiques(db, annee_id, date_debut, date_fin)


@router.get("/etudiant/{etudiant_id}", response_model=list[Facture])
def get_factures_etudiant(
    etudiant_id: int,
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les factures d'un étudiant."""
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Crée une nouvelle facture avec ses lignes."""
    return facture_repository.create_with_lignes(db, facture_in, current_user.id)


@router.post("/generer-automatique", response_model=Facture, status_code=status.HTTP_201_CREATED)
def generer_facture_automatique(
    data: FactureAutoCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Génère automatiquement une facture avec les frais obligatoires."""
    etudiant = etudiant_repository.get_by_id(db, data.etudiant_id)
    if not etudiant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Étudiant non trouvé")
    
    frais_list = frais_scolarite_repository.get_by_niveau(db, etudiant.niveau_id, data.annee_id)
    if not frais_list:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Aucun frais trouvé pour ce niveau")
    
    lignes = []
    for frais in frais_list:
        ligne = LigneFactureCreate(
            libelle=frais.type_frais.libelle if frais.type_frais else f"Frais #{frais.id}",
            description=frais.description,
            quantite=1,
            prix_unitaire=frais.montant,
            tva_taux=0,
            frais_scolarite_id=frais.id,
        )
        lignes.append(ligne)
    
    facture_create = FactureCreate(
        etudiant_id=data.etudiant_id,
        annee_academique_id=data.annee_id,
        date_echeance=date.today() + timedelta(days=30),
        type_facture=data.type_facture,
        description=f"Facture {data.type_facture} générée automatiquement",
        lignes=lignes,
    )
    
    return facture_repository.create_with_lignes(db, facture_create, current_user.id)


@router.put("/{facture_id}", response_model=Facture)
def update_facture(
    facture_id: int,
    facture_in: FactureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour une facture."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    if facture.statut in ["payee", "annulee"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de modifier cette facture")
    return facture_repository.update(db, facture_id, facture_in)


@router.patch("/{facture_id}/valider", response_model=Facture)
def valider_facture(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Valide une facture."""
    facture = facture_repository.valider_facture(db, facture_id, current_user.id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    return facture


@router.patch("/{facture_id}/annuler", response_model=Facture)
def annuler_facture(
    facture_id: int,
    data: FactureAnnuler,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Annule une facture."""
    facture = facture_repository.annuler_facture(db, facture_id, current_user.id, data.motif_annulation)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    return facture


@router.delete("/{facture_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_facture(
    facture_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime une facture."""
    facture = facture_repository.get_by_id(db, facture_id)
    if not facture:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Facture non trouvée")
    facture_repository.hard_delete(db, facture_id)
    return None
