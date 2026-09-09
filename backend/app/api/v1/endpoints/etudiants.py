"""
Endpoints API pour la gestion des étudiants
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.utils.rbac_resolver import require_permission
from app.models.user import User
from app.repositories import etudiant_repository
from app.schemas.etudiant import (
    Etudiant,
    EtudiantCreate,
    EtudiantUpdate,
    EtudiantWithDetails,
)
from app.utils.administration_events import audit_and_commit
from app.utils.audit_snapshots import etudiant_snapshot

router = APIRouter(prefix="/etudiants", tags=["Étudiants"])


@router.get("/", response_model=list[Etudiant], summary="Liste des étudiants")
async def list_etudiants(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    search: Optional[str] = Query(None, description="Recherche dans nom, prénom, matricule, email"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    nom: Optional[str] = Query(None, description="Filtrer par nom"),
    prenom: Optional[str] = Query(None, description="Filtrer par prénom"),
    matricule: Optional[str] = Query(None, description="Filtrer par matricule"),
    annee_academique: Optional[str] = Query(None, description="Filtrer par année académique (via inscriptions)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des étudiants avec pagination et filtres.
    
    - **skip**: Nombre d'éléments à ignorer (pagination)
    - **limit**: Nombre maximum d'éléments à retourner
    - **search**: Recherche globale dans nom, prénom, matricule, email
    - **statut**: Filtrer par statut (actif, suspendu, diplômé, exclu)
    - **nom**: Filtrer par nom (recherche partielle)
    - **prenom**: Filtrer par prénom (recherche partielle)
    - **matricule**: Filtrer par matricule (recherche partielle)
    - **annee_academique**: Filtrer par année académique (étudiants inscrits cette année)
    """
    if search:
        return etudiant_repository.search(db, search, skip=skip, limit=limit)
    
    if any([nom, prenom, matricule, statut, annee_academique]):
        return etudiant_repository.search_advanced(
            db,
            nom=nom,
            prenom=prenom,
            matricule=matricule,
            statut=statut,
            annee_academique=annee_academique,
            skip=skip,
            limit=limit
        )
    
    return etudiant_repository.get_all(db, skip=skip, limit=limit)


@router.get("/count", summary="Nombre d'étudiants")
async def count_etudiants(
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retourne le nombre total d'étudiants.
    
    - **statut**: Optionnel, filtrer par statut
    """
    total = etudiant_repository.get_count_by_statut(db, statut=statut)
    return {"total": total}


@router.get("/statistiques", summary="Statistiques des étudiants")
async def get_statistiques(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retourne les statistiques des étudiants.
    
    - **total**: Nombre total d'étudiants actifs
    - **par_statut**: Répartition par statut
    - **par_sexe**: Répartition par sexe
    """
    return etudiant_repository.get_statistiques(db)


@router.get("/{etudiant_id}", response_model=Etudiant, summary="Détails d'un étudiant")
async def get_etudiant(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un étudiant par son ID.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    return etudiant


@router.get("/matricule/{matricule}", response_model=Etudiant, summary="Étudiant par matricule")
async def get_etudiant_by_matricule(
    matricule: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un étudiant par son matricule.
    """
    etudiant = etudiant_repository.get_by_matricule(db, matricule)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    return etudiant


@router.get("/{etudiant_id}/details", response_model=EtudiantWithDetails, summary="Étudiant avec détails")
async def get_etudiant_details(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère un étudiant avec ses documents et inscriptions.
    """
    etudiant = etudiant_repository.get_with_details(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    return etudiant


@router.post("/", response_model=Etudiant, status_code=status.HTTP_201_CREATED, summary="Créer un étudiant")
async def create_etudiant(
    etudiant_in: EtudiantCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "create")),
):
    """
    Crée un nouvel étudiant.
    
    Le matricule est généré automatiquement au format ETU-YYYY-XXXXX.
    
    Requiert les droits admin ou scolarité.
    """
    # Vérifier si l'email existe déjà
    if etudiant_in.email:
        existing = etudiant_repository.get_by_email(db, etudiant_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un étudiant avec cet email existe déjà"
            )
    
    created = etudiant_repository.create_with_matricule(db, etudiant_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="create",
        entity_type="etudiant",
        entity_id=created.id,
        new_values=etudiant_snapshot(created),
    )
    return created


@router.put("/{etudiant_id}", response_model=Etudiant, summary="Modifier un étudiant")
async def update_etudiant(
    etudiant_id: int,
    etudiant_in: EtudiantUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "update")),
):
    """
    Met à jour un étudiant existant.
    
    Requiert les droits admin ou scolarité.
    """
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Vérifier l'unicité de l'email si modifié
    if etudiant_in.email and etudiant_in.email != etudiant.email:
        existing = etudiant_repository.get_by_email(db, etudiant_in.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un étudiant avec cet email existe déjà"
            )
    
    old_snapshot = etudiant_snapshot(etudiant)
    updated = etudiant_repository.update(db, etudiant_id, etudiant_in)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="etudiant",
        entity_id=etudiant_id,
        old_values=old_snapshot,
        new_values=etudiant_snapshot(updated),
    )
    return updated


@router.patch("/{etudiant_id}/photo", response_model=Etudiant, summary="Modifier la photo")
async def update_photo(
    etudiant_id: int,
    photo_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Met à jour la photo d'un étudiant.
    
    Body: {"photo_url": "https://..."}
    """
    photo_url = photo_data.get("photo_url")
    if not photo_url:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="photo_url est requis"
        )
    
    existing = etudiant_repository.get_by_id(db, etudiant_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )
    old_snapshot = etudiant_snapshot(existing)
    etudiant = etudiant_repository.update_photo(db, etudiant_id, photo_url)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="etudiant",
        entity_id=etudiant_id,
        old_values=old_snapshot,
        new_values=etudiant_snapshot(etudiant),
        details="photo_url",
    )
    return etudiant


@router.patch("/{etudiant_id}/statut", response_model=Etudiant, summary="Changer le statut")
async def change_statut(
    etudiant_id: int,
    statut_data: dict,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "update")),
):
    """
    Change le statut d'un étudiant.
    
    Body: {"statut": "actif|suspendu|diplômé|exclu"}
    
    Requiert les droits admin ou scolarité.
    """
    nouveau_statut = statut_data.get("statut")
    if not nouveau_statut:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="statut est requis"
        )
    
    valid_statuts = ["actif", "suspendu", "diplômé", "exclu", "diplome"]
    if nouveau_statut not in valid_statuts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Statut invalide. Valeurs acceptées: {', '.join(valid_statuts)}"
        )
    
    existing = etudiant_repository.get_by_id(db, etudiant_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )
    old_snapshot = etudiant_snapshot(existing)
    etudiant = etudiant_repository.change_statut(db, etudiant_id, nouveau_statut)
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="update",
        entity_type="etudiant",
        entity_id=etudiant_id,
        old_values=old_snapshot,
        new_values=etudiant_snapshot(etudiant),
        details="statut",
    )
    return etudiant


@router.delete("/{etudiant_id}", summary="Supprimer un étudiant")
async def delete_etudiant(
    etudiant_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("etudiants", "delete")),
):
    """
    Supprime un étudiant (suppression logique).
    
    Requiert les droits admin ou scolarité (matrice RBAC).
    """
    existing = etudiant_repository.get_by_id(db, etudiant_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )
    old_snapshot = etudiant_snapshot(existing)
    success = etudiant_repository.delete(db, etudiant_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé",
        )
    audit_and_commit(
        db,
        request=request,
        user=current_user,
        action="delete",
        entity_type="etudiant",
        entity_id=etudiant_id,
        old_values=old_snapshot,
    )
    return {"message": "Étudiant supprimé avec succès"}
