"""
Endpoints API pour la gestion des inscriptions aux matières
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.permissions import get_current_scolarite_user
from app.models.user import User
from app.repositories import inscription_matiere_repository, inscription_repository
from app.schemas.inscription_matiere import (
    InscriptionMatiere,
    InscriptionMatiereCreate,
)

router = APIRouter(prefix="/inscriptions-matieres", tags=["Inscriptions Matières"])


@router.get("/inscription/{inscription_id}", response_model=list[InscriptionMatiere], summary="Matières d'une inscription")
async def get_matieres_by_inscription(
    inscription_id: int,
    semestre: Optional[int] = Query(None, ge=1, le=2, description="Filtrer par semestre (1 ou 2)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    """
    Liste les matières d'une inscription.
    
    - **semestre**: Optionnel, filtrer par semestre (1 ou 2)
    """
    # Vérifier que l'inscription existe
    inscription = inscription_repository.get_by_id(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    
    if semestre:
        return inscription_matiere_repository.get_by_semestre(db, inscription_id, semestre)
    
    return inscription_matiere_repository.get_by_inscription(db, inscription_id)


@router.post("/", response_model=InscriptionMatiere, status_code=status.HTTP_201_CREATED, summary="Inscrire à une matière")
async def create_inscription_matiere(
    inscription_matiere_in: InscriptionMatiereCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Inscrit un étudiant à une matière.
    
    Requiert les droits admin ou scolarité.
    """
    # Vérifier que l'inscription existe
    inscription = inscription_repository.get_by_id(db, inscription_matiere_in.inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    
    # Vérifier que l'inscription matière n'existe pas déjà
    if inscription_matiere_repository.inscription_matiere_exists(
        db,
        inscription_matiere_in.inscription_id,
        inscription_matiere_in.matiere_id
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'étudiant est déjà inscrit à cette matière"
        )
    
    return inscription_matiere_repository.create(db, inscription_matiere_in)


@router.post("/bulk", summary="Inscrire à plusieurs matières")
async def bulk_create_inscription_matieres(
    bulk_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Inscrit un étudiant à plusieurs matières en une fois.
    
    Body: {
        "inscription_id": int,
        "matiere_ids": [int, int, ...],
        "semestre": int (1 ou 2)
    }
    
    Requiert les droits admin ou scolarité.
    """
    inscription_id = bulk_data.get("inscription_id")
    matiere_ids = bulk_data.get("matiere_ids", [])
    semestre = bulk_data.get("semestre")
    
    if not inscription_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="inscription_id est requis"
        )
    
    if not matiere_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="matiere_ids est requis et ne peut pas être vide"
        )
    
    if not semestre or semestre not in [1, 2]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="semestre est requis et doit être 1 ou 2"
        )
    
    # Vérifier que l'inscription existe
    inscription = inscription_repository.get_by_id(db, inscription_id)
    if not inscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription non trouvée"
        )
    
    created = inscription_matiere_repository.bulk_create(
        db,
        inscription_id,
        matiere_ids,
        semestre
    )
    
    return {
        "message": f"{len(created)} inscription(s) matière(s) créée(s)",
        "created_count": len(created),
        "inscriptions_matieres": created
    }


@router.delete("/{inscription_matiere_id}", summary="Supprimer une inscription matière")
async def delete_inscription_matiere(
    inscription_matiere_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_scolarite_user),
):
    """
    Supprime une inscription matière.
    
    Requiert les droits admin ou scolarité.
    """
    success = inscription_matiere_repository.delete(db, inscription_matiere_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inscription matière non trouvée"
        )
    return {"message": "Inscription matière supprimée avec succès"}
