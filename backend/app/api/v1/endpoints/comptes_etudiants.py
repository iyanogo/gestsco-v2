"""
Endpoints API pour la gestion des comptes étudiants
"""

from datetime import date
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.core.portal_access import (
    assert_etudiant_owner,
    resolve_annee_academique_id,
    resolve_etudiant_id,
)
from app.models.user import User
from app.models.mouvement_compte import MouvementCompte
from app.repositories.compte_etudiant_repository import compte_etudiant_repository
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import fields_snapshot
from app.schemas.compte_etudiant import (
    CompteEtudiant,
    CompteEtudiantCreate,
    CompteEtudiantUpdate,
    CompteEtudiantWithDetails,
)

router = APIRouter()

_COMPTE_ETUDIANT_FIELDS = (
    "etudiant_id",
    "annee_academique_id",
    "statut_compte",
    "solde_actuel",
    "total_restant",
)


class BlocageMotif(BaseModel):
    motif: str


@router.get("/", response_model=list[CompteEtudiant])
def get_comptes(
    skip: int = 0,
    limit: int = 100,
    annee_id: int = None,
    statut_compte: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
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
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les comptes débiteurs (avec dette)."""
    return compte_etudiant_repository.get_debiteurs(db, annee_id, seuil_dette)


@router.get("/crediteurs", response_model=list[CompteEtudiant])
def get_comptes_crediteurs(
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "read")),
):
    """Liste les comptes créditeurs (avec avance)."""
    return compte_etudiant_repository.get_crediteurs(db, annee_id)


@router.get("/mon-compte", response_model=CompteEtudiantWithDetails)
def get_mon_compte(
    annee_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Compte financier de l'étudiant connecté (portail)."""
    etudiant_id = resolve_etudiant_id(db, current_user)
    resolved_annee_id = resolve_annee_academique_id(db, etudiant_id, annee_id)
    if resolved_annee_id is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Impossible de déterminer l'année académique pour ce compte",
        )
    compte = compte_etudiant_repository.get_by_etudiant(db, etudiant_id, resolved_annee_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    return compte


@router.get("/etudiant/{etudiant_id}", response_model=CompteEtudiantWithDetails)
def get_compte_etudiant(
    etudiant_id: int,
    annee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """Récupère le compte d'un étudiant."""
    assert_etudiant_owner(current_user, etudiant_id, db)
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

    assert_etudiant_owner(current_user, compte.etudiant_id, db)
    
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

    assert_etudiant_owner(current_user, compte.etudiant_id, db)
    
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
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "create")),
):
    """Crée un nouveau compte étudiant."""
    existing = compte_etudiant_repository.get_by_etudiant(
        db, compte_in.etudiant_id, compte_in.annee_academique_id
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Compte déjà existant")
    compte = compte_etudiant_repository.get_or_create(
        db, compte_in.etudiant_id, compte_in.annee_academique_id
    )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="compte_etudiant",
        entity_id=compte.id,
        new_values=fields_snapshot(compte, *_COMPTE_ETUDIANT_FIELDS),
    )
    return compte


@router.put("/{compte_id}", response_model=CompteEtudiant)
def update_compte(
    compte_id: int,
    compte_in: CompteEtudiantUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Met à jour un compte étudiant."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    old_snapshot = fields_snapshot(compte, *_COMPTE_ETUDIANT_FIELDS)
    updated = compte_etudiant_repository.update(db, compte_id, compte_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="compte_etudiant",
        entity_id=compte_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(updated, *_COMPTE_ETUDIANT_FIELDS),
    )
    return updated


@router.patch("/{compte_id}/bloquer", response_model=CompteEtudiant)
def bloquer_compte(
    compte_id: int,
    data: BlocageMotif,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Bloque un compte étudiant."""
    existing = compte_etudiant_repository.get_by_id(db, compte_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    old_snapshot = fields_snapshot(existing, *_COMPTE_ETUDIANT_FIELDS)
    compte = compte_etudiant_repository.bloquer_compte(db, compte_id, data.motif)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="compte_etudiant",
        entity_id=compte_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(compte, *_COMPTE_ETUDIANT_FIELDS),
        details="bloquer",
    )
    return compte


@router.patch("/{compte_id}/debloquer", response_model=CompteEtudiant)
def debloquer_compte(
    compte_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "update")),
):
    """Débloque un compte étudiant."""
    existing = compte_etudiant_repository.get_by_id(db, compte_id)
    if not existing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    old_snapshot = fields_snapshot(existing, *_COMPTE_ETUDIANT_FIELDS)
    compte = compte_etudiant_repository.debloquer_compte(db, compte_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="compte_etudiant",
        entity_id=compte_id,
        old_values=old_snapshot,
        new_values=fields_snapshot(compte, *_COMPTE_ETUDIANT_FIELDS),
        details="debloquer",
    )
    return compte


@router.delete("/{compte_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compte(
    compte_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("finances", "delete")),
):
    """Supprime un compte étudiant."""
    compte = compte_etudiant_repository.get_by_id(db, compte_id)
    if not compte:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compte non trouvé")
    old_snapshot = fields_snapshot(compte, *_COMPTE_ETUDIANT_FIELDS)
    compte_etudiant_repository.hard_delete(db, compte_id)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="compte_etudiant",
        entity_id=compte_id,
        old_values=old_snapshot,
    )
    return None
