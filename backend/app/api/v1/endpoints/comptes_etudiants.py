"""
Endpoints API pour la gestion des comptes étudiants
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
from app.models.mouvement_compte import MouvementCompte
from app.repositories.compte_etudiant_repository import compte_etudiant_repository
from app.schemas.compte_etudiant import (
    CompteEtudiant,
    CompteEtudiantCreate,
    CompteEtudiantUpdate,
    CompteEtudiantWithDetails,
)

router = APIRouter()


class BlocageMotif(BaseModel):
    motif: str


@router.get("/", response_model=list[CompteEtudiant])
def get_comptes(
    skip: int = 0,
    limit: int = 100,
    annee_id: int = None,
    statut_compte: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste tous les comptes étudiants."""
    if annee_id and statut_compte:
        return compte_etudiant_repository.get_by_statut(db, statut_compte, annee_id)
    if annee_id:
        return compte_etudiant_repository.get_by_annee(db, annee_id)
    if statut_compte:
        return compte_etudiant_repository.get_by_statut(db, statut_compte)
    return compte_etudiant_repository.get_all(db, skip=skip, limit=limit, include_inactive=True)


@router.get("/debiteurs", response_model=list[CompteEtudiant])
def get_comptes_debiteurs(
    annee_id: int = None,
    seuil_dette: float = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les comptes débiteurs (avec dette)."""
    return compte_etudiant_repository.get_debiteurs(db, annee_id, seuil_dette)


@router.get("/crediteurs", response_model=list[CompteEtudiant])
def get_comptes_crediteurs(
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Liste les comptes créditeurs (avec avance)."""
    return compte_etudiant_repository.get_crediteurs(db, annee_id)


@router.get("/etudiant/{etudiant_id}", response_model=CompteEtudiantWithDetails)
def get_compte_etudiant(
    etudiant_id: int,
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère le compte d'un étudiant."""
    compte = compte_etudiant_repository.get_by_etudiant(db, etudiant_id, annee_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    return compte


@router.get("/{compte_id}/mouvements")
def get_mouvements_compte(
    compte_id: int,
    skip: int = 0,
    limit: int = 100,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Liste les mouvements d'un compte."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    
    query = db.query(MouvementCompte).filter(MouvementCompte.compte_id == compte_id)
    if date_debut:
        query = query.filter(MouvementCompte.date_mouvement >= date_debut)
    if date_fin:
        query = query.filter(MouvementCompte.date_mouvement <= date_fin)
    
    return query.order_by(MouvementCompte.date_mouvement.desc()).offset(skip).limit(limit).all()


@router.get("/{compte_id}/releve")
def get_releve_compte(
    compte_id: int,
    date_debut: date = None,
    date_fin: date = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Génère le relevé de compte PDF."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    
    from app.services.compte_service import generer_releve_compte_pdf
    pdf_bytes = generer_releve_compte_pdf(db, compte_id, date_debut, date_fin)
    
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=releve_compte_{compte_id}.pdf"}
    )


@router.post("/", response_model=CompteEtudiant, status_code=status.HTTP_201_CREATED)
def create_compte(
    compte_in: CompteEtudiantCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Crée un nouveau compte étudiant."""
    existing = compte_etudiant_repository.get_by_etudiant(
        db, compte_in.etudiant_id, compte_in.annee_academique_id
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Compte déjà existant")
    return compte_etudiant_repository.get_or_create(
        db, compte_in.etudiant_id, compte_in.annee_academique_id
    )


@router.put("/{compte_id}", response_model=CompteEtudiant)
def update_compte(
    compte_id: int,
    compte_in: CompteEtudiantUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Met à jour un compte étudiant."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    return compte_etudiant_repository.update(db, compte_id, compte_in)


@router.patch("/{compte_id}/bloquer", response_model=CompteEtudiant)
def bloquer_compte(
    compte_id: int,
    data: BlocageMotif,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Bloque un compte étudiant."""
    compte = compte_etudiant_repository.bloquer_compte(db, compte_id, data.motif)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    return compte


@router.patch("/{compte_id}/debloquer", response_model=CompteEtudiant)
def debloquer_compte(
    compte_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """Débloque un compte étudiant."""
    compte = compte_etudiant_repository.debloquer_compte(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    return compte


@router.delete("/{compte_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compte(
    compte_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser),
):
    """Supprime un compte étudiant."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    compte_etudiant_repository.hard_delete(db, compte_id)
    return None
