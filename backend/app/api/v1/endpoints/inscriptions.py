"""
Endpoints API pour la gestion des inscriptions
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories import inscription_repository, etudiant_repository
from app.schemas.inscription import (
    Inscription,
    InscriptionCreate,
    InscriptionUpdate,
)

router = APIRouter(prefix="/inscriptions", tags=["Inscriptions"])


@router.get("/", response_model=list[Inscription], summary="Liste des inscriptions")
async def list_inscriptions(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à ignorer"),
    limit: int = Query(100, ge=1, le=500, description="Nombre maximum d'éléments"),
    etudiant_id: Optional[int] = Query(None, description="Filtrer par étudiant"),
    filiere_id: Optional[int] = Query(None, description="Filtrer par filière"),
    niveau_id: Optional[int] = Query(None, description="Filtrer par niveau"),
    annee_academique: Optional[str] = Query(None, description="Filtrer par année académique"),
    statut: Optional[str] = Query(None, description="Filtrer par statut"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère la liste des inscriptions avec pagination et filtres.
    
    - **etudiant_id**: Filtrer par ID d'étudiant
    - **filiere_id**: Filtrer par ID de filière
    - **niveau_id**: Filtrer par ID de niveau
    - **annee_academique**: Filtrer par année (ex: 2024-2025)
    - **statut**: Filtrer par statut (en_cours, validee, annulee)
    """
    if etudiant_id:
        return inscription_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)
    
    if filiere_id:
        return inscription_repository.get_by_filiere(db, filiere_id, annee=annee_academique)
    
    if annee_academique:
        return inscription_repository.get_by_annee_academique(db, annee_academique, skip=skip, limit=limit)
    
    return inscription_repository.get_all(db, skip=skip, limit=limit)


@router.get("/count", summary="Nombre d'inscriptions")
async def count_inscriptions(
    annee_academique: Optional[str] = Query(None, description="Filtrer par année académique"),
    filiere_id: Optional[int] = Query(None, description="Filtrer par filière"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retourne le nombre total d'inscriptions.
    """
    total = inscription_repository.get_count_by_annee(db, annee=annee_academique, filiere_id=filiere_id)
    return {"total": total}


@router.get("/statistiques/{annee_academique}", summary="Statistiques d'une année")
async def get_statistiques_annee(
    annee_academique: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Retourne les statistiques des inscriptions pour une année académique.
    
    - **total**: Nombre total d'inscriptions
    - **par_filiere**: Répartition par filière
    - **par_niveau**: Répartition par niveau
    - **par_statut**: Répartition par statut
    """
    return inscription_repository.get_statistiques_annee(db, annee_academique)


@router.get("/{inscription_id}", response_model=Inscription, summary="Détails d'une inscription")
async def get_inscription(
    inscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une inscription par son ID.
    """
    inscription = inscription_repository.get_by_id(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    return inscription


@router.get("/{inscription_id}/matieres", summary="Inscription avec matières")
async def get_inscription_with_matieres(
    inscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère une inscription avec ses matières inscrites.
    """
    inscription = inscription_repository.get_with_matieres(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    return inscription


@router.get("/etudiant/{etudiant_id}", response_model=list[Inscription], summary="Inscriptions d'un étudiant")
async def get_inscriptions_by_etudiant(
    etudiant_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les inscriptions d'un étudiant spécifique.
    """
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    return inscription_repository.get_by_etudiant(db, etudiant_id, skip=skip, limit=limit)


@router.get("/etudiant/{etudiant_id}/current", response_model=Inscription, summary="Inscription active")
async def get_current_inscription(
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Récupère l'inscription active de l'étudiant pour l'année en cours.
    """
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    inscription = inscription_repository.get_current_inscription(db, etudiant_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Aucune inscription active trouvée pour cet étudiant"
        )
    return inscription


@router.post("/", response_model=Inscription, status_code=status.HTTP_201_CREATED, summary="Créer une inscription")
async def create_inscription(
    inscription_in: InscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Crée une nouvelle inscription.
    
    Vérifie qu'il n'existe pas déjà une inscription pour cet étudiant/année/niveau.
    
    Requiert les droits admin ou scolarité.
    """
    # Vérifier que l'étudiant existe
    etudiant = etudiant_repository.get_by_id(db, inscription_in.etudiant_id)
    if not etudiant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Étudiant non trouvé"
        )
    
    # Vérifier qu'il n'existe pas déjà une inscription
    if inscription_repository.inscription_exists(
        db,
        inscription_in.etudiant_id,
        inscription_in.annee_academique,
        inscription_in.niveau_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une inscription existe déjà pour cet étudiant, cette année et ce niveau"
        )
    
    return inscription_repository.create(db, inscription_in)


@router.put("/{inscription_id}", response_model=Inscription, summary="Modifier une inscription")
async def update_inscription(
    inscription_id: int,
    inscription_in: InscriptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Met à jour une inscription existante.
    
    Requiert les droits admin ou scolarité.
    """
    inscription = inscription_repository.get_by_id(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    
    return inscription_repository.update(db, inscription_id, inscription_in)


@router.patch("/{inscription_id}/valider", response_model=Inscription, summary="Valider une inscription")
async def valider_inscription(
    inscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Valide une inscription (statut = validee).
    
    Requiert les droits admin ou scolarité.
    """
    inscription = inscription_repository.valider_inscription(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    return inscription


@router.patch("/{inscription_id}/annuler", response_model=Inscription, summary="Annuler une inscription")
async def annuler_inscription(
    inscription_id: int,
    annulation_data: Optional[dict] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Annule une inscription (statut = annulee).
    
    Body optionnel: {"raison": "..."}
    
    Requiert les droits admin ou scolarité.
    """
    raison = annulation_data.get("raison") if annulation_data else None
    
    inscription = inscription_repository.annuler_inscription(db, inscription_id, raison)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    return inscription


@router.delete("/{inscription_id}", summary="Supprimer une inscription")
async def delete_inscription(
    inscription_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Supprime une inscription (suppression logique).
    
    Requiert les droits admin ou scolarité.
    """
    success = inscription_repository.delete(db, inscription_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    return {"message": "Inscription supprimée avec succès"}
